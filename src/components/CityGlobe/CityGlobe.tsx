import { List, Pause, Play, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { City } from '../../services/firebase';
import { Logo } from '../Logo/Logo';
import CityRankings from '../CityRanking/CityRanking';
import { CityInfoPanel } from './CityInfoPanel';
import './CityGlobe.css';
import { GlobeScene } from './GlobeScene';

type CityGlobeProps = {
  cities: City[];
  myGuesses: Record<string, number>;
  initialCityId: string | null;
  onGuessMore: () => void;
};

const CityGlobe = ({ cities, myGuesses, initialCityId, onGuessMore }: CityGlobeProps) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GlobeScene | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialCityId);
  const [rotating, setRotating] = useState(false);
  const [showList, setShowList] = useState(() => window.matchMedia('(min-width: 900px)').matches);
  const hasGuessed = Object.keys(myGuesses).length > 0;

  useEffect(() => {
    const scene = new GlobeScene(stageRef.current!, labelsRef.current!, { onSelect: setSelectedId });
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setCities(cities);
  }, [cities]);

  useEffect(() => {
    sceneRef.current?.setSelected(selectedId);
  }, [selectedId, cities]);

  useEffect(() => {
    sceneRef.current?.setAutoRotate(rotating);
  }, [rotating]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const selectedCity = cities.find((c) => c.id === selectedId) ?? null;

  return (
    <div className={`globe-screen${showList ? ' has-list' : ''}${selectedCity ? ' has-detail' : ''}`}>
      <div className="globe-stage" ref={stageRef}>
        <div className="globe-labels" ref={labelsRef} />
      </div>

      <header className="globe-bar">
        <Logo />
        <button className="btn btn-primary" onClick={onGuessMore}>
          {hasGuessed ? 'Guess more cities' : 'Add your guesses'}
        </button>
      </header>

      {showList && (
        <aside className="globe-panel globe-list" aria-label="City rankings">
          <div className="globe-panel-head">
            <h2 className="panel-title">Cities</h2>
            <button className="icon-btn" onClick={() => setShowList(false)} aria-label="Hide city list">
              <X size={18} />
            </button>
          </div>
          <CityRankings cities={cities} selectedId={selectedId} onSelect={setSelectedId} />
        </aside>
      )}

      {selectedCity && (
        <CityInfoPanel
          city={selectedCity}
          myGuess={myGuesses[selectedCity.id]}
          onClose={() => setSelectedId(null)}
          onGuess={onGuessMore}
        />
      )}

      <div className="globe-tools">
        {!showList && (
          <button className="tool-btn" onClick={() => setShowList(true)}>
            <List size={18} aria-hidden="true" /> Cities
          </button>
        )}
        <button className="tool-btn" onClick={() => setRotating((r) => !r)} aria-pressed={rotating}>
          {rotating ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          {rotating ? 'Stop spinning' : 'Spin'}
        </button>
        <dl className="legend">
          <div>
            <dt>
              <span className="swatch gap-way-over" />
              <span className="swatch gap-over" />
            </dt>
            <dd>Guessed too high</dd>
          </div>
          <div>
            <dt>
              <span className="swatch gap-under" />
              <span className="swatch gap-way-under" />
            </dt>
            <dd>Guessed too low</dd>
          </div>
          {cities.some((c) => c.numberOfEstimates === 0) && (
            <div>
              <dt>
                <span className="swatch gap-none" />
              </dt>
              <dd>No guesses yet</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default CityGlobe;
