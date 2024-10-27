// src/components/CityMap/components/CityTooltip.tsx
import React from "react";

type CityTooltipProps = {
  content: string;
  position?: { x: number; y: number };
};

export const CityTooltip: React.FC<CityTooltipProps> = ({
  content,
  position,
}) => {
  if (!content) return null;

  // Parse the content
  const lines = content.trim().split("\n");
  const [cityInfo, officialPop, perceivedPop, gap, estimation] = lines.map(
    (line) => line.trim()
  );

  // Extract city name and country
  const [name, country] = cityInfo.split(",").map((s) => s.trim());

  // Extract numbers
  const officialNumber = officialPop.split(":")[1].trim();
  const perceivedNumber = perceivedPop.split(":")[1].trim();
  const gapNumber = gap.split(":")[1].trim();
  const estimationType = estimation.trim().replace(/[()]/g, "");

  // Calculate position with boundaries
  const tooltipWidth = 280; // Fixed width of tooltip
  const safeX = Math.min(
    Math.max(position?.x ?? 0, tooltipWidth / 2),
    800 - tooltipWidth / 2
  );

  return (
    <div
      className="tooltip"
      style={{
        left: `${safeX}px`,
        top: `${Math.max(position?.y ?? 0, 40)}px`,
        transform: "translate(-50%, calc(-100% - 10px))",
      }}
    >
      <div className="tooltip-container">
        <div className="tooltip-header">
          {name}
          <div style={{ fontSize: "12px", color: "#64748b" }}>{country}</div>
        </div>

        <div className="tooltip-stat">
          <span className="tooltip-label">Official:</span>
          <span className="tooltip-value">{officialNumber}</span>
        </div>

        <div className="tooltip-stat">
          <span className="tooltip-label">Perceived:</span>
          <span className="tooltip-value">{perceivedNumber}</span>
        </div>

        <div className="tooltip-gap">
          <span className="tooltip-label">Population Gap:</span>
          <span
            className="tooltip-gap-value"
            style={{
              color: estimationType.includes("Over") ? "#ef4444" : "#3b82f6",
            }}
          >
            {gapNumber} ({estimationType})
          </span>
        </div>
      </div>
      <div className="tooltip-arrow" />
    </div>
  );
};
