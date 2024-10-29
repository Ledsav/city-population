import React from "react";
import { Marker } from "react-simple-maps";
import type { CityWithPerceptions } from "@/types";

type CityMarkerProps = {
  city: CityWithPerceptions;
  color: string;
  size: number;
  selected: boolean;
  onMouseEnter: (event: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick: () => void;
};

export const CityMarker: React.FC<CityMarkerProps> = ({
  city,
  color,
  size,
  selected,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  return (
    <Marker
      coordinates={[city.coordinates.longitude, city.coordinates.latitude]}
    >
      <g
        className={`city-marker ${selected ? "selected" : ""}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        {/* Pulse animation for selected state */}
        {selected && (
          <circle
            r={size}
            fill={color}
            className="pulse-ring"
            style={{ opacity: 0.2 }}
          />
        )}

        {/* Main marker circle */}
        <circle
          r={size}
          fill={color}
          stroke="#FFFFFF"
          strokeWidth={1}
          opacity={selected ? 1 : 0.8}
        />
      </g>
    </Marker>
  );
};
