import React, { useMemo } from "react";

type CityTooltipProps = {
  content: string;
  position: { x: number; y: number };
  containerBounds?: DOMRect;
};

export const CityTooltip: React.FC<CityTooltipProps> = ({
  content,
  position,
  containerBounds,
}) => {
  const tooltipPosition = useMemo(() => {
    if (!containerBounds) return { x: 0, y: 0 };

    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const padding = 10;

    let x = position.x;
    let y = position.y;

    // Adjust horizontal position if tooltip would overflow
    if (x + tooltipWidth / 2 > containerBounds.width) {
      x = containerBounds.width - tooltipWidth / 2 - padding;
    } else if (x - tooltipWidth / 2 < 0) {
      x = tooltipWidth / 2 + padding;
    }

    y = y - tooltipHeight - padding;

    // // Adjust vertical position if tooltip would overflow
    // if (y - tooltipHeight < 0) {
    //   // Place tooltip below the marker if it would overflow at the top
    //   y = y + padding;
    // } else {
    //   // Otherwise, place it above the marker

    // }

    return { x, y };
  }, [position, containerBounds]);

  // Early return moved after useMemo
  if (!content || !containerBounds) return null;

  // Parse the content
  const lines = content.trim().split("\n");
  const [cityInfo, officialPop, perceivedPop, gap, estimation, responses] =
    lines.map((line) => line.trim());

  const [name, country] = cityInfo.split(",").map((s) => s.trim());
  const officialNumber = officialPop.split(":")[1].trim();
  const perceivedNumber = perceivedPop.split(":")[1].trim();
  const gapNumber = gap.split(":")[1].trim();
  const estimationType = estimation.trim();

  return (
    <div
      className="tooltip tooltip-enter"
      style={{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
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
    </div>
  );
};
