import React, { useState, useCallback } from "react";
import {
  useHoverHighlight,
  useHighlightColor,
} from '../../hooks/useMatchInteraction';
import { useHighlightSelection } from '../../hooks/useNavigation';

interface HighlightProps {
  highlightId: string;
  matchCardId: string;
  matchIndex: number;
  children: React.ReactNode;
}

// Move function outside component to prevent recreation on every render
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const Highlight: React.FC<HighlightProps> = React.memo(({
  highlightId,
  matchCardId,
  matchIndex,
  children,
}) => {
  // Use local hover state to avoid global rerenders
  const [isHovered, setIsHovered] = useState(false);
  const hoverHighlight = useHoverHighlight();
  const color = useHighlightColor(matchCardId);

  const { isSelected, onClick } = useHighlightSelection(matchCardId, matchIndex);

  const backgroundAlpha = isSelected ? 'B3' : '4D';

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    hoverHighlight(highlightId);
  }, [highlightId, hoverHighlight]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    hoverHighlight(null);
  }, [hoverHighlight]);

  // Debug logging removed - hover optimizations complete
  return (
    <span
      data-highlight-id={highlightId}
      data-testid={`highlight-${highlightId}`}
      onClick={onClick}
      className="cursor-pointer focus:outline focus:outline-2 focus:outline-offset-1 hover:brightness-125"
      style={{
        backgroundColor: hexToRgba(color, backgroundAlpha === 'B3' ? 0.7 : 0.3),
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: isHovered ? color : "transparent",
        transition: "background-color 550ms ease, border-color 150ms ease",
        willChange: "background-color, border-color",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </span>
  );
});

Highlight.displayName = 'Highlight';