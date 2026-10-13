import type { City } from '../services/firebase';

export type GapCategory = 'way-over' | 'over' | 'under' | 'way-under' | 'none';

/** Signed gap between the crowd's guess and the census, as a percentage of the census. */
export const gapPercent = (city: City) =>
  ((city.perceivedPopulation - city.officialPopulation) / city.officialPopulation) * 100;

export const gapCategory = (percent: number): GapCategory => {
  if (percent > 50) return 'way-over';
  if (percent > 0) return 'over';
  if (percent < -50) return 'way-under';
  return 'under';
};

/** Category for a city, or 'none' while nobody has guessed it. */
export const cityGap = (city: City): GapCategory =>
  city.numberOfEstimates > 0 ? gapCategory(gapPercent(city)) : 'none';

/** Marker/label colours on the globe, kept in sync with --over/--under in index.css */
export const GAP_COLORS: Record<GapCategory, number> = {
  'way-over': 0xff5c7a,
  over: 0xffa3b4,
  under: 0x9ad8ff,
  'way-under': 0x3fb4ff,
  none: 0xc9d6e6,
};

const full = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const formatFull = (n: number) => full.format(Math.round(n));
export const formatCompact = (n: number) => compact.format(Math.round(n));

/** "8.8 million" style reading aid shown under the number input. */
export const formatSpoken = (n: number) => {
  if (n >= 1e9) return `${+(n / 1e9).toFixed(2)} billion`;
  if (n >= 1e6) return `${+(n / 1e6).toFixed(2)} million`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(1)} thousand`;
  return `${n}`;
};

export const formatPercent = (p: number) => `${p > 0 ? '+' : ''}${p.toFixed(0)}%`;

/** Parses user input like "8,800,000" or "8.8m" into a population, or null if invalid. */
export const parsePopulation = (raw: string): number | null => {
  const value = raw.trim().toLowerCase().replace(/[\s,_']/g, '');
  const match = /^(\d+(?:\.\d+)?)([kmb])?$/.exec(value);
  if (!match) return null;
  const scale = { k: 1e3, m: 1e6, b: 1e9 }[match[2] as 'k' | 'm' | 'b'] ?? 1;
  const n = Math.round(parseFloat(match[1]) * scale);
  return n > 0 && n <= 8e9 ? n : null;
};

/* Your own guesses, remembered on this device so the globe can show them back. */
const GUESSES_KEY = 'popglobe:guesses';

export const loadMyGuesses = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(GUESSES_KEY) || '{}');
  } catch {
    return {};
  }
};

export const saveMyGuesses = (guesses: Record<string, number>) => {
  try {
    localStorage.setItem(GUESSES_KEY, JSON.stringify({ ...loadMyGuesses(), ...guesses }));
  } catch {
    /* storage unavailable: guesses just won't be remembered */
  }
};
