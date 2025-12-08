"use client";

import { useState, useMemo, useCallback } from "react";

/**
 * BipartiteGraph - A reusable component for visualizing connections between two sets of items.
 *
 * Uses cubic bezier curves that start and end horizontally for smooth, elegant connections.
 * Supports hover interactions to highlight related items and connections.
 *
 * @example
 * <BipartiteGraph
 *   leftItems={[{ id: "steel", label: "Steel" }, { id: "concrete", label: "Concrete" }]}
 *   rightItems={[{ id: "habitat", label: "Habitat" }, { id: "soil", label: "Soil" }]}
 *   connections={[
 *     { sourceId: "steel", targetId: "habitat" },
 *     { sourceId: "steel", targetId: "soil" },
 *     { sourceId: "concrete", targetId: "soil" },
 *   ]}
 * />
 */

export interface BipartiteItem {
  id: string;
  label: string;
  /** Optional metadata for display */
  meta?: string;
}

export interface BipartiteConnection {
  sourceId: string;
  targetId: string;
  /** Optional weight for line thickness */
  weight?: number;
}

export interface BipartiteGraphProps {
  /** Items displayed on the left side */
  leftItems: BipartiteItem[];
  /** Items displayed on the right side */
  rightItems: BipartiteItem[];
  /** Connections between left and right items */
  connections: BipartiteConnection[];
  /** Left column header */
  leftHeader?: string;
  /** Right column header */
  rightHeader?: string;
  /** Height of each item row in pixels */
  rowHeight?: number;
  /** Horizontal gap between columns and the connection area */
  columnWidth?: number;
  /** Width of the connection area */
  connectionAreaWidth?: number;
  /** Color for connections (CSS color) */
  connectionColor?: string;
  /** Color for highlighted connections */
  highlightColor?: string;
  /** Opacity for non-highlighted connections when something is hovered */
  dimmedOpacity?: number;
  /** Custom class for the container */
  className?: string;
}

export function BipartiteGraph({
  leftItems,
  rightItems,
  connections,
  leftHeader = "Sources",
  rightHeader = "Targets",
  rowHeight = 32,
  columnWidth = 200,
  connectionAreaWidth = 160,
  connectionColor = "#94a3b8", // slate-400
  highlightColor = "#3b82f6", // blue-500
  dimmedOpacity = 0.15,
  className = "",
}: BipartiteGraphProps) {
  const [hoveredLeftId, setHoveredLeftId] = useState<string | null>(null);
  const [hoveredRightId, setHoveredRightId] = useState<string | null>(null);

  // Build lookup maps for efficient access
  const connectionsBySource = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const conn of connections) {
      if (!map.has(conn.sourceId)) {
        map.set(conn.sourceId, new Set());
      }
      map.get(conn.sourceId)!.add(conn.targetId);
    }
    return map;
  }, [connections]);

  const connectionsByTarget = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const conn of connections) {
      if (!map.has(conn.targetId)) {
        map.set(conn.targetId, new Set());
      }
      map.get(conn.targetId)!.add(conn.sourceId);
    }
    return map;
  }, [connections]);

  // Calculate positions for each item
  const leftPositions = useMemo(() => {
    const map = new Map<string, number>();
    leftItems.forEach((item, idx) => {
      map.set(item.id, idx * rowHeight + rowHeight / 2);
    });
    return map;
  }, [leftItems, rowHeight]);

  const rightPositions = useMemo(() => {
    const map = new Map<string, number>();
    rightItems.forEach((item, idx) => {
      map.set(item.id, idx * rowHeight + rowHeight / 2);
    });
    return map;
  }, [rightItems, rowHeight]);

  // Determine which items/connections are highlighted
  const getHighlightState = useCallback(
    (sourceId: string, targetId: string) => {
      const isHovering = hoveredLeftId !== null || hoveredRightId !== null;
      if (!isHovering) return "normal";

      if (hoveredLeftId) {
        const targets = connectionsBySource.get(hoveredLeftId);
        if (sourceId === hoveredLeftId && targets?.has(targetId)) {
          return "highlighted";
        }
        return "dimmed";
      }

      if (hoveredRightId) {
        const sources = connectionsByTarget.get(hoveredRightId);
        if (targetId === hoveredRightId && sources?.has(sourceId)) {
          return "highlighted";
        }
        return "dimmed";
      }

      return "normal";
    },
    [hoveredLeftId, hoveredRightId, connectionsBySource, connectionsByTarget]
  );

  const isLeftItemHighlighted = useCallback(
    (itemId: string) => {
      if (!hoveredLeftId && !hoveredRightId) return false;
      if (hoveredLeftId === itemId) return true;
      if (hoveredRightId) {
        const sources = connectionsByTarget.get(hoveredRightId);
        return sources?.has(itemId) ?? false;
      }
      return false;
    },
    [hoveredLeftId, hoveredRightId, connectionsByTarget]
  );

  const isRightItemHighlighted = useCallback(
    (itemId: string) => {
      if (!hoveredLeftId && !hoveredRightId) return false;
      if (hoveredRightId === itemId) return true;
      if (hoveredLeftId) {
        const targets = connectionsBySource.get(hoveredLeftId);
        return targets?.has(itemId) ?? false;
      }
      return false;
    },
    [hoveredLeftId, hoveredRightId, connectionsBySource]
  );

  // Generate cubic bezier path
  const generatePath = useCallback(
    (y1: number, y2: number) => {
      const x1 = 0;
      const x2 = connectionAreaWidth;
      // Control points at 40% and 60% for smooth horizontal entry/exit
      const cx = connectionAreaWidth * 0.4;
      return `M ${x1},${y1} C ${x1 + cx},${y1} ${x2 - cx},${y2} ${x2},${y2}`;
    },
    [connectionAreaWidth]
  );

  const svgHeight = Math.max(leftItems.length, rightItems.length) * rowHeight;
  const totalWidth = columnWidth * 2 + connectionAreaWidth;

  const isHovering = hoveredLeftId !== null || hoveredRightId !== null;

  return (
    <div className={`font-mono ${className}`}>
      {/* Headers */}
      <div className="flex items-center mb-3" style={{ width: totalWidth }}>
        <div
          className="text-xs text-gray-400 uppercase tracking-wider"
          style={{ width: columnWidth }}
        >
          {leftHeader}
        </div>
        <div style={{ width: connectionAreaWidth }} />
        <div
          className="text-xs text-gray-400 uppercase tracking-wider"
          style={{ width: columnWidth }}
        >
          {rightHeader}
        </div>
      </div>

      {/* Main visualization */}
      <div className="flex" style={{ width: totalWidth }}>
        {/* Left column */}
        <div style={{ width: columnWidth }}>
          {leftItems.map((item) => {
            const highlighted = isLeftItemHighlighted(item.id);
            const dimmed = isHovering && !highlighted;
            return (
              <div
                key={item.id}
                className={`
                  flex items-center justify-end pr-3 text-sm cursor-pointer
                  transition-all duration-150
                  ${highlighted ? "text-blue-600 font-medium" : "text-gray-700"}
                  ${dimmed ? "opacity-30" : "opacity-100"}
                `}
                style={{ height: rowHeight }}
                onMouseEnter={() => setHoveredLeftId(item.id)}
                onMouseLeave={() => setHoveredLeftId(null)}
              >
                <span className="truncate" title={item.label}>
                  {item.label}
                </span>
                {item.meta && (
                  <span className="ml-1 text-xs text-gray-400">{item.meta}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Connection area (SVG) */}
        <svg
          width={connectionAreaWidth}
          height={svgHeight}
          className="flex-shrink-0"
        >
          {connections.map((conn) => {
            const y1 = leftPositions.get(conn.sourceId);
            const y2 = rightPositions.get(conn.targetId);
            if (y1 === undefined || y2 === undefined) return null;

            const state = getHighlightState(conn.sourceId, conn.targetId);
            const stroke =
              state === "highlighted" ? highlightColor : connectionColor;
            const opacity =
              state === "dimmed" ? dimmedOpacity : state === "highlighted" ? 1 : 0.6;
            const strokeWidth = state === "highlighted" ? 2 : 1;

            return (
              <path
                key={`${conn.sourceId}-${conn.targetId}`}
                d={generatePath(y1, y2)}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                opacity={opacity}
                className="transition-all duration-150"
              />
            );
          })}
        </svg>

        {/* Right column */}
        <div style={{ width: columnWidth }}>
          {rightItems.map((item) => {
            const highlighted = isRightItemHighlighted(item.id);
            const dimmed = isHovering && !highlighted;
            return (
              <div
                key={item.id}
                className={`
                  flex items-center pl-3 text-sm cursor-pointer
                  transition-all duration-150
                  ${highlighted ? "text-blue-600 font-medium" : "text-gray-700"}
                  ${dimmed ? "opacity-30" : "opacity-100"}
                `}
                style={{ height: rowHeight }}
                onMouseEnter={() => setHoveredRightId(item.id)}
                onMouseLeave={() => setHoveredRightId(null)}
              >
                <span className="truncate" title={item.label}>
                  {item.label}
                </span>
                {item.meta && (
                  <span className="ml-1 text-xs text-gray-400">{item.meta}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default BipartiteGraph;
