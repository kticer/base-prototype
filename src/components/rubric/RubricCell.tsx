import { useState, useEffect, useRef } from "react";
import { useStore } from "../../store";

interface RubricCellProps {
  content: string;
  isSelected: boolean;
  onClick: () => void;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}

export function RubricCell({
  content,
  isSelected,
  onClick,
  onChange,
  placeholder = "Click to edit...",
  className = "",
  multiline = false,
}: RubricCellProps) {
  const { isEditingCell, editingCellContent, startEditingCell, stopEditingCell, updateEditingCellContent } = useStore();
  const [localContent, setLocalContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = isSelected && isEditingCell;

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  useEffect(() => {
    if (isEditing) {
      const ref = multiline ? textareaRef.current : inputRef.current;
      if (ref) {
        ref.focus();
        ref.setSelectionRange(0, ref.value.length);
        
        // Auto-resize textarea
        if (multiline && textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      }
    }
  }, [isEditing, multiline]);

  // Auto-resize textarea on content change
  useEffect(() => {
    if (isEditing && multiline && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editingCellContent, isEditing, multiline]);

  const handleClick = () => {
    onClick();
    if (!isEditing) {
      startEditingCell(content);
    }
  };

  const handleDoubleClick = () => {
    if (!isEditing) {
      onClick();
      startEditingCell(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Enter' && multiline && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleSave();
        // TODO: Move to next cell
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalContent(value);
    updateEditingCellContent(value);
  };

  const handleBlur = () => {
    if (isEditing) {
      handleSave();
    }
  };

  const handleSave = () => {
    onChange(editingCellContent);
    stopEditingCell();
  };

  const handleCancel = () => {
    setLocalContent(content);
    stopEditingCell();
  };

  const displayContent = isEditing ? editingCellContent : localContent;

  if (isEditing) {
    return multiline ? (
      <textarea
        ref={textareaRef}
        value={displayContent}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`w-full resize-none border-none outline-none bg-white p-0 min-h-12 ${className}`}
        placeholder={placeholder}
        style={{ minHeight: '3rem' }}
      />
    ) : (
      <input
        ref={inputRef}
        type="text"
        value={displayContent}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`w-full h-full border-none outline-none bg-white p-0 ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`w-full h-full cursor-text transition-colors ${
        isSelected 
          ? 'bg-teal-50 ring-2 ring-teal-500 ring-inset' 
          : 'hover:bg-gray-50'
      } ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={`w-full ${multiline ? 'min-h-full' : 'h-full'} flex items-start py-1`}>
        {displayContent ? (
          <div className="whitespace-pre-wrap">{displayContent}</div>
        ) : (
          <span className="text-gray-400 italic">{placeholder}</span>
        )}
      </div>
    </div>
  );
}