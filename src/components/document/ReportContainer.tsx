import { useMemo } from "react";
import { MatchCard } from "./MatchCard";
import type { MatchCard as MatchCardType } from "../../types";
import ErrorBoundary from "../error/ErrorBoundary";
import { MatchCardErrorFallback } from "../error/MatchCardErrorFallback";

export default function ReportContainer({ matchCards }: { matchCards: MatchCardType[] }) {
  const sortedCards = useMemo(() => 
    [...matchCards].sort((a, b) => b.similarityPercent - a.similarityPercent),
    [matchCards]
  );

  return (
    <div className="space-y-4">
      {sortedCards.map((card, index) => (
        <ErrorBoundary 
          key={card.id}
          fallback={MatchCardErrorFallback}
          onError={(error, errorInfo) => {
            console.error(`MatchCard error for card ${card.id}:`, error, errorInfo);
          }}
        >
          <MatchCard card={card} index={index} />
        </ErrorBoundary>
      ))}
    </div>
  );
}