import { useState, useEffect, forwardRef, useRef } from "react";
import type { Ref } from "react";
import type { MatchCard as MatchCardType } from "../../types";
import {
  useIsExcluded,
  useToggleSourceInclusion,
  useHighlightColor,
} from '../../hooks/useMatchInteraction';
import { useNavigation } from '../../hooks/useNavigation';
import { Badge } from '../ui/Badge';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

interface MatchCardProps {
  card: MatchCardType;
  index: number;
}

export const MatchCard = forwardRef(function MatchCard(
  {
    card,
    index,
  }: MatchCardProps,
  ref: Ref<HTMLDivElement>
) {
  const {
    selectedSourceId,
    selectedMatchIndex,
    navigationSource,
    goToMatch,
  } = useNavigation();

  const isSelected = selectedSourceId === card.id;
  const matchIndex = isSelected ? selectedMatchIndex : 0;

  const isExcluded = useIsExcluded(card.id);
  const toggleSourceInclusion = useToggleSourceInclusion();
  const color = useHighlightColor(card.id);
  const navigate = useNavigate();

  // Carousel index ref
  const matchIndexRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && navigationSource === "highlight" && matchIndexRef.current) {
      matchIndexRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [isSelected, navigationSource, matchIndex]);

  const handleCardClick = () => {
    const matchIndexToUse = isSelected ? selectedMatchIndex : 0;
    
    // Direct store update - no need for custom events
    goToMatch(card.id, matchIndexToUse, "card");
  };

  const match = card.matches[matchIndex] ?? card.matches[0];
  const cardRef = useRef<HTMLDivElement>(null);

  const [expanded, setExpanded] = useState(isSelected);

  useEffect(() => {
    setExpanded(isSelected);
  }, [isSelected, card.id]);

  // DOM ref registration removed - component handles its own scrolling

  useEffect(() => {
    if (isSelected && cardRef.current) {
      // Small delay to ensure DOM has updated after expansion
      const performScroll = () => {
        if (!cardRef.current) return;
        
        // Custom scroll to position card 24px below ReportHeader
        const scrollContainer = cardRef.current.closest('.overflow-auto');
        const reportHeader = document.querySelector('.sticky.top-0.z-10.bg-white.shadow-sm');
        
        if (scrollContainer && reportHeader) {
        const cardRect = cardRef.current.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        const headerRect = reportHeader.getBoundingClientRect();
        
        // Calculate target position: 24px below header
        const targetOffset = 24;
        const desiredTop = headerRect.bottom + targetOffset;
        
        // Calculate current scroll position
        const currentScrollTop = scrollContainer.scrollTop;
        
        // Calculate where the card currently is relative to the scroll container's content
        const cardTopInScrollContent = cardRect.top - containerRect.top + currentScrollTop;
        
        // Calculate where we want the card to be positioned (24px below header within viewport)
        const targetPositionInViewport = desiredTop - containerRect.top;
        
        // Calculate new scroll position: move scroll so card appears at target position
        const newScrollTop = cardTopInScrollContent - targetPositionInViewport;
        
        // Ensure we don't scroll above 0 or beyond the scrollable area
        const maxScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        const targetScrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));
        
        // Use scrollTo if available (real browser), otherwise use scrollTop (test environment)
        if (typeof scrollContainer.scrollTo === 'function') {
          scrollContainer.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        } else {
          // Fallback for test environments
          scrollContainer.scrollTop = targetScrollTop;
        }
        
        // For bottom cards, try again after expansion is complete to account for new scroll height
        setTimeout(() => {
          if (!cardRef.current) return;
          
          const updatedScrollContainer = cardRef.current.closest('.overflow-auto');
          if (updatedScrollContainer) {
            const updatedCardRect = cardRef.current.getBoundingClientRect();
            const updatedContainerRect = updatedScrollContainer.getBoundingClientRect();
            const updatedCurrentScrollTop = updatedScrollContainer.scrollTop;
            
            // Recalculate with potentially updated scroll height
            const updatedCardTopInScrollContent = updatedCardRect.top - updatedContainerRect.top + updatedCurrentScrollTop;
            const updatedNewScrollTop = updatedCardTopInScrollContent - targetPositionInViewport;
            const updatedMaxScrollTop = updatedScrollContainer.scrollHeight - updatedScrollContainer.clientHeight;
            const updatedTargetScrollTop = Math.max(0, Math.min(updatedNewScrollTop, updatedMaxScrollTop));
            
            // Only scroll again if we can get closer to the target
            if (Math.abs(updatedTargetScrollTop - targetScrollTop) > 10) {
              if (typeof updatedScrollContainer.scrollTo === 'function') {
                updatedScrollContainer.scrollTo({
                  top: updatedTargetScrollTop,
                  behavior: 'smooth'
                });
              } else {
                updatedScrollContainer.scrollTop = updatedTargetScrollTop;
              }
            }
          }
        }, 100); // Small delay to allow expansion animation to complete
        } else {
          // Fallback to default scroll behavior if elements aren't found
          cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
      
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(performScroll);
    }
  }, [isSelected, card.id, index]);

  const handlePrev = () => {
    const newIndex = (matchIndex - 1 + card.matches.length) % card.matches.length;
    goToMatch(card.id, newIndex);
  };

  const handleNext = () => {
    const newIndex = (matchIndex + 1) % card.matches.length;
    goToMatch(card.id, newIndex);
  };

  const handleToggle = () => {
    console.log("Toggle clicked. Current selection:", selectedSourceId, "Card ID:", card.id);
    if (!isSelected) {
      goToMatch(card.id, 0);
    } else {
      goToMatch(null, 0);
    }
  };

  return (
    <div
      ref={(el) => {
        cardRef.current = el;
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          ref.current = el;
        }
      }}
      data-testid={`matchcard-${card.id}`}
      className={`border rounded-md my-2 shadow-sm transition-all duration-300 overflow-hidden ${
        expanded ? "p-4 ring-2 ring-blue-500 max-h-[1000px]" : "p-4 max-h-28 cursor-pointer hover:bg-gray-50"
      }`}
      onClick={!expanded ? handleCardClick : undefined}
      aria-expanded={expanded}
    >
      {!expanded && (
        <>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge
                number={index + 1}
                color={color}
                isSelected={isSelected}
              />
              <span className="inline-block text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
                {card.sourceType}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleSourceInclusion(card.id)} title="Exclude source" className="p-0">
                <NoSymbolIcon className="w-5 h-5 text-gray-400 hover:text-black" />
              </button>
              <button onClick={handleToggle} title="Expand" className="p-0">
                {isSelected ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-400 hover:text-black" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-400 hover:text-black" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span
              onClick={() => navigate(`/mock-url/${encodeURIComponent(card.sourceUrl || "")}`)}
              className="text-sm font-medium text-gray-800 truncate cursor-pointer hover:underline"
            >
              {card.sourceName}
            </span>
            <span className="text-sm font-semibold text-gray-700 ml-4">
              {card.similarityPercent === 0 ? "< 1%" : `${card.similarityPercent}%`}
            </span>
          </div>

          <div className="flex justify-left text-xs text-gray-600 mt-auto whitespace-nowrap gap-4">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {card.matches.length} text {card.matches.length > 1 ? "blocks" : "block"}
            </span>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m6 4H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2z" />
              </svg>
              {card.matchedWordCount} matched words
            </span>
          </div>
        </>
      )}

      {expanded && (
        <>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge
                number={index + 1}
                color={color}
                isSelected={isSelected}
              />
              <span className="inline-block text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
                {card.sourceType}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleSourceInclusion(card.id)} title="Exclude source" className="p-0">
                <NoSymbolIcon className="w-5 h-5 text-gray-400 hover:text-black" />
              </button>
              <button onClick={handleToggle} title="Collapse" className="p-0 transition-transform duration-200 rotate-180">
                <ChevronDownIcon className="w-5 h-5 text-gray-400 hover:text-black" />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span
              onClick={() => navigate(`/mock-url/${encodeURIComponent(card.sourceUrl || "")}`)}
              className="text-sm font-medium text-gray-800 truncate cursor-pointer hover:underline"
            >
              {card.sourceName}
            </span>
            <span className="text-sm font-semibold text-gray-700 ml-4">
              {card.similarityPercent === 0 ? "< 1%" : `${card.similarityPercent}%`}
            </span>
          </div>
          <div className="flex justify-left text-xs text-gray-600 mt-auto whitespace-nowrap gap-4 mb-3">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {card.matches.length} text {card.matches.length > 1 ? "blocks" : "block"}
            </span>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m6 4H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2z" />
              </svg>
              {card.matchedWordCount} matched words
            </span>
          </div>

          <hr className="my-3" />

          {/* Carousel and match index row */}
          <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <button onClick={handlePrev}>
                <ChevronLeftIcon className="w-3 h-3" />
              </button>
              <div ref={matchIndexRef} data-testid={`carousel-index-${matchIndex}`}>
                <span>{matchIndex + 1} of {card.matches.length}</span>
              </div>
              <button onClick={handleNext}>
                <ChevronRightIcon className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-gray-500">{card.matchedWordCount} words</span>
          </div>

          {/* Full source URL */}
          <div
            onClick={() => navigate(`/mock-url/${encodeURIComponent(card.sourceUrl || "")}`)}
            className="text-blue-600 break-all inline-flex items-center gap-1 text-sm mb-2 cursor-pointer hover:underline"
          >
            {card.sourceUrl}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
            </svg>
          </div>

          {/* Highlight in context */}
          <div
            className={`w-full p-3 rounded-md text-sm ${
              isExcluded ? "bg-gray-100 text-gray-400" : "bg-white"
            }`}
          >
            <p className="text-sm">
              <span className="text-gray-400">{match.contextBefore}</span>
              <span
                className="cursor-pointer px-1 rounded font-medium"
                style={{ backgroundColor: `${color}4D` }}
                onClick={() => goToMatch(card.id, matchIndex)}
              >
                {match.matchedText}
              </span>
              <span className="text-gray-400">{match.contextAfter}</span>
            </p>
          </div>

          {/* View Full Source Link */}
          <div className="text-center mt-3">
            <button className="text-blue-600 text-sm hover:underline">
              View Full Source Text
            </button>
          </div>

          {/* Exclude Match */}
          <div className="text-left mt-3">
            <button
              onClick={() => toggleSourceInclusion(card.id)}
              className="text-sm px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              {isExcluded ? "Include Match" : "Exclude Match"}
            </button>
          </div>

          <hr className="my-3" />

          {/* View other sources */}
          <div className="mt-2 text-sm font-medium text-gray-600">
            <button className="flex items-center gap-2 text-sm hover:text-gray-900">
              <ChevronDownIcon className="w-4 h-4" />
              View other sources
            </button>
          </div>
        </>
      )}
    </div>
  );
});