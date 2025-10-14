import React from 'react';
import type { AnnotationPosition } from '../../store';

interface LocatorDotProps {
  position: AnnotationPosition;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const LocatorDot: React.FC<LocatorDotProps> = ({
  position,
  containerRef
}) => {
  if (!containerRef.current) return null;

  const container = containerRef.current;
  
  // Convert percentage positions to pixel coordinates
  const left = (position.x / 100) * container.offsetWidth;
  const top = (position.y / 100) * container.offsetHeight;

  return (
    <div
      className="absolute z-40 pointer-events-none"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: 'translate(-50%, -50%)', // Center the dot on the point
      }}
    >
      <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
    </div>
  );
};
