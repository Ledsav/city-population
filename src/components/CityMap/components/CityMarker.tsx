import React from "react";
import { Marker } from "react-simple-maps";
import type { CityWithPerceptions } from "@/types";

type CityMarkerProps = {
  city: CityWithPerceptions;
  size: number;
  selected: boolean;
  className: string;
  onMouseEnter: (event: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick: () => void;
};

export const CityMarker: React.FC<CityMarkerProps> = ({
  city,
  size,
  selected,
  className,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  return (
    <Marker
      coordinates={[city.coordinates.longitude, city.coordinates.latitude]}
    >
      <g
        className={`city-marker ${selected ? "selected" : ""} ${className}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        {selected && <circle r={size} className="pulse-ring" />}
        <circle r={size} className="marker-circle" />
      </g>
    </Marker>
  );
};
