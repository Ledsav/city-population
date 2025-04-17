import { City } from "@/services/firebase";
import { X } from "lucide-react";

type CityInfoPanelProps = {
  city: City;
  class: string;
  onClose: () => void;
};

export const CityInfoPanel = ({
  city,
  class: className,
  onClose,
}: CityInfoPanelProps) => {
  if (!city) return null;

  const perceptionGap = city.perceivedPopulation - city.officialPopulation;
  const percentageOff = ((perceptionGap / city.officialPopulation) * 100).toFixed(1);
  const isOverestimated = perceptionGap > 0;

  const getPerceptionCategory = () => {
    const percentage = parseFloat(percentageOff);
    if (percentage > 50) return "highly-overestimated";
    if (percentage > 0) return "slightly-overestimated";
    if (percentage < -50) return "highly-underestimated";
    return "slightly-underestimated";
  };

  const perceptionCategory = getPerceptionCategory();

  return (
    <div className={`info-panel ${perceptionCategory}`}>
      <div className="info-panel-container">
        <button onClick={onClose} className="close-button" aria-label="Close panel">
          <X size={20} />
        </button>

        <div className="city-header">
          <h2 className="city-title">{city.name}</h2>
          <p className="city-subtitle">{city.country}</p>
        </div>

        <div className="info-grid">
          <div className="population-stats">
            <div className="stat-group">
              <p className="stat-label">Official Population</p>
              <p className="stat-value">
                {city.officialPopulation.toLocaleString()}
              </p>
            </div>
            <div className="stat-group">
              <p className="stat-label">Perceived Population</p>
              <p className="stat-value">
                {city.perceivedPopulation.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="gap-section">
            <p className="stat-label">Perception Gap</p>
            <div className="gap-value-container">
              <span className="gap-number">
                {Math.abs(perceptionGap).toLocaleString()}
              </span>
              <span
                className={`gap-badge ${
                  isOverestimated ? "overestimated" : "underestimated"
                }`}
              >
                {isOverestimated ? "Over-estimated" : "Under-estimated"} (
                {percentageOff}%)
              </span>
            </div>
            <div className="gap-visualization">
              <div className="gap-bar-container">
                <div 
                  className={`gap-bar ${isOverestimated ? "overestimated" : "underestimated"}`}
                  style={{ 
                    width: `${Math.min(Math.abs(parseFloat(percentageOff)), 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="response-section">
            <p className="stat-label">Survey Responses</p>
            <p className="response-value">
              {city.numberOfEstimates.toLocaleString()}{" "}
              <span className="response-label">
                {city.numberOfEstimates === 1
                  ? "response"
                  : "responses"}
              </span>
            </p>
            {city.numberOfEstimates > 0 && (
              <p className="stat-label mt-2">
                Avg. Confidence: {city.averageConfidenceLevel.toFixed(1)}/5
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};