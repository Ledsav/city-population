import { CityWithPerceptions } from '@/types';
import React, { useState } from 'react';
import './CityRanking.css';

interface CityRankingsProps {
  cities: CityWithPerceptions[];
  onCitySelect: (city: CityWithPerceptions) => void;
  selectedCity: CityWithPerceptions | null;
}

const CityRankings: React.FC<CityRankingsProps> = ({ 
  cities, 
  onCitySelect,
  selectedCity 
}) => {
  const [showPerceived, setShowPerceived] = useState(false);
  
  // Sort cities by population (either official or perceived)
  const sortedCities = [...cities].sort((a, b) => {
    if (showPerceived) {
      return b.perceptions.averagePerceivedPopulation - a.perceptions.averagePerceivedPopulation;
    }
    return b.officialPopulation - a.officialPopulation;
  });

  return (
    <div className="city-rankings-container">
      <div className="rankings-header">
        <h3 className="rankings-title">Population Rankings</h3>
        
        <div className="toggle-container">
          <button 
            className={`toggle-button ${!showPerceived ? 'active' : ''}`}
            onClick={() => setShowPerceived(false)}
          >
            Official
          </button>
          <button 
            className={`toggle-button ${showPerceived ? 'active' : ''}`}
            onClick={() => setShowPerceived(true)}
          >
            Perceived
          </button>
        </div>
      </div>
      
      <ul className="rankings-list">
        {sortedCities.map((city, index) => {
          // Determine appropriate CSS class based on perception gap
          const percentageOff = (city.perceptions.perceptionGap / city.officialPopulation) * 100;
          let perceptionClass = '';
          
          if (percentageOff > 50) perceptionClass = 'highly-overestimated';
          else if (percentageOff > 0) perceptionClass = 'slightly-overestimated';
          else if (percentageOff < -50) perceptionClass = 'highly-underestimated';
          else perceptionClass = 'slightly-underestimated';
          
          const isSelected = selectedCity?.id === city.id;
          
          return (
            <li 
              key={city.id} 
              className={`ranking-item ${perceptionClass} ${isSelected ? 'selected' : ''}`}
              onClick={() => onCitySelect(city)}
            >
              <span className="rank">{index + 1}</span>
              <div className="city-info">
                <span className="city-name">{city.name}</span>
                <span className="city-country">{city.country}</span>
              </div>
              <span className="population">
                {showPerceived 
                  ? city.perceptions.averagePerceivedPopulation.toLocaleString()
                  : city.officialPopulation.toLocaleString()
                }
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CityRankings;