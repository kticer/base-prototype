import { useStore } from "../../store";
import { StarIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon, LightBulbIcon, SwatchIcon, TrashIcon } from "@heroicons/react/24/outline";

export function HighlightsPanel() {
  const customHighlights = useStore((state) => state.customHighlights);
  const deleteCustomHighlight = useStore((state) => state.deleteCustomHighlight);

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case "important": return StarIcon;
      case "question": return QuestionMarkCircleIcon;
      case "error": return ExclamationTriangleIcon;
      case "suggestion": return LightBulbIcon;
      default: return SwatchIcon;
    }
  };

  const getHighlightColor = (type: string, customColor?: string) => {
    if (customColor) return customColor;
    
    switch (type) {
      case "important": return "#fef3c7";
      case "question": return "#dbeafe";
      case "error": return "#fee2e2";
      case "suggestion": return "#d1fae5";
      default: return "#f3e8ff";
    }
  };

  const handleDeleteHighlight = (highlightId: string) => {
    // Also remove the highlight from the DOM
    const highlightElement = document.querySelector(`[data-highlight-id="${highlightId}"]`);
    if (highlightElement) {
      const parent = highlightElement.parentNode;
      if (parent) {
        // Replace the highlight span with its text content
        const textNode = document.createTextNode(highlightElement.textContent || '');
        parent.replaceChild(textNode, highlightElement);
        
        // Normalize the text nodes to merge adjacent text nodes
        parent.normalize();
      }
    }
    
    deleteCustomHighlight(highlightId);
  };

  if (customHighlights.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <SwatchIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No custom highlights yet.</p>
        <p className="text-xs mt-1">Select text in the document and use the highlight button to create highlights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 px-3">Custom Highlights ({customHighlights.length})</div>
      
      {customHighlights.map((highlight) => {
        const IconComponent = getHighlightIcon(highlight.type);
        const backgroundColor = getHighlightColor(highlight.type, highlight.color);
        
        return (
          <div key={highlight.id} className="border border-gray-200 rounded-lg p-3 bg-white">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <div 
                  className="w-3 h-3 rounded-sm border border-gray-300 flex-shrink-0 mt-1"
                  style={{ backgroundColor }}
                />
                <IconComponent className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 capitalize mb-1">
                    {highlight.type}
                  </div>
                  <div className="text-sm text-gray-900 line-clamp-3 break-words">
                    "{highlight.text}"
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Page {highlight.page}
                  </div>
                  {highlight.note && (
                    <div className="text-xs text-gray-600 mt-1 italic">
                      Note: {highlight.note}
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleDeleteHighlight(highlight.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                title="Delete highlight"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}