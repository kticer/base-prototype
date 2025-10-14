/**
 * Unified navigation hook that consolidates match and highlight navigation
 * Provides centralized navigation state and actions for match cards and highlights
 */
import { useCallback } from "react";
import { useStore } from "../store";

export type NavigationSource = "card" | "highlight" | null;

/**
 * Hook for managing navigation between match cards and highlights
 * 
 * @returns Object containing navigation state and actions
 * @example
 * ```tsx
 * const { selectedSourceId, goToMatch } = useNavigation();
 * const handleCardClick = () => goToMatch(cardId, 0, "card");
 * ```
 */
export function useNavigation() {
  const navigation = useStore((s) => s.navigation);
  const selectMatch = useStore((s) => s.selectMatch);
  const clearSelection = useStore((s) => s.clearSelection);

  // Core navigation actions
  
  /**
   * Navigate to a specific match card and match index
   * @param sourceId - ID of the match card to navigate to (null to clear selection)
   * @param matchIndex - Index of the match within the card
   * @param source - Source of the navigation ("card" or "highlight")
   */
  const goToMatch = useCallback(
    (sourceId: string | null, matchIndex: number, source: NavigationSource = "card") => {
      selectMatch(sourceId, matchIndex, source || "card");
    },
    [selectMatch]
  );

  /**
   * Clear the current match selection
   */
  const clearMatch = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  /**
   * Select a highlight and navigate to its corresponding match card
   * @param matchCardId - ID of the match card containing the highlight
   * @param matchIndex - Index of the match within the card
   */
  const selectHighlight = useCallback(
    (matchCardId: string, matchIndex: number) => {
      selectMatch(matchCardId, matchIndex, "highlight");
    },
    [selectMatch]
  );

  return {
    // Navigation state
    selectedSourceId: navigation.selectedSourceId,
    selectedMatchIndex: navigation.selectedMatchIndex,
    selectedHighlightId: navigation.selectedHighlightId,
    navigationSource: navigation.navigationSource,
    
    // Actions
    goToMatch,
    clearMatch,
    selectHighlight,
    
    // Selection checker
    isSelected: (sourceId: string, matchIndex: number) => 
      navigation.selectedSourceId === sourceId && navigation.selectedMatchIndex === matchIndex,
  };
}

// Specific hook for highlight components
export function useHighlightSelection(matchCardId: string, matchIndex: number) {
  const navigation = useStore((s) => s.navigation);
  const selectMatch = useStore((s) => s.selectMatch);

  const isSelected = navigation.selectedSourceId === matchCardId && navigation.selectedMatchIndex === matchIndex;

  const onClick = useCallback(() => {
    selectMatch(matchCardId, matchIndex, "highlight");
  }, [matchCardId, matchIndex, selectMatch]);

  return { isSelected, onClick };
}