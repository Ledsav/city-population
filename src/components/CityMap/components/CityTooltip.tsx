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
  const [cityInfo, officialPop, perceivedPop, gap, estimation, responses] =
    lines.map((line) => line.trim());

  // Extract city name and country
  const [name, country] = cityInfo.split(",").map((s) => s.trim());

  // Extract numbers
  const officialNumber = officialPop.split(":")[1].trim();
  const perceivedNumber = perceivedPop.split(":")[1].trim();
  const gapNumber = gap.split(":")[1].trim();
  const estimationType = estimation.trim();

  const tooltipWidth = 320;
  const safeX = Math.min(
    Math.max(position?.x ?? 0, tooltipWidth / 2),
    window.innerWidth - tooltipWidth / 2
  );

  return (
    <div
      className="tooltip tooltip-enter"
      style={{
        left: `${safeX}px`,
        top: `${position?.y ?? 0}px`,
      }}
    >
      <div className="tooltip-header">
        <h3 className="tooltip-title">{name}</h3>
        <p className="tooltip-subtitle">{country}</p>
      </div>

      <div className="tooltip-content">
        <div className="tooltip-stats-grid">
          <div className="tooltip-stat">
            <span className="tooltip-label">Official Population</span>
            <span className="tooltip-value">{officialNumber}</span>
          </div>
          <div className="tooltip-stat">
            <span className="tooltip-label">Perceived Population</span>
            <span className="tooltip-value">{perceivedNumber}</span>
          </div>
        </div>

        <div className="tooltip-divider"></div>

        <div className="tooltip-gap">
          <span className="tooltip-label">Population Gap</span>
          <div className="tooltip-gap-value">
            <span
              className="tooltip-gap-number"
              style={{
                color: estimationType.includes("Over") ? "#dc2626" : "#2563eb",
              }}
            >
              {gapNumber}
            </span>
            <span
              className={`tooltip-gap-badge ${
                estimationType.includes("Over")
                  ? "overestimated"
                  : "underestimated"
              }`}
            >
              {estimationType}
            </span>
          </div>
        </div>

        <div className="tooltip-divider"></div>

        <div className="tooltip-responses">{responses}</div>
      </div>

      <div className="tooltip-arrow"></div>
    </div>
  );
};
