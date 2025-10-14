import { useStore } from '../store';
import { useMemo } from 'react';

/**
 * Hook for accessing currently selected match information
 * @returns Object containing selected match card ID, highlight ID, and match index
 * @example
 * ```tsx
 * const { cardId, highlightId, matchIndex } = useSelectedMatch();
 * if (cardId) {
 *   // Handle selected match
 * }
 * ```
 */
export function useSelectedMatch() {
  return useStore((s) => ({
    cardId: s.navigation.selectedSourceId,
    highlightId: s.navigation.selectedHighlightId,
    matchIndex: s.navigation.selectedMatchIndex,
  }));
}

/**
 * Hook for accessing currently hovered highlight ID
 * @returns The ID of the currently hovered highlight, or null if none
 * @example
 * ```tsx
 * const hoveredId = useHoveredHighlight();
 * const isHovered = hoveredId === highlightId;
 * ```
 */
export function useHoveredHighlight() {
  return useStore((s) => s.hoveredHighlightId);
}

/**
 * Hook to check if a match card source is excluded from similarity calculations
 * @param id - The match card ID to check
 * @returns True if the source is excluded, false otherwise
 * @example
 * ```tsx
 * const isExcluded = useIsExcluded(matchCard.id);
 * const opacity = isExcluded ? 0.5 : 1;
 * ```
 */
export function useIsExcluded(id: string): boolean {
  return useStore((s) => s.excludedSourceIds.has(id));
}

/**
 * Hook for toggling the inclusion/exclusion of a match card source
 * @returns Function to toggle source inclusion status
 * @example
 * ```tsx
 * const toggleInclusion = useToggleSourceInclusion();
 * const handleToggle = () => toggleInclusion(matchCard.id);
 * ```
 */
export function useToggleSourceInclusion() {
  return useStore((s) => s.toggleSourceInclusion);
}

/**
 * Hook for selecting a specific match card and match index
 * @returns Function to select a match with source, index, and navigation type
 * @example
 * ```tsx
 * const selectMatch = useSelectMatch();
 * const handleSelect = () => selectMatch(cardId, 0, "card");
 * ```
 */
export function useSelectMatch() {
  return useStore((s) => s.selectMatch);
}

/**
 * Hook for setting the currently hovered highlight
 * @returns Function to set hovered highlight ID
 * @example
 * ```tsx
 * const hoverHighlight = useHoverHighlight();
 * const handleMouseEnter = () => hoverHighlight(highlightId);
 * const handleMouseLeave = () => hoverHighlight(null);
 * ```
 */
export function useHoverHighlight() {
  return useStore((s) => s.hoverHighlight);
}

const FALLBACK_COLORS = ['#CC1476', '#225EC7', '#007546', '#7533E8', '#006D81'];

/**
 * Hook for getting the assigned color for a specific match card
 * @param matchCardId - The ID of the match card
 * @returns The assigned color for the match card, or a fallback color
 * @example
 * ```tsx
 * const color = useHighlightColor(matchCard.id);
 * const style = { backgroundColor: color };
 * ```
 */
export function useHighlightColor(matchCardId: string): string {
  const highlightColors = useStore((s) => s.highlightColors);
  
  return useMemo(() => {
    const color = highlightColors[matchCardId];
    if (color) return color;

    // Fall back to deterministic rotation from the fallback set
    const allIds = Object.keys(highlightColors);
    const index = allIds.indexOf(matchCardId);
    return FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? '#CCCCCC';
  }, [highlightColors, matchCardId]);
}

/**
 * Hook for assigning colors to match cards
 * @returns Function to assign colors to an array of match cards
 * @example
 * ```tsx
 * const assignColors = useAssignColors();
 * useEffect(() => {
 *   assignColors(matchCards);
 * }, [matchCards, assignColors]);
 * ```
 */
export function useAssignColors() {
  return useStore((s) => s.assignColors);
}

/**
 * Hook for calculating total similarity score from non-excluded match cards
 * @param allMatchCards - Array of match cards with similarity percentages
 * @returns Total similarity score excluding excluded sources
 * @example
 * ```tsx
 * const totalScore = useSimilarityScore(matchCards);
 * const displayScore = `${totalScore}% overall similarity`;
 * ```
 */
export function useSimilarityScore(allMatchCards: { id: string; similarityPercent: number }[]) {
  const excluded = useStore((s) => s.excludedSourceIds);
  return useMemo(() => {
    return allMatchCards
      .filter((m) => !excluded.has(m.id))
      .reduce((sum, m) => sum + m.similarityPercent, 0);
  }, [excluded, allMatchCards]);
}

/**
 * Hook for accessing the currently selected match index
 * @returns The index of the currently selected match within its card
 * @example
 * ```tsx
 * const selectedIndex = useSelectedMatchIndex();
 * const isSelected = index === selectedIndex;
 * ```
 */
export function useSelectedMatchIndex() {
  return useStore((s) => s.navigation.selectedMatchIndex);
}

/**
 * Hook for setting the selected match with simplified API
 * @returns Function to select a match by ID and index, or clear selection
 * @example
 * ```tsx
 * const setSelectedMatch = useSetSelectedMatch();
 * const handleSelect = () => setSelectedMatch(matchId, 0);
 * const handleClear = () => setSelectedMatch(null, 0);
 * ```
 */
export function useSetSelectedMatch() {
  const selectMatch = useStore((s) => s.selectMatch);
  const clearSelection = useStore((s) => s.clearSelection);

  return (matchId: string | null, matchIndex: number) => {
    if (matchId) {
      selectMatch(matchId, matchIndex, "card");
      
      // Scroll behaviors now handled by components themselves
      // This maintains separation of concerns
    } else {
      clearSelection();
    }
  };
}

// Removed useScrollToMatchCard - unused function that performed DOM queries
// Scroll behaviors should be handled by components with refs