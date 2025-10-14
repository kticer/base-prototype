
interface RubricControlsProps {
  type: "row" | "column";
  index: number;
  onAdd: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canRemove: boolean;
}

export function RubricControls({
  type,
  index,
  onAdd,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  canRemove,
}: RubricControlsProps) {

  const isRow = type === "row";
  const isColumn = type === "column";

  const handleRemove = () => {
    if (canRemove && window.confirm(`Are you sure you want to delete this ${type}?`)) {
      onRemove();
    }
  };

  return (
    <div
      className={`absolute ${
        isRow 
          ? 'right-0 top-0 h-full w-8 -mr-8' 
          : 'top-0 left-0 w-full h-8 -mt-8'
      } bg-white opacity-0 hover:opacity-100 transition-opacity duration-200 z-10`}
    >
      <div className={`flex ${isRow ? 'flex-col h-full' : 'flex-row w-full'} items-center justify-center`}>
        {/* Movement Controls */}
        <div className={`flex ${isRow ? 'flex-col' : 'flex-row'} gap-1`}>
          {(isRow && onMoveUp) && (
            <button
              onClick={onMoveUp}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Move up"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          
          {(isColumn && onMoveLeft) && (
            <button
              onClick={onMoveLeft}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Move left"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Add Button */}
          <button
            onClick={onAdd}
            className="p-1 text-teal-500 hover:text-teal-600 hover:bg-teal-50 rounded"
            title={`Add ${type} ${isRow ? 'below' : 'after'}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Duplicate Button */}
          <button
            onClick={onDuplicate}
            className="p-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title={`Duplicate ${type}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Remove Button */}
          {canRemove && (
            <button
              onClick={handleRemove}
              className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
              title={`Delete ${type}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          {(isColumn && onMoveRight) && (
            <button
              onClick={onMoveRight}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Move right"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {(isRow && onMoveDown) && (
            <button
              onClick={onMoveDown}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Move down"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Index indicator */}
      <div className={`absolute ${
        isRow 
          ? 'left-1 top-1/2 transform -translate-y-1/2' 
          : 'top-1 left-1/2 transform -translate-x-1/2'
      } text-xs text-gray-400 bg-white px-1 rounded`}>
        {index + 1}
      </div>
    </div>
  );
}