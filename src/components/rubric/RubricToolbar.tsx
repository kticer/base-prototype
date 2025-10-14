import React, { useState, useRef, useEffect } from "react";
import type { RubricType } from "../../types/rubric";

interface RubricToolbarProps {
  title: string;
  type: RubricType;
  enableRangedScoring: boolean;
  enableEqualWeights: boolean;
  onTitleChange: (title: string) => void;
  onTypeChange: (type: RubricType) => void;
  onRangedScoringChange: (enabled: boolean) => void;
  onEqualWeightsChange: (enabled: boolean) => void;
  onSave: () => void;
  onReset: () => void;
  onCancel: () => void;
  hasUnsavedChanges: boolean;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function RubricToolbar({
  title,
  type,
  enableRangedScoring,
  enableEqualWeights,
  onTitleChange,
  onTypeChange,
  onRangedScoringChange,
  onEqualWeightsChange,
  onSave,
  onReset,
  onCancel,
  hasUnsavedChanges,
  viewMode,
  onViewModeChange,
}: RubricToolbarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleValue(title);
  }, [title]);

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleTitleCancel();
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
  };

  const handleTitleBlur = () => {
    handleTitleSave();
  };

  const handleTitleSave = () => {
    const trimmedTitle = titleValue.trim();
    if (trimmedTitle && trimmedTitle !== title) {
      onTitleChange(trimmedTitle);
    } else {
      setTitleValue(title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTitleValue(title);
    setIsEditingTitle(false);
  };

  const typeOptions = [
    { value: 'weighted', label: 'Weighted Rubric', icon: '⚖️' },
    { value: 'qualitative', label: 'Qualitative Rubric', icon: '📝' },
    { value: 'custom', label: 'Custom Rubric', icon: '🔧' },
    { value: 'grading-form', label: 'Grading Form', icon: '📋' },
  ] as const;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        {/* Title Section */}
        <div className="flex items-center gap-4 flex-1">
          {isEditingTitle ? (
            <input
              ref={inputRef}
              type="text"
              value={titleValue}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleTitleBlur}
              className="text-lg font-medium text-gray-900 bg-white border border-teal-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter rubric title..."
            />
          ) : (
            <button
              onClick={handleTitleClick}
              className="text-lg font-medium text-gray-900 hover:text-teal-600 transition-colors text-left"
            >
              {title || "Untitled Rubric"}
              <svg className="w-4 h-4 inline-block ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-3 py-1.5 text-xs rounded ${viewMode === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
              aria-pressed={viewMode === 'grid'}
            >
              Grid
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-1.5 text-xs rounded ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
              aria-pressed={viewMode === 'list'}
            >
              List
            </button>
          </div>
          {/* Quick Actions */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={onReset}
              className="text-gray-600 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
              title="Reset rubric to original state"
            >
              Reset
            </button>
            
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={onSave}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasUnsavedChanges
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!hasUnsavedChanges}
          >
            {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Flexible Controls Row */}
      <div className="flex items-center gap-6 text-sm">
        {/* Rubric Type Selector */}
        <div className="flex items-center gap-2">
          <label className="text-gray-700 font-medium">Type:</label>
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value as RubricType)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Scoring Controls - only show for appropriate types */}
        {(type === 'weighted' || type === 'qualitative' || type === 'custom') && (
          <>
            <div className="border-l border-gray-300 pl-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableRangedScoring}
                  onChange={(e) => onRangedScoringChange(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-gray-700">Ranged Scoring</span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableEqualWeights}
                  onChange={(e) => onEqualWeightsChange(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-gray-700">Equal Weights</span>
              </label>
            </div>
          </>
        )}

        {/* Grading Form Info */}
        {type === 'grading-form' && (
          <div className="border-l border-gray-300 pl-6 text-gray-600">
            Simple criteria list • Add columns to convert to matrix
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="ml-auto text-xs text-gray-500 flex items-center gap-4">
          <span>Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to save</span>
          <span>Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> to cancel</span>
        </div>
      </div>
    </div>
  );
}
