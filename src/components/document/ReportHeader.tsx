import { FunnelIcon, InformationCircleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useStore } from "../../store";

interface ReportHeaderProps {
  similarityPercent: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  primaryTab: string;
}

export default function ReportHeader({
  similarityPercent,
  activeTab,
  setActiveTab,
  primaryTab,
}: ReportHeaderProps) {
  const { tabState, setTabState } = useStore();
  
  // Dynamic header content based on primary tab
  const getHeaderContent = () => {
    switch (primaryTab) {
      case "Similarity":
        return (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold whitespace-nowrap">{similarityPercent}% Overall Similarity</div>
              <button className="flex items-center gap-1 text-sm text-gray-700 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">
                <FunnelIcon className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 inline-flex border rounded overflow-hidden">
                {["Match Groups", "Sources"].map((tab) => (
                  <button
                    key={tab}
                    className={`flex-1 px-4 py-1 text-sm font-medium text-center ${
                      activeTab === tab
                        ? "bg-blue-100 text-blue-800"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <label htmlFor="overlapToggle" className="flex items-center gap-1">
                Show overlapping sources <InformationCircleIcon className="w-4 h-4 text-blue-600" />
              </label>
              <input
                id="overlapToggle"
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          </>
        );
      case "Chat":
        return (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold whitespace-nowrap">Chat</div>
            </div>
          </>
        );
      case "Feedback":
        return (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold whitespace-nowrap">Feedback</div>
              <button className="flex items-center gap-1 text-sm text-gray-700 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">
                <FunnelIcon className="w-4 h-4" />
                <span>Layers</span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 inline-flex border rounded overflow-hidden">
                {["QuickMarks", "Summary"].map((tab) => (
                  <button
                    key={tab}
                    className={`flex-1 px-4 py-1 text-sm font-medium text-center ${
                      activeTab === tab
                        ? "bg-blue-100 text-blue-800"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <button
                onClick={() => setTabState({ showSimilarityHighlights: !tabState.showSimilarityHighlights })}
                className="flex items-center gap-1 hover:text-gray-900"
              >
                {tabState.showSimilarityHighlights ? (
                  <EyeIcon className="w-4 h-4" />
                ) : (
                  <EyeSlashIcon className="w-4 h-4" />
                )}
                <span>Similarity Highlights</span>
              </button>
            </div>
          </>
        );
      case "Grading":
        return (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold whitespace-nowrap">Grading</div>
              <button className="flex items-center gap-1 text-sm text-gray-700 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50">
                <FunnelIcon className="w-4 h-4" />
                <span>Layers</span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Custom Rubric Name</div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <button
                onClick={() => setTabState({ showSimilarityHighlights: !tabState.showSimilarityHighlights })}
                className="flex items-center gap-1 hover:text-gray-900"
              >
                {tabState.showSimilarityHighlights ? (
                  <EyeIcon className="w-4 h-4" />
                ) : (
                  <EyeSlashIcon className="w-4 h-4" />
                )}
                <span>Similarity Highlights</span>
              </button>
            </div>
          </>
        );
      default:
        return (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-bold whitespace-nowrap">{primaryTab}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">{primaryTab} content</div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-3 border-b w-full">
      {getHeaderContent()}
    </div>
  );
}
