import React, { useMemo } from "react";
import { geoMercator } from "d3-geo";
import { CityWithPerceptions } from "@/types";

interface HeatmapProps {
  cities: CityWithPerceptions[];
  width: number;
  height: number;
  mode: "actual" | "perceived";
  intensity?: number;
  blur?: number;
  opacity?: number;
  colorScale?: {
    low: string;
    medium: string;
    high: string;
  };
  scale?: number;
  center?: [number, number];
}

const PopulationHeatmap = ({
  cities,
  width,
  height,
  mode = "actual",
  intensity = 25,
  blur = 30,
  opacity = 0.5,
  scale = 130,
  center = [0, 0],
  colorScale = {
    low: "#3b82f6",
    medium: "#7c3aed",
    high: "#db2777",
  },
}: HeatmapProps) => {
  const heatmapId = `heatmap-${mode}`;
  const pointGradientId = `${heatmapId}-point-gradient`;
  const legendGradientId = `${heatmapId}-legend-gradient`;
  const filterId = `${heatmapId}-blur`;

  // Create mercator projection
  const projection = useMemo(() => {
    return geoMercator()
      .scale(scale)
      .center(center)
      .translate([width / 2, height / 2]);
  }, [width, height, scale, center]);

  // Calculate heatmap points using the mercator projection
  const points = useMemo(() => {
    return cities.map((city) => {
      const [x, y] = projection([
        city.coordinates.longitude,
        city.coordinates.latitude,
      ]) || [0, 0];

      return {
        x,
        y,
        value:
          mode === "actual"
            ? city.officialPopulation
            : city.perceptions.averagePerceivedPopulation,
      };
    });
  }, [cities, projection, mode]);

  // Normalize population values
  const { maxValue } = useMemo(() => {
    const values = points.map((p) => p.value);
    return {
      maxValue: Math.max(...values),
    };
  }, [points]);

  // Generate SVG circles for each point
  const circles = points.map((point, index) => {
    const radius = Math.sqrt(point.value / maxValue) * intensity;
    return (
      <circle
        key={index}
        cx={point.x}
        cy={point.y}
        r={radius}
        fill={`url(#${pointGradientId})`}
        opacity={opacity}
      />
    );
  });

  return (
    <g className="heatmap-layer">
      <defs>
        {/* Radial gradient for heatmap points */}
        <radialGradient id={pointGradientId}>
          <stop offset="0%" stopColor={colorScale.high} stopOpacity={0.8} />
          <stop offset="50%" stopColor={colorScale.medium} stopOpacity={0.5} />
          <stop offset="100%" stopColor={colorScale.low} stopOpacity={0.1} />
        </radialGradient>

        {/* Linear gradient for legend */}
        <linearGradient id={legendGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colorScale.low} stopOpacity={1} />
          <stop offset="50%" stopColor={colorScale.medium} stopOpacity={1} />
          <stop offset="100%" stopColor={colorScale.high} stopOpacity={1} />
        </linearGradient>

        {/* Gaussian blur filter */}
        <filter id={filterId}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} />
        </filter>
      </defs>

      {/* Heatmap points group */}
      <g filter={`url(#${filterId})`} className="heatmap-points">
        {circles}
      </g>

      {/* Legend */}
      <g transform={`translate(${20}, ${height - 30})`}>
        <rect
          width="120"
          height="60"
          fill="white"
          fillOpacity="0.8"
          rx="4"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        <text x="10" y="20" fontSize="12" fill="#1e293b" fontWeight="500">
          Population Density
        </text>
        <rect
          x="10"
          y="30"
          width="100"
          height="8"
          fill={`url(#${legendGradientId})`}
          rx="2"
        />
        <text x="10" y="50" fontSize="10" fill="#64748b">
          Low
        </text>
        <text x="85" y="50" fontSize="10" fill="#64748b" textAnchor="end">
          High
        </text>
      </g>
    </g>
  );
};

export default PopulationHeatmap;
