import React, { useState } from 'react';

interface TextControlsProps {
  position: { x: number; y: number };
  currentSize: 'small' | 'medium' | 'large';
  currentColor: string;
  onSizeChange: (size: 'small' | 'medium' | 'large') => void;
  onColorChange: (color: string) => void;
  onDelete: () => void;
}

const PRESET_COLORS = [
  '#000000', // Black
  '#EF4444', // Red
  '#3B82F6', // Blue  
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
];

const SIZE_OPTIONS = [
  { value: 'small' as const, label: 'Small (12px)' },
  { value: 'medium' as const, label: 'Medium (14px)' },
  { value: 'large' as const, label: 'Large (16px)' },
];

export const TextControls: React.FC<TextControlsProps> = ({
  position,
  currentSize,
  currentColor,
  onSizeChange,
  onColorChange,
  onDelete,
}) => {
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  return (
    <div
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg flex items-center px-3 py-2 space-x-2"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 60}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Text Size Control */}
      <div className="relative">
        <button
          onClick={() => {
            setShowSizeDropdown(!showSizeDropdown);
            setShowColorDropdown(false);
          }}
          className="flex items-center p-2 hover:bg-gray-100 rounded transition-colors"
          title="Text size"
        >
          <span className="text-lg font-bold mr-1">T</span>
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showSizeDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg min-w-[140px] z-60">
            {SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSizeChange(option.value);
                  setShowSizeDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-blue-50 first:rounded-t-lg last:rounded-b-lg ${
                  currentSize === option.value ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  {option.label}
                  {currentSize === option.value && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Color Control */}
      <div className="relative">
        <button
          onClick={() => {
            setShowColorDropdown(!showColorDropdown);
            setShowSizeDropdown(false);
          }}
          className="flex items-center p-2 hover:bg-gray-100 rounded transition-colors"
          title="Text color"
        >
          <div
            className="w-5 h-5 rounded-full border border-gray-300 mr-1"
            style={{ backgroundColor: currentColor }}
          />
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showColorDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-60">
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onColorChange(color);
                    setShowColorDropdown(false);
                  }}
                  className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                    currentColor === color ? 'border-blue-500' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="p-2 hover:bg-red-50 text-red-600 rounded transition-colors"
        title="Delete text annotation"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
};