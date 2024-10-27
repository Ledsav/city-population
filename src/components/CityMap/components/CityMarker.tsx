import React from "react";
import { Marker } from "react-simple-maps";
import type { CityWithPerceptions } from "@/types";

type CityMarkerProps = {
  city: CityWithPerceptions;
  onMouseEnter: (event: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick?: () => void;
};

export const CityMarker: React.FC<CityMarkerProps> = ({
  city,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  const getMarkerSize = (population: number) => {
    return Math.max((Math.log(population) / Math.log(10)) * 2, 5);
  };

  return (
    <Marker
      coordinates={[city.coordinates.longitude, city.coordinates.latitude]}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <circle
        r={getMarkerSize(city.officialPopulation)}
        fill="#EF4444"
        stroke="#FFFFFF"
        strokeWidth={2}
        opacity={0.8}
        style={{
          cursor: "pointer",
          transition: "all 200ms",
        }}
        onMouseEnter={(e) => {
          const target = e.target as SVGCircleElement;
          target.style.opacity = "1";
          target.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          const target = e.target as SVGCircleElement;
          target.style.opacity = "0.8";
          target.style.transform = "scale(1)";
        }}
      />
    </Marker>
  );
};
