import React, { useState, useCallback } from "react";
import { useStore } from "../../store";
import {
  useHoverHighlight,
  useHighlightColor,
} from '../../hooks/useMatchInteraction';
import { useHighlightSelection } from '../../hooks/useNavigation';
import type { AIWritingType } from '../../types';

interface AnnotationSpanProps {
  highlightId?: string;
  matchCardId?: string;
  matchIndex?: number;
  commentId?: string;
  annotationType: "similarity" | "comment" | "grading" | "ai-writing";
  aiWritingType?: AIWritingType;
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

export const AnnotationSpan: React.FC<AnnotationSpanProps> = React.memo(({
  highlightId,
  matchCardId,
  matchIndex,
  commentId,
  annotationType,
  aiWritingType,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const hoverHighlight = useHoverHighlight();
  const color = useHighlightColor(matchCardId || "");
  const { selectComment, selectedCommentId, navigation } = useStore();

  // Handle similarity highlighting
  const { isSelected: isSimilaritySelected, onClick: onSimilarityClick } =
    useHighlightSelection(matchCardId || "", matchIndex || 0);

  // Handle comment selection
  const isCommentSelected = selectedCommentId === commentId;

  // Check if this highlight is being referenced by chat
  const isChatReferenced = navigation.chatReferencedHighlightId === highlightId;

  const getAnnotationStyle = () => {
    switch (annotationType) {
      case "similarity": {
        // Increase alpha when chat references this highlight
        let backgroundAlpha = isSimilaritySelected ? 0.7 : 0.3;
        if (isChatReferenced) {
          backgroundAlpha = 0.9; // Max brightness for chat reference
        }

        return {
          backgroundColor: hexToRgba(color, backgroundAlpha),
          borderWidth: isChatReferenced ? "2px" : "1px",
          borderStyle: "solid",
          borderColor: isChatReferenced ? color : (isHovered ? color : "transparent"),
          transition: "background-color 550ms ease, border-color 150ms ease, border-width 300ms ease",
          boxShadow: isChatReferenced ? `0 0 8px ${hexToRgba(color, 0.6)}` : 'none',
        };
      }
      case "ai-writing": {
        // AI Writing highlights - purple for paraphrased, cyan for generated
        const baseColor = aiWritingType === 'ai-paraphrased' ? '#b78cfc' : '#52c7db';
        let backgroundAlpha = 0.7; // Base 70% opacity from Figma

        if (isSelected) {
          backgroundAlpha = 0.85; // More opaque when selected
        }

        return {
          backgroundColor: hexToRgba(baseColor, backgroundAlpha),
          borderBottom: (isHovered || isSelected) ? `2px solid ${baseColor}` : 'none',
          transition: "background-color 300ms ease, border-bottom 150ms ease",
          cursor: "pointer",
        };
      }
      case "comment":
        return {
          backgroundColor: isCommentSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.1)',
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: isHovered ? '#3B82F6' : 'transparent',
          borderRadius: "2px",
          transition: "background-color 200ms ease, border-color 150ms ease",
        };
      case "grading":
        return {
          backgroundColor: isHovered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: isHovered ? '#10B981' : 'transparent',
          borderRadius: "2px",
          transition: "background-color 200ms ease, border-color 150ms ease",
        };
      default:
        return {};
    }
  };

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (annotationType === "similarity" && highlightId) {
      hoverHighlight(highlightId);
    }
  }, [highlightId, hoverHighlight, annotationType]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (annotationType === "similarity") {
      hoverHighlight(null);
    }
  }, [hoverHighlight, annotationType]);

  const handleClick = useCallback(() => {
    if (annotationType === "similarity" && onSimilarityClick) {
      onSimilarityClick();
    } else if (annotationType === "comment" && commentId) {
      selectComment(commentId);
    } else if (annotationType === "ai-writing") {
      setIsSelected(!isSelected);
    }
  }, [annotationType, onSimilarityClick, commentId, selectComment, isSelected]);

  return (
    <span
      data-highlight-id={highlightId}
      data-comment-id={commentId}
      data-annotation-type={annotationType}
      data-testid={annotationType === "similarity" ? `highlight-${highlightId}` : `annotation-${annotationType}-${highlightId || commentId}`}
      onClick={handleClick}
      className="cursor-pointer focus:outline focus:outline-2 focus:outline-offset-1 hover:brightness-125"
      style={getAnnotationStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </span>
  );
});

AnnotationSpan.displayName = 'AnnotationSpan';