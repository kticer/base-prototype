
interface DocumentPageControlsProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  wordCount: number;
  scale?: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export default function DocumentPageControls({
  currentPage,
  totalPages,
  zoom,
  wordCount,
  scale = 1.0,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: DocumentPageControlsProps) {
  // Calculate effective scale (zoom * layout scale)
  const effectiveScale = Math.round((zoom / 100) * scale * 100);
  return (
    <div className="absolute bottom-0 left-0">
      <div className="bg-white shadow-md rounded-lg px-4 py-2 flex items-center text-sm text-gray-700 border border-gray-200 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M4 4h16v16H4z" />
              <path d="M8 4v16" />
            </svg>
            <span className="font-medium">Page {currentPage} of {totalPages}</span>
          </div>
          <span className="text-gray-400">|</span>
          <span className="text-gray-700">{wordCount.toLocaleString()} words</span>
          <span className="text-gray-400">|</span>
          <button
            onClick={onZoomReset}
            className="text-gray-700 hover:underline cursor-pointer"
            title={scale < 1.0 ? `Zoom: ${zoom}% × Layout: ${Math.round(scale * 100)}% = ${effectiveScale}%` : "Reset zoom"}
          >
            {effectiveScale}%
          </button>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={onZoomOut}
              className="w-7 h-7 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
            >
              –
            </button>
            <button
              onClick={onZoomIn}
              className="w-7 h-7 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}