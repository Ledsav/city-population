import { useMemo, useState } from 'react';
import { cityGap, formatCompact, formatPercent, gapPercent } from '../../lib/perception';
import type { City } from '../../services/firebase';
import './CityRanking.css';

type CityRankingsProps = {
  cities: City[];
  selectedId: string | null;
  onSelect: (cityId: string) => void;
};

type SortKey = 'census' | 'crowd' | 'gap';

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'census', label: 'Census' },
  { key: 'crowd', label: 'Crowd' },
  { key: 'gap', label: 'Most wrong' },
];

const CityRankings = ({ cities, selectedId, onSelect }: CityRankingsProps) => {
  const [sort, setSort] = useState<SortKey>('census');

  const sorted = useMemo(() => {
    const value = (c: City) =>
      sort === 'census' ? c.officialPopulation : sort === 'crowd' ? c.perceivedPopulation : Math.abs(gapPercent(c));
    return [...cities].sort((a, b) => value(b) - value(a));
  }, [cities, sort]);

  return (
    <>
      <div className="segmented" role="radiogroup" aria-label="Sort cities by">
        {SORTS.map((s) => (
          <button key={s.key} role="radio" aria-checked={sort === s.key} onClick={() => setSort(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      <ol className="rank-list">
        {sorted.map((city, i) => {
          const percent = gapPercent(city);
          const guessed = city.numberOfEstimates > 0;
          return (
            <li key={city.id}>
              <button
                className={`rank-row${city.id === selectedId ? ' is-selected' : ''}`}
                aria-current={city.id === selectedId || undefined}
                onClick={() => onSelect(city.id)}
              >
                <span className="rank-pos num">{i + 1}</span>
                <span className="rank-name">{city.name}</span>
                <span className="rank-pop num">
                  {formatCompact(sort === 'crowd' ? city.perceivedPopulation : city.officialPopulation)}
                </span>
                <span className={`rank-gap num gap-${cityGap(city)}`}>
                  {guessed ? formatPercent(percent) : <span aria-label="No guesses yet">–</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
};

export default CityRankings;
