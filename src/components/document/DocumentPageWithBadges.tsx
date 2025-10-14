import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { Badge } from '../ui/Badge';
import { useHighlightColor } from '../../hooks/useMatchInteraction';
import { useNavigation } from '../../hooks/useNavigation';
import { AnnotationSystem } from '../annotations/AnnotationSystem';
import type { DocumentData } from '../../types';


interface BaseBadgePosition {
  highlightId: string;
  matchCardId: string;
  matchIndex: number;
  top: number;
  sourceNumber: number;
}

interface BadgePosition extends BaseBadgePosition {
  groupIndex: number;
  stackIndex: number;
  isStacked: boolean;
}

interface BadgeGroup {
  position: BadgePosition;
  badges: BadgePosition[];
  isMultiple: boolean;
}

interface DocumentPageWithBadgesProps {
  pageContent: React.ReactNode[];
  pageNumber: number;
  highlights: DocumentData['highlights'];
  matchCards: DocumentData['matchCards'];
  className?: string;
  style?: React.CSSProperties;
  'data-page-number'?: number;
}

export const DocumentPageWithBadges = forwardRef<HTMLDivElement, DocumentPageWithBadgesProps>(({
  pageContent,
  pageNumber: _pageNumber,
  highlights,
  matchCards,
  className = '',
  style = {},
  'data-page-number': dataPageNumber,
}, ref) => {
  void _pageNumber; // Acknowledge unused parameter
  const pageRef = useRef<HTMLDivElement>(null);
  const [badgeGroups, setBadgeGroups] = useState<BadgeGroup[]>([]);
  const [hoveredGroupIndex, setHoveredGroupIndex] = useState<number | null>(null);
  const { selectedSourceId, selectedMatchIndex, goToMatch } = useNavigation();

  useEffect(() => {
    if (!pageRef.current) return;

    const calculateBadgePositions = () => {
      const positions: BaseBadgePosition[] = [];
      
      // Sort match cards by similarity percentage (same as in ReportContainer)
      const sortedMatchCards = [...matchCards].sort(
        (a, b) => b.similarityPercent - a.similarityPercent
      );
      
      // Find all highlight elements on this page
      const highlightElements = pageRef.current!.querySelectorAll('[data-highlight-id]');
      
      highlightElements.forEach((element) => {
        const highlightId = element.getAttribute('data-highlight-id');
        if (!highlightId) return;
        
        const highlight = highlights.find(h => h.id === highlightId);
        if (!highlight) return;
        
        const matchCard = matchCards.find(c => c.id === highlight.matchCardId);
        if (!matchCard) return;
        
        const matchIndex = matchCard.matches.findIndex(m => m.highlightId === highlight.id);
        if (matchIndex === -1) return;
        
        // Use the same sorting logic as ReportContainer to get the correct badge number
        const sourceNumber = sortedMatchCards.findIndex(c => c.id === highlight.matchCardId) + 1;
        
        // Simple approach: get positions relative to viewport and calculate difference
        const elementRect = element.getBoundingClientRect();
        const pageRect = pageRef.current!.getBoundingClientRect();
        
        // Position relative to the page container (no scroll adjustments needed)
        const topRelativeToPage = elementRect.top - pageRect.top;
        
        positions.push({
          highlightId,
          matchCardId: highlight.matchCardId,
          matchIndex,
          top: topRelativeToPage,
          sourceNumber,
        });
      });

      // Group badges by line (within 5px tolerance)
      const groupedPositions = positions.reduce((groups, pos) => {
        const existingGroup = groups.find(group => 
          Math.abs(group[0].top - pos.top) < 5
        );
        
        if (existingGroup) {
          existingGroup.push(pos);
        } else {
          groups.push([pos]);
        }
        
        return groups;
      }, [] as BaseBadgePosition[][]);

      // Create badge groups with multiple badge handling
      const finalGroups: BadgeGroup[] = groupedPositions.map((group, groupIndex) => {
        const isMultiple = group.length > 1;
        const badges: BadgePosition[] = group.map((pos, index) => ({
          ...pos,
          groupIndex,
          stackIndex: index,
          isStacked: isMultiple,
        }));
        
        // For multiple badges, use the first badge's position as the primary position
        const primaryPosition = badges[0];
        
        return {
          position: primaryPosition,
          badges,
          isMultiple,
        };
      });

      setBadgeGroups(finalGroups);
    };

    // Calculate positions after DOM updates using RAF for better timing
    const rafId = requestAnimationFrame(() => {
      setTimeout(calculateBadgePositions, 500); // Increased delay to ensure layout is complete
    });
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateBadgePositions);
    
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', calculateBadgePositions);
    };
  }, [pageContent, highlights, matchCards]);

  const BadgeComponent: React.FC<{ position: BadgePosition }> = ({ position }) => {
    const color = useHighlightColor(position.matchCardId);
    const isSelected = selectedSourceId === position.matchCardId && selectedMatchIndex === position.matchIndex;
    
    const handleBadgeClick = () => {
      goToMatch(position.matchCardId, position.matchIndex, 'highlight');
    };

    return (
      <Badge
        number={position.sourceNumber}
        color={color}
        isSelected={isSelected}
        onClick={handleBadgeClick}
        className="transition-all duration-200"
        style={{
          transform: position.isStacked ? 'scale(0.9)' : 'scale(1)',
        }}
      />
    );
  };

  const MultipleBadgeComponent: React.FC<{ group: BadgeGroup }> = ({ 
    group: _group 
  }) => {
    void _group; // Acknowledge unused parameter
    // Use a neutral color for the "Mult" badge - could be gray or primary color
    const color = '#6B7280'; // Gray color
    
    return (
      <Badge
        text="Mult"
        color={color}
        isSelected={false}
        onClick={() => {}} // No click action for the "Mult" badge itself
        className="transition-all duration-200"
      />
    );
  };

  return (
    <AnnotationSystem pageNumber={dataPageNumber || 1}>
      <div
        ref={(el) => {
          pageRef.current = el;
          if (typeof ref === 'function') {
            ref(el);
          } else if (ref) {
            ref.current = el;
          }
        }}
        className={`relative ${className}`}
        style={style}
        data-page-number={dataPageNumber}
      >
        {pageContent}
      
      {/* Render badge groups */}
      {badgeGroups.map((group, groupIndex) => {
        const isHovered = hoveredGroupIndex === groupIndex;
        
        return (
          <div key={`badge-group-${groupIndex}`}>
            {/* Hover area that encompasses both the Mult badge and the expanded stack */}
            <div
              onMouseEnter={() => setHoveredGroupIndex(groupIndex)}
              onMouseLeave={() => setHoveredGroupIndex(null)}
              className="absolute pointer-events-auto"
              style={{
                top: group.position.top,
                left: group.isMultiple ? -120 : -45, // Extended hover area for multiple badges
                width: group.isMultiple ? 120 : 45,
                height: group.isMultiple ? Math.max(32, group.badges.length * 28 + 4) : 32,
                zIndex: 19, // Below badges but above content
              }}
            >
              {/* Primary badge (either single badge or "Mult" badge) */}
              <div
                className="absolute"
                style={{
                  top: 0,
                  right: 0, // Position at right edge of hover area
                  zIndex: 20,
                }}
              >
                {group.isMultiple ? (
                  <MultipleBadgeComponent group={group} />
                ) : (
                  <BadgeComponent position={group.badges[0]} />
                )}
              </div>
              
              {/* Stacked badges for multiple badge groups when hovered */}
              {group.isMultiple && (
                <>
                  {group.badges.map((badge, badgeIndex) => (
                    <div
                      key={`stacked-badge-${badge.highlightId}`}
                      className="absolute"
                      style={{
                        top: badgeIndex * 28,
                        left: 0, // Position at left edge of hover area
                        zIndex: 21,
                        transform: isHovered ? 'translateX(0) scale(0.9)' : 'translateX(75px) scale(0.7)',
                        opacity: isHovered ? 1 : 0,
                        transition: `all 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
                        transitionDelay: isHovered ? `${badgeIndex * 50}ms` : `${(group.badges.length - badgeIndex - 1) * 50}ms`,
                        pointerEvents: isHovered ? 'auto' : 'none',
                      }}
                    >
                      <BadgeComponent position={badge} />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </AnnotationSystem>
  );
});

DocumentPageWithBadges.displayName = 'DocumentPageWithBadges';