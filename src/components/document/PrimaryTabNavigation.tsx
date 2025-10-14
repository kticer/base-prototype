
interface PrimaryTabNavigationProps {
  primaryTab: string;
  onPrimaryTabChange: (tab: string) => void;
}

const TABS = ["Similarity", "AI Writing", "Flags", "Feedback", "Grading"];

export function PrimaryTabNavigation({ primaryTab, onPrimaryTabChange }: PrimaryTabNavigationProps) {
  return (
    <div className="bg-white border-b px-3 md:px-6 py-2 flex gap-3 md:gap-6 text-sm justify-center overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab}
          className={`font-semibold pb-1 whitespace-nowrap ${
            primaryTab === tab
              ? "border-b-2 border-blue-500 text-gray-900"
              : "text-gray-400 hover:text-gray-600"
          }`}
          onClick={() => onPrimaryTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
