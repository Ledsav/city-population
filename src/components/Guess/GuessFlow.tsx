import { ArrowLeft, Check } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { formatFull, formatSpoken, parsePopulation } from '../../lib/perception';
import type { City, Estimate } from '../../services/firebase';
import { Logo } from '../Logo/Logo';
import './Guess.css';

type GuessFlowProps = {
  cities: City[];
  onSubmit: (estimates: Estimate[]) => Promise<void>;
  onCancel: () => void;
};

const CONFIDENCE = ['Pure guess', 'Unsure', 'Fairly sure', 'Confident', 'I know this'];

export const GuessFlow = ({ cities, onSubmit, onCancel }: GuessFlowProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<number | null>(null); // null = picking cities
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  if (step === null) {
    const allSelected = selected.length === cities.length;
    return (
      <div className="guess">
        <header className="guess-bar">
          <button className="btn btn-text" onClick={onCancel}>
            <ArrowLeft size={18} aria-hidden="true" /> Back
          </button>
          <Logo size={28} />
        </header>

        <main className="guess-main">
          <h1 className="guess-title">Which cities do you want to guess?</h1>
          <p className="guess-lede">Pick a few you have a hunch about, or all of them.</p>

          <ul className="pick-grid">
            {cities.map((city) => {
              const on = selected.includes(city.id);
              return (
                <li key={city.id}>
                  <button
                    className={`pick-card${on ? ' is-on' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggle(city.id)}
                  >
                    <span className="pick-name">{city.name}</span>
                    <span className="pick-country">{city.country}</span>
                    <span className="pick-check" aria-hidden="true">
                      {on && <Check size={14} strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </main>

        <footer className="guess-footer">
          <button
            className="btn btn-text"
            onClick={() => setSelected(allSelected ? [] : cities.map((c) => c.id))}
          >
            {allSelected ? 'Clear selection' : 'Select all'}
          </button>
          <button className="btn btn-primary" disabled={!selected.length} onClick={() => setStep(0)}>
            {selected.length
              ? `Guess ${selected.length} ${selected.length === 1 ? 'city' : 'cities'}`
              : 'Pick at least one city'}
          </button>
        </footer>
      </div>
    );
  }

  const city = cities.find((c) => c.id === selected[step])!;
  const isLast = step === selected.length - 1;

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(
        selected.map((id) => ({
          cityId: id,
          estimatedPopulation: parsePopulation(drafts[id])!,
          confidenceLevel: confidence[id] ?? 3,
        }))
      );
    } catch {
      setSubmitError("Your guesses weren't saved. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="guess">
      <header className="guess-bar">
        <button
          className="btn btn-text"
          onClick={() => (step === 0 ? setStep(null) : setStep(step - 1))}
          disabled={submitting}
        >
          <ArrowLeft size={18} aria-hidden="true" /> {step === 0 ? 'Change cities' : 'Previous'}
        </button>
        <span className="guess-progress-label num">
          {step + 1} of {selected.length}
        </span>
      </header>
      <div className="guess-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${(step + 1) / selected.length})` }} />
      </div>

      <main className="guess-main guess-main--single">
        <CityGuess
          key={city.id}
          city={city}
          draft={drafts[city.id] ?? ''}
          confidence={confidence[city.id] ?? 3}
          onDraft={(value) => setDrafts((d) => ({ ...d, [city.id]: value }))}
          onConfidence={(value) => setConfidence((c) => ({ ...c, [city.id]: value }))}
          submitLabel={isLast ? (submitting ? 'Saving…' : 'See the results') : 'Next city'}
          submitting={submitting}
          onNext={() => (isLast ? submit() : setStep(step + 1))}
        />
        {submitError && (
          <p className="guess-error" role="alert">
            {submitError}
          </p>
        )}
      </main>
    </div>
  );
};

type CityGuessProps = {
  city: City;
  draft: string;
  confidence: number;
  submitLabel: string;
  submitting: boolean;
  onDraft: (value: string) => void;
  onConfidence: (value: number) => void;
  onNext: () => void;
};

const CityGuess = ({
  city,
  draft,
  confidence,
  submitLabel,
  submitting,
  onDraft,
  onConfidence,
  onNext,
}: CityGuessProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);
  const value = parsePopulation(draft);
  const invalid = draft.trim() !== '' && value === null;

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (value !== null && !submitting) onNext();
  };

  // Reformat digits with separators as they type; leave shorthand like "8.8m" alone.
  const handleChange = (raw: string) => {
    const digits = raw.replace(/[,\s]/g, '');
    onDraft(/^\d+$/.test(digits) ? formatFull(Number(digits)) : raw);
  };

  return (
    <form className="city-guess" onSubmit={handleSubmit} noValidate>
      <p className="city-guess-country">{city.country}</p>
      <h1 className="city-guess-name">{city.name}</h1>

      <label className="field">
        <span className="field-label">How many people live here?</span>
        <input
          ref={inputRef}
          className="population-input num"
          inputMode="decimal"
          autoComplete="off"
          placeholder="e.g. 4,500,000 or 4.5m"
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          aria-invalid={invalid || (touched && value === null)}
          aria-describedby="population-hint"
        />
        <span
          id="population-hint"
          className={`field-hint${invalid || (touched && value === null) ? ' is-error' : ''}`}
          aria-live="polite"
        >
          {value !== null
            ? `That's ${formatSpoken(value)} people`
            : invalid
            ? 'Use digits, or shorthand like 850k or 4.5m'
            : touched
            ? 'Enter a number to continue'
            : 'Digits or shorthand like 850k, 4.5m'}
        </span>
      </label>

      <fieldset className="field confidence">
        <legend className="field-label">How sure are you?</legend>
        <div className="confidence-scale">
          {CONFIDENCE.map((label, i) => (
            <label key={label} className={`confidence-option${confidence === i + 1 ? ' is-on' : ''}`}>
              <input
                type="radio"
                name="confidence"
                value={i + 1}
                checked={confidence === i + 1}
                onChange={() => onConfidence(i + 1)}
                className="visually-hidden"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <button className="btn btn-primary city-guess-submit" type="submit" disabled={submitting}>
        {submitLabel}
      </button>
    </form>
  );
};
