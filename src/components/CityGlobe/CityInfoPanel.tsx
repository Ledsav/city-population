import { X } from 'lucide-react';
import { formatCompact, formatFull, gapCategory, gapPercent } from '../../lib/perception';
import type { City } from '../../services/firebase';

type CityInfoPanelProps = {
  city: City;
  myGuess?: number;
  onClose: () => void;
  onGuess: () => void;
};

export const CityInfoPanel = ({ city, myGuess, onClose, onGuess }: CityInfoPanelProps) => {
  const hasCrowd = city.numberOfEstimates > 0;
  const percent = gapPercent(city);
  const category = gapCategory(percent);
  const rows = [
    { key: 'census', label: 'Census', value: city.officialPopulation },
    ...(hasCrowd ? [{ key: `crowd gap-${category}`, label: 'Crowd guess', value: city.perceivedPopulation }] : []),
    ...(myGuess ? [{ key: 'mine', label: 'Your guess', value: myGuess }] : []),
  ];
  const max = Math.max(...rows.map((r) => r.value));

  return (
    <section className="globe-panel city-panel" aria-labelledby="city-panel-title" key={city.id}>
      <div className="globe-panel-head">
        <div>
          <p className="city-panel-country">{city.country}</p>
          <h2 className="city-panel-name" id="city-panel-title">
            {city.name}
          </h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close city details">
          <X size={18} />
        </button>
      </div>

      <dl className="compare">
        {rows.map((row) => (
          <div className={`compare-row ${row.key}`} key={row.key}>
            <dt>{row.label}</dt>
            <dd className="num" title={formatFull(row.value)}>
              {formatCompact(row.value)}
            </dd>
            <span className="compare-bar" style={{ transform: `scaleX(${row.value / max})` }} />
          </div>
        ))}
      </dl>

      {hasCrowd ? (
        <p className={`city-panel-verdict gap-${category}`}>
          People guess <strong className="num">{Math.abs(percent).toFixed(0)}%</strong>{' '}
          {percent >= 0 ? 'too high' : 'too low'}.
          <span className="city-panel-meta">
            From {formatFull(city.numberOfEstimates)} {city.numberOfEstimates === 1 ? 'guess' : 'guesses'}, average
            confidence {city.averageConfidenceLevel.toFixed(1)} of 5.
          </span>
        </p>
      ) : (
        <div className="city-panel-empty">
          <p>Nobody has guessed {city.name} yet.</p>
          <button className="btn btn-quiet" onClick={onGuess}>
            Be the first to guess
          </button>
        </div>
      )}
    </section>
  );
};
