import { CityWithPerceptions } from "@/types/cityWithPerceptions";

type CityInfoPanelProps = {
  city: CityWithPerceptions;
  class: string;
  onClose: () => void;
};

export const CityInfoPanel = ({
  city,
  class: className,
  onClose,
}: CityInfoPanelProps) => {
  if (!city) return null;

  const percentageOff = (
    (city.perceptions.perceptionGap / city.officialPopulation) *
    100
  ).toFixed(1);
  const isOverestimated = city.perceptions.perceptionGap > 0;

  return (
    <div className={`info-panel animate-slideDown ${className}`}>
      <div className="info-panel-container">
        <button onClick={onClose} className="close-button">
          ×
        </button>

        <div className="info-grid">
          {/* City Info */}
          <div className="info-section">
            <h3 className="city-name">{city.name}</h3>
            <p className="city-country">{city.country}</p>
          </div>

          {/* Population Stats */}
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
                {city.perceptions.averagePerceivedPopulation.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Perception Gap */}
          <div className="gap-section">
            <p className="stat-label">Population Gap</p>
            <div className="gap-value-container">
              <span className="gap-number">
                {Math.abs(city.perceptions.perceptionGap).toLocaleString()}
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
          </div>

          {/* Response Stats */}
          <div className="response-section">
            <p className="stat-label">Total Responses</p>
            <p className="response-value">
              {city.perceptions.totalPerceptions.toLocaleString()}{" "}
              <span className="response-label">
                {city.perceptions.totalPerceptions === 1
                  ? "response"
                  : "responses"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
