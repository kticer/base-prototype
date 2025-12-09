interface PrimaryTabNavigationProps {
  primaryTab: string;
  onPrimaryTabChange: (tab: string) => void;
  similarityPercentage?: number;
  aiWritingPercentage?: number;
  flagsCount?: number;
}

const TABS = ["Similarity", "AI Writing", "Flags", "Feedback", "Grading"];

export function PrimaryTabNavigation({
  primaryTab,
  onPrimaryTabChange,
  similarityPercentage = 0,
  aiWritingPercentage = 0,
  flagsCount = 0,
}: PrimaryTabNavigationProps) {
  // Generate badges based on actual data
  const TAB_BADGES: Record<string, string> = {
    "Similarity": similarityPercentage > 0 ? `${similarityPercentage}%` : "",
    "AI Writing": aiWritingPercentage > 0 ? `${aiWritingPercentage}%` : "",
    "Flags": `${flagsCount}`,
    "Feedback": "",
    "Grading": "",
  };
  return (
    <div className="bg-surface-variant-2 border-b border-surface-outline flex items-center justify-center px-4 py-0">
      {TABS.map((tab) => {
        const isActive = primaryTab === tab;
        const badge = TAB_BADGES[tab];

        return (
          <div key={tab} className="flex flex-col items-center justify-center px-4 py-0 shrink-0">
            <button
              className="flex gap-2 items-center justify-center px-0 py-3 relative"
              onClick={() => onPrimaryTabChange(tab)}
            >
              {/* Label */}
              <div className="flex items-center justify-center px-0 py-0.5 rounded-2xl">
                <span className={`font-sans font-semibold text-label-medium text-center whitespace-nowrap ${
                  isActive ? 'text-surface-on-surface' : 'text-surface-on-surface-variant-1'
                }`}>
                  {tab}
                </span>
              </div>

              {/* Badge */}
              {badge && (
                <span className="flex items-center justify-center px-2 py-0.5 bg-surface-on-surface-variant-2 rounded-full font-sans font-semibold text-label-small text-white leading-4">
                  {badge}
                </span>
              )}

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary rounded-t-[4px]" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
