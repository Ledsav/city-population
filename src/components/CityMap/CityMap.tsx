import React, { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import type { CityWithPerceptions } from "@/types";
import { CityMarker } from "./components/CityMarker";
import { CityInfoPanel } from "./components/CityInfoPanel";
import "./CityMap.css";
import PopulationHeatmap from "./components/PopulationHeatmap";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CityMapProps {
  cities: CityWithPerceptions[];
  onCitySelect?: (city: CityWithPerceptions) => void;
}

export const CityMap: React.FC<CityMapProps> = ({ cities, onCitySelect }) => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCityData, setSelectedCityData] =
    useState<CityWithPerceptions | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<"actual" | "perceived">(
    "actual"
  );
  const [showHeatmap, setShowHeatmap] = useState(true);

  const getCityClass = (city: CityWithPerceptions) => {
    const percentageOff =
      (city.perceptions.perceptionGap / city.officialPopulation) * 100;

    if (percentageOff > 50) return "highly-overestimated";
    if (percentageOff > 0) return "slightly-overestimated";
    if (percentageOff < -50) return "highly-underestimated";
    return "slightly-underestimated";
  };

  const getMarkerSize = (city: CityWithPerceptions) => {
    // Normalize population to millions for easier calculation
    const populationInMillions = city.officialPopulation / 1_000_000;
    // Use cube root for more distinct but not extreme differences
    const baseSize = Math.cbrt(populationInMillions) * 5;
    return selectedCity === city.id ? baseSize * 1.2 : baseSize;
  };

  const handleCityClick = (city: CityWithPerceptions) => {
    if (selectedCity === city.id) {
      setSelectedCity(null);
      setSelectedCityData(null);
    } else {
      setSelectedCity(city.id);
      setSelectedCityData(city);
    }
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
      <div className="map-controls">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="control-button"
        >
          {showHeatmap ? "Hide" : "Show"} Heatmap
        </button>
        {showHeatmap && (
          <select
            value={heatmapMode}
            onChange={(e) =>
              setHeatmapMode(e.target.value as "actual" | "perceived")
            }
            className="mode-select"
          >
            <option value="actual">Actual Population</option>
            <option value="perceived">Perceived Population</option>
          </select>
        )}
      </div>

      <div className="map-container">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 130,
            center: [0, 0],
          }}
        >
          <ZoomableGroup
            center={[0, 0]}
            zoom={1}
            minZoom={1}
            maxZoom={3}
            // Limit horizontal movement (longitude: -180 to 180)
            //limit vertical movement (latitude: -90 to 90)
            translateExtent={[
              [0, 0],
              [1000, 1000],
            ]}
          >
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

            {showHeatmap && (
              <PopulationHeatmap
                cities={cities}
                width={800}
                height={400}
                mode={heatmapMode}
                scale={130} // Match this with ComposableMap's scale
                center={[0, 33]} // Match this with ZoomableGroup's center
                intensity={100}
                blur={25}
                opacity={0.8}
                colorScale={
                  heatmapMode === "actual"
                    ? {
                        low: "#3b82f6",
                        medium: "#7c3aed",
                        high: "#db2777",
                      }
                    : {
                        low: "#84cc16",
                        medium: "#eab308",
                        high: "#ef4444",
                      }
                }
              />
            )}

            {cities.map((city) => (
              <CityMarker
                key={city.id}
                city={city}
                size={getMarkerSize(city)}
                selected={selectedCity === city.id}
                className={getCityClass(city)}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                onClick={() => handleCityClick(city)}
              />
            ))}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* City Info Panel */}
      {selectedCityData && (
        <CityInfoPanel
          city={selectedCityData}
          class={getCityClass(selectedCityData)}
          onClose={() => {
            setSelectedCityData(null);
            setSelectedCity(null);
          }}
        />
      )}

      <div className="stats-panel">
        <h2 className="stats-title">Population Perception Analysis</h2>

        <div className="stats-grid">
          {/* Legend Section */}
          <div className="stats-section">
            <h3 className="stats-section-title">Legend</h3>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-marker highly-overestimated"></div>
                <span className="legend-text">
                  Highly overestimated ({">"}50%)
                </span>
              </div>
              <div className="legend-item">
                <div className="legend-marker slightly-overestimated"></div>
                <span className="legend-text">
                  Slightly overestimated (0-50%)
                </span>
              </div>
              <div className="legend-item">
                <div className="legend-marker slightly-underestimated"></div>
                <span className="legend-text">
                  Slightly underestimated (0-50%)
                </span>
              </div>
              <div className="legend-item">
                <div className="legend-marker highly-underestimated"></div>
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
