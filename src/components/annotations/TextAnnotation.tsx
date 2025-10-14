import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import type { PointAnnotation } from '../../types';
import { TextControls } from './TextControls';

interface TextAnnotationProps {
  annotation: PointAnnotation;
  containerRef: React.RefObject<HTMLDivElement>;
}

const getSizePixels = (size: 'small' | 'medium' | 'large'): number => {
  switch (size) {
    case 'small': return 12;
    case 'medium': return 14;
    case 'large': return 16;
    default: return 14;
  }
};

export const TextAnnotation: React.FC<TextAnnotationProps> = ({
  annotation,
  containerRef
}) => {
  const {
    annotationState,
    updatePointAnnotation,
    deletePointAnnotation,
    setEditingTextAnnotation,
    clearAnnotationState
  } = useStore();
  
  const [localContent, setLocalContent] = useState(annotation.content);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isEditing = annotationState.editingTextAnnotation === annotation.id;
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (!containerRef.current) return null;

  const container = containerRef.current;
  const left = (annotation.position.x / 100) * container.offsetWidth;
  const top = (annotation.position.y / 100) * container.offsetHeight;

  const textSize = annotation.textSize || 'medium';
  const textColor = annotation.textColor || '#000000';
  const fontSize = getSizePixels(textSize);

  const handleSave = () => {
    if (localContent.trim()) {
      updatePointAnnotation(annotation.id, { 
        content: localContent.trim() 
      });
    } else {
      deletePointAnnotation(annotation.id);
    }
    setEditingTextAnnotation(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setLocalContent(annotation.content);
      setEditingTextAnnotation(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      setEditingTextAnnotation(annotation.id);
    }
  };

  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    updatePointAnnotation(annotation.id, { textSize: size });
  };

  const handleColorChange = (color: string) => {
    updatePointAnnotation(annotation.id, { textColor: color });
  };

  const handleDelete = () => {
    deletePointAnnotation(annotation.id);
    clearAnnotationState();
  };

  // Calculate control position
  const controlPosition = {
    x: left + container.getBoundingClientRect().left,
    y: top + container.getBoundingClientRect().top
  };

  return (
    <>
      <div
        data-annotation="text"
        className="absolute z-30 cursor-pointer select-none"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          transform: 'translate(-50%, -50%)',
          fontSize: `${fontSize}px`,
          color: textColor,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 500,
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          minWidth: isEditing ? '120px' : 'auto',
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="bg-white border border-blue-300 rounded px-2 py-1 text-center min-w-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              fontSize: `${fontSize}px`,
              color: textColor,
            }}
            placeholder="Enter text..."
          />
        ) : (
          <span
            className={`inline-block px-2 py-1 rounded transition-all duration-200 ${
              isHovered ? 'bg-blue-50 border border-blue-200' : 'bg-transparent'
            }`}
          >
            {annotation.content || 'Click to edit'}
          </span>
        )}
      </div>

      {/* Show text controls when editing */}
      {isEditing && (
        <TextControls
          position={controlPosition}
          currentSize={textSize}
          currentColor={textColor}
          onSizeChange={handleSizeChange}
          onColorChange={handleColorChange}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};
