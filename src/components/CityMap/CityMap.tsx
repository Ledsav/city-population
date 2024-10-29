import React, { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import type { CityWithPerceptions } from "@/types";
import { CityMarker, CityTooltip } from "./components";
import "./CityMap.css";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CityMapProps {
  cities: CityWithPerceptions[];
  onCitySelect?: (city: CityWithPerceptions) => void;
}

export const CityMap: React.FC<CityMapProps> = ({ cities, onCitySelect }) => {
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const getMarkerColor = (city: CityWithPerceptions) => {
    const percentageOff =
      (city.perceptions.perceptionGap / city.officialPopulation) * 100;

    // Red for overestimated, blue for underestimated
    if (percentageOff > 0) {
      return percentageOff > 50 ? "#dc2626" : "#ef4444";
    } else {
      return percentageOff < -50 ? "#2563eb" : "#3b82f6";
    }
  };

  const getMarkerSize = (city: CityWithPerceptions) => {
    // Normalize population to millions for easier calculation
    const populationInMillions = city.officialPopulation / 1_000_000;
    // Use cube root for more distinct but not extreme differences
    const baseSize = Math.cbrt(populationInMillions) * 5;
    return selectedCity === city.id ? baseSize * 1.2 : baseSize;
  };

  const handleCityMouseEnter =
    (city: CityWithPerceptions) => (event: React.MouseEvent) => {
      const mapContainer = (event.target as Element).closest(".map-container");
      if (!mapContainer) return;

      const mapRect = mapContainer.getBoundingClientRect();
      const markerElement = (event.target as Element).closest(".city-marker");
      if (!markerElement) return;

      const markerRect = markerElement.getBoundingClientRect();

      // Calculate position relative to the window
      const x = markerRect.left + markerRect.width / 2;
      const y = markerRect.top;

      const percentageOff = (
        (city.perceptions.perceptionGap / city.officialPopulation) *
        100
      ).toFixed(1);
      const totalResponses = city.perceptions.totalPerceptions;

      setTooltipPosition({ x, y });
      setTooltipContent(`
      ${city.name}, ${city.country}
      Official: ${city.officialPopulation.toLocaleString()}
      Perceived: ${city.perceptions.averagePerceivedPopulation.toLocaleString()}
      Difference: ${Math.abs(
        city.perceptions.perceptionGap
      ).toLocaleString()} (${percentageOff}%)
      ${
        city.perceptions.perceptionGap > 0
          ? "Over-estimated"
          : "Under-estimated"
      }
      Based on ${totalResponses} ${
        totalResponses === 1 ? "response" : "responses"
      }
    `);
    };

  const handleCityClick = (city: CityWithPerceptions) => {
    setSelectedCity(selectedCity === city.id ? null : city.id);
    onCitySelect?.(city);
  };

  const getPerceptionStats = () => {
    let mostOverestimated = cities[0];
    let mostUnderestimated = cities[0];
    let totalPerceptions = 0;

    cities.forEach((city) => {
      const percentageOff =
        (city.perceptions.perceptionGap / city.officialPopulation) * 100;
      const currentMostOver =
        (mostOverestimated.perceptions.perceptionGap /
          mostOverestimated.officialPopulation) *
        100;
      const currentMostUnder =
        (mostUnderestimated.perceptions.perceptionGap /
          mostUnderestimated.officialPopulation) *
        100;

      if (percentageOff > currentMostOver) mostOverestimated = city;
      if (percentageOff < currentMostUnder) mostUnderestimated = city;
      totalPerceptions += city.perceptions.totalPerceptions;
    });

    return { mostOverestimated, mostUnderestimated, totalPerceptions };
  };

  const stats = getPerceptionStats();

  return (
    <div className="map-wrapper">
      <div className="map-container">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 130,
          }}
        >
          <ZoomableGroup center={[0, 0]} zoom={1}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#E2E8F0"
                    stroke="#CBD5E1"
                    strokeWidth={0.5}
                    className="geography"
                  />
                ))
              }
            </Geographies>

            {cities.map((city) => (
              <CityMarker
                key={city.id}
                city={city}
                color={getMarkerColor(city)}
                size={getMarkerSize(city)}
                selected={selectedCity === city.id}
                onMouseEnter={handleCityMouseEnter(city)}
                onMouseLeave={() => setTooltipContent("")}
                onClick={() => handleCityClick(city)}
              />
            ))}
          </ZoomableGroup>
        </ComposableMap>

        <CityTooltip content={tooltipContent} position={tooltipPosition} />
      </div>

      <div className="stats-panel">
        <h2 className="stats-title">Population Perception Analysis</h2>

        <div className="stats-grid">
          {/* Legend Section */}
          <div className="stats-section">
            <h3 className="stats-section-title">Legend</h3>
            <div className="legend-items">
              <div className="legend-item">
                <div
                  className="legend-marker"
                  style={{ backgroundColor: "#dc2626" }}
                ></div>
                <span className="legend-text">
                  Highly overestimated ({">"}50%)
                </span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-marker"
                  style={{ backgroundColor: "#ef4444" }}
                ></div>
                <span className="legend-text">
                  Slightly overestimated (0-50%)
                </span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-marker"
                  style={{ backgroundColor: "#3b82f6" }}
                ></div>
                <span className="legend-text">
                  Slightly underestimated (0-50%)
                </span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-marker"
                  style={{ backgroundColor: "#2563eb" }}
                ></div>
                <span className="legend-text">
                  Highly underestimated ({">"}50%)
                </span>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="stats-section">
            <h3 className="stats-section-title">Key Insights</h3>
            <div className="insight-items">
              <div className="insight-item">
                <p className="insight-label">Most Overestimated</p>
                <p className="insight-value">{stats.mostOverestimated.name}</p>
                <p className="insight-stat positive">
                  +
                  {(
                    (stats.mostOverestimated.perceptions.perceptionGap /
                      stats.mostOverestimated.officialPopulation) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>

              <div className="insight-item">
                <p className="insight-label">Most Underestimated</p>
                <p className="insight-value">{stats.mostUnderestimated.name}</p>
                <p className="insight-stat negative">
                  {(
                    (stats.mostUnderestimated.perceptions.perceptionGap /
                      stats.mostUnderestimated.officialPopulation) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>

              <div className="insight-item">
                <p className="insight-label">Total Perceptions Collected</p>
                <p className="insight-value">
                  {stats.totalPerceptions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
