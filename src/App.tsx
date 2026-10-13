import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { GuessFlow } from './components/Guess/GuessFlow';
import { Intro } from './components/Intro/Intro';
import { LogoMark } from './components/Logo/Logo';
import { loadMyGuesses, saveMyGuesses } from './lib/perception';
import { City, Estimate, firebaseService } from './services/firebase';

// three.js only downloads when someone actually opens the globe.
const loadGlobe = () => import('./components/CityGlobe/CityGlobe');
const CityGlobe = lazy(loadGlobe);

type Screen = 'intro' | 'guess' | 'globe';

const Loading = ({ label }: { label: string }) => (
  <div className="screen-center" role="status">
    <span className="loading-mark">
      <LogoMark size={56} />
    </span>
    <p className="visually-hidden">{label}</p>
  </div>
);

const App = () => {
  const [screen, setScreen] = useState<Screen>('intro');
  const [cities, setCities] = useState<City[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myGuesses, setMyGuesses] = useState<Record<string, number>>(loadMyGuesses);
  const [focusCityId, setFocusCityId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    firebaseService
      .getAllCities()
      .then(setCities)
      .catch(() => setError("We couldn't reach the city database. Check your connection and try again."));
  }, []);

  useEffect(load, [load]);

  // Warm the globe chunk while the visitor is still reading or guessing.
  useEffect(() => {
    const id = window.setTimeout(loadGlobe, 1500);
    return () => window.clearTimeout(id);
  }, []);

  const handleSubmit = async (estimates: Estimate[]) => {
    const updated = await firebaseService.submitEstimates(estimates);
    const guesses = Object.fromEntries(estimates.map((e) => [e.cityId, e.estimatedPopulation]));
    saveMyGuesses(guesses);
    setMyGuesses((prev) => ({ ...prev, ...guesses }));
    setCities(updated);
    setFocusCityId(estimates[0]?.cityId ?? null);
    setScreen('globe');
  };

  if (error) {
    return (
      <div className="screen-center">
        <div className="error-card" role="alert">
          <LogoMark size={48} />
          <p>{error}</p>
          <button className="btn btn-primary" onClick={load}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!cities) return <Loading label="Loading cities" />;

  return (
    <ErrorBoundary>
      {screen === 'intro' && (
        <Intro
          cities={cities}
          onStart={() => setScreen('guess')}
          onExplore={() => setScreen('globe')}
        />
      )}
      {screen === 'guess' && (
        <GuessFlow cities={cities} onSubmit={handleSubmit} onCancel={() => setScreen('intro')} />
      )}
      {screen === 'globe' && (
        <Suspense fallback={<Loading label="Loading the globe" />}>
          <CityGlobe
            cities={cities}
            myGuesses={myGuesses}
            initialCityId={focusCityId}
            onGuessMore={() => setScreen('guess')}
          />
        </Suspense>
      )}
    </ErrorBoundary>
  );
};

export default App;
