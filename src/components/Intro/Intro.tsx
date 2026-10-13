import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { formatFull } from '../../lib/perception';
import type { City } from '../../services/firebase';
import { Logo } from '../Logo/Logo';
import './Intro.css';

type IntroProps = {
  cities: City[];
  onStart: () => void;
  onExplore: () => void;
};

// Same file index.html preloads and the 3D globe uses first.
const MAP_STYLE = { '--map': `url(${process.env.PUBLIC_URL}/textures/earth-day-2k.webp)` } as CSSProperties;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const Intro = ({ cities, onStart, onExplore }: IntroProps) => {
  const [index, setIndex] = useState(0);
  const totalGuesses = useMemo(() => cities.reduce((sum, c) => sum + c.numberOfEstimates, 0), [cities]);

  // The one moving thing on the page: the city in the question changes every few seconds.
  useEffect(() => {
    if (reducedMotion() || cities.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % cities.length), 2600);
    return () => window.clearInterval(id);
  }, [cities.length]);

  const city = cities[index];

  return (
    <div className="intro">
      <header className="intro-bar">
        <Logo />
      </header>

      <main className="intro-main">
        <h1 className="intro-title">
          How many people live in{' '}
          <span className="intro-city" key={city.id}>
            {city.name}
          </span>
          ?
        </h1>
        <p className="intro-lede">
          Guess the population of {cities.length} big cities. Then see your numbers, and everyone
          else's, next to the census on a globe.
        </p>

        <div className="intro-actions">
          <button className="btn btn-primary" onClick={onStart}>
            Start guessing
          </button>
          <button className="btn btn-quiet" onClick={onExplore}>
            Explore the globe
          </button>
        </div>

        {totalGuesses > 0 && (
          <p className="intro-count">
            <span className="num">{formatFull(totalGuesses)}</span> guesses so far
          </p>
        )}
      </main>

      <div className="intro-globe" aria-hidden="true">
        <div className="intro-globe-map" style={MAP_STYLE} />
      </div>
    </div>
  );
};
