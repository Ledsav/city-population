// src/components/CityMap/CityMap.tsx
import React, { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import type { CityWithPerceptions } from "@/types/cityWithPerceptions";
import { CityMarker, CityTooltip } from "./components";
import { sampleCities } from "./data";
import "./CityMap.css";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type CityMapProps = {
  cities?: CityWithPerceptions[];
  onCitySelect?: (city: CityWithPerceptions) => void;
};

export const CityMap: React.FC<CityMapProps> = ({
  cities = sampleCities,
  onCitySelect,
}) => {
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(false);

  const handleCityMouseEnter =
    (city: CityWithPerceptions) => (event: React.MouseEvent) => {
      const rect = (event.target as Element)
        .closest(".map-container")
        ?.getBoundingClientRect();

      if (rect) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const tooltipText = `${city.name}, ${city.country}
        Official: ${city.officialPopulation.toLocaleString()}
        Perceived: ${city.perceptions.averagePerceivedPopulation.toLocaleString()}
        Gap: ${Math.abs(city.perceptions.perceptionGap).toLocaleString()}
        ${
          city.perceptions.perceptionGap > 0
            ? "Over-estimated"
            : "Under-estimated"
        }`;

        setTooltipContent(tooltipText);
        setTooltipPosition({ x, y });
      }
    };

  const handleMapError = () => {
    setError(true);
  };

  const mapConfig = {
    width: 800,
    height: 400,
    scale: 130,
    center: [0, 20] as [number, number],
    translateExtent: [
      [-10, -50],
      [810, 450],
    ] as [[number, number], [number, number]],
  };

  return (
    <div className="map-wrapper">
      {error && (
        <div className="map-error" role="alert">
          Failed to load the map. Please try refreshing the page.
        </div>
      )}

      <div className="map-container">
        <ComposableMap
          width={mapConfig.width}
          height={mapConfig.height}
          projection="geoMercator"
          projectionConfig={{
            scale: mapConfig.scale,
            center: mapConfig.center,
          }}
        >
          <ZoomableGroup
            zoom={1}
            minZoom={1}
            maxZoom={4}
            center={mapConfig.center}
            translateExtent={mapConfig.translateExtent}
          >
            <Geographies geography={geoUrl} onError={handleMapError}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#E2E8F0"
                    stroke="#CBD5E1"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: "none",
                        transition: "all 250ms",
                      },
                      hover: {
                        fill: "#CBD5E1",
                        outline: "none",
                      },
                      pressed: {
                        outline: "none",
                      },
                    }}
                  />
                ))
              }
            </Geographies>

            {!error &&
              cities.map((city) => (
                <CityMarker
                  key={city.id}
                  city={city}
                  onMouseEnter={handleCityMouseEnter(city)}
                  onMouseLeave={() => setTooltipContent("")}
                  onClick={() => onCitySelect?.(city)}
                />
              ))}
          </ZoomableGroup>
        </ComposableMap>

        <CityTooltip content={tooltipContent} position={tooltipPosition} />
      </div>

      <div className="map-legend">
        <h2 className="legend-title">Population Perception Map</h2>
        <div className="legend-item">
          <div className="legend-marker"></div>
          <span className="legend-text">
            City markers (size indicates population)
          </span>
        </div>
      </div>
    </div>
  );
};
