import React from 'react';
import type { AnnotationPosition } from '../../store';

interface ConnectorLineProps {
  startPosition: AnnotationPosition;
  endPosition: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement>;
}

export const ConnectorLine: React.FC<ConnectorLineProps> = ({
  startPosition,
  endPosition,
  containerRef,
}) => {
  if (!containerRef.current) return null;

  const container = containerRef.current;
  const containerRect = container.getBoundingClientRect();

  // Convert annotation position to coordinates relative to the container
  const startX = (startPosition.x / 100) * container.offsetWidth;
  const startY = (startPosition.y / 100) * container.offsetHeight;

  // Convert end position (viewport coordinates) to be relative to the container
  const endX = endPosition.x - containerRect.left;
  const endY = endPosition.y - containerRect.top;

  // Calculate the bounding box for the line
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  // Calculate relative positions within the bounding box
  const x1 = startX - left;
  const y1 = startY - top;
  const x2 = endX - left;
  const y2 = endY - top;

  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${Math.max(width, 1)}px`,
        height: `${Math.max(height, 1)}px`,
      }}
    >
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#3B82F6"
          strokeWidth="2"
          strokeDasharray="5 5"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};
