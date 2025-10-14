
import { useState, useRef, useEffect, useMemo } from "react";
import { useStore } from "../../store";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import type { ReusableComment } from "../../types/reusableComments";
import { faker } from '@faker-js/faker';

interface CommentCardProps {
  type: "Grading" | "Comment" | string;
  content: string;
  position?: number;
  onSelect?: () => void;
  isActive?: boolean;
  onContentChange?: (content: string) => void;
  onDelete?: () => void;
  createdAt?: string;
  isUserCreated?: boolean;
  commentId?: string;
}

export function CommentCard({
  type,
  content,
  position: _position,
  onSelect,
  isActive = false,
  onContentChange,
  onDelete,
  createdAt,
  isUserCreated = true,
  commentId,
}: CommentCardProps) {
  void _position; // Acknowledged unused parameter
  const comments = useStore((state) => state.comments);
  const [isEditing, setIsEditing] = useState(content === "Click to add your comment...");
  const [editContent, setEditContent] = useState(content === "Click to add your comment..." ? "" : content);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isContentHovered, setIsContentHovered] = useState(false);
  const [convertToQuickMark, setConvertToQuickMark] = useState(false);
  
  // Reusable Comments Feature
  const isReusableCommentsEnabled = useFeatureFlag('reusableComments');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ReusableComment[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const isSettingFromSuggestionRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { findSimilarComments, useReusableComment, createReusableCommentFromText } = useStore();

  // Handle content changes and reusable comment suggestions
  useEffect(() => {
    // Skip search if content was set from a suggestion
    if (isSettingFromSuggestionRef.current) {
      isSettingFromSuggestionRef.current = false;
      return;
    }

    if (!isReusableCommentsEnabled || !isEditing || !editContent.trim()) {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      const similarComments = findSimilarComments(editContent.trim(), 5);
      setSuggestions(similarComments);
      setShowSuggestions(similarComments.length > 0);
      setSelectedSuggestionIndex(-1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [editContent, isReusableCommentsEnabled, isEditing, findSimilarComments]);

  // Handle keyboard navigation for suggestions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          if (selectedSuggestionIndex >= 0) {
            e.preventDefault();
            handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          break;
      }
    };

    if (isEditing) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSuggestions, suggestions, selectedSuggestionIndex, isEditing]);

  const handleSelectSuggestion = (suggestion: ReusableComment) => {
    // Flag that we're setting content from a suggestion (before setting content)
    isSettingFromSuggestionRef.current = true;
    
    // Immediately hide suggestions to prevent re-search
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Set content and mark as used
    setEditContent(suggestion.content);
    useReusableComment(suggestion.id);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  // Scroll selected suggestion into view during keyboard navigation
  useEffect(() => {
    if (selectedSuggestionIndex >= 0 && suggestionsRef.current) {
      const suggestionElements = suggestionsRef.current.querySelectorAll('[data-suggestion-index]');
      const selectedElement = suggestionElements[selectedSuggestionIndex] as HTMLElement;
      
      if (selectedElement) {
        const container = suggestionsRef.current;
        const containerHeight = container.clientHeight;
        const elementTop = selectedElement.offsetTop;
        const elementHeight = selectedElement.offsetHeight;
        const scrollTop = container.scrollTop;
        
        // Check if element is above visible area
        if (elementTop < scrollTop) {
          container.scrollTop = elementTop;
        }
        // Check if element is below visible area
        else if (elementTop + elementHeight > scrollTop + containerHeight) {
          container.scrollTop = elementTop + elementHeight - containerHeight;
        }
      }
    }
  }, [selectedSuggestionIndex]);

  // Close overflow menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showOverflowMenu) {
        setShowOverflowMenu(false);
      }
    };

    if (showOverflowMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showOverflowMenu]);

  // Determine if this is a main comment type (Grading or Comment)
  const isMainCommentType = type === "Grading" || type === "Comment";

  // Generate session-wide user name (stored in sessionStorage)
  const sessionUserName = useMemo(() => {
    let storedName = sessionStorage.getItem('sessionUserName');
    if (!storedName) {
      faker.seed(Date.now()); // Use current time as seed for session
      storedName = faker.person.fullName();
      sessionStorage.setItem('sessionUserName', storedName);
    }
    return storedName;
  }, []);

  // Generate consistent fake name for this comment
  const commenterName = useMemo(() => {
    // For demo purposes, show fake names for some comments and session user name for recent ones
    const commentAge = createdAt ? Date.now() - new Date(createdAt).getTime() : 0;
    const isRecentComment = commentAge < 60000; // Less than 1 minute old = session user
    
    if (isUserCreated && isRecentComment) {
      return sessionUserName; // Session user for recent comments
    }
    
    // Use content as seed for consistent name generation
    faker.seed(content.length + content.charCodeAt(0));
    return faker.person.fullName();
  }, [content, isUserCreated, createdAt, sessionUserName]);

  // Format timestamp
  const formattedTimestamp = useMemo(() => {
    if (!createdAt) {
      return new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    return new Date(createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }, [createdAt]);

  return (
    <div
      data-comment-id={commentId}
      className={`rounded-lg shadow-sm border cursor-pointer transition-all duration-200 bg-white relative ${
        isActive ? "border-blue-500 shadow-md" : "border-gray-200"
      } ${
        isHovered ? "shadow-md" : "hover:shadow-md"
      }`}
      style={{
        width: (isHovered || isActive) ? '336px' : '320px', // 320px (w-80) + 16px when hovered or active
        marginLeft: (isHovered || isActive) ? '-16px' : '0',
        zIndex: (isHovered || isActive) ? 20 : 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsContentHovered(false);
      }}
      onClick={onSelect}
    >
      {/* Top row with blue badge and overflow menu - hidden in edit mode */}
      {!isEditing && (
        <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Comment badge styled like Badge component */}
          <div className="flex items-center gap-1 text-xs font-medium text-white rounded-full px-2 py-0.5 transition-all duration-200 hover:scale-105 bg-blue-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          {/* Additional badges can be added here in the future */}
        </div>
        
        {/* Overflow menu */}
        <div className="relative">
          <button 
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowOverflowMenu(!showOverflowMenu);
            }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
          
          {/* Overflow menu dropdown */}
          {showOverflowMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOverflowMenu(false);
                    setIsEditing(true);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOverflowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Pin
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOverflowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Link to rubric
                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOverflowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Convert to QuickMark
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOverflowMenu(false);
                    onDelete?.();
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Content area */}
      <div className="px-4 pb-3">
        {isEditing ? (
          <div className="space-y-3 pt-3">
            {/* Edit-specific row with highlight icon, Link to Rubric button, and pin icon */}
            <div className="flex items-center justify-between px-4 py-3 -mx-4 -mt-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {/* Highlight icon */}
                <div className="p-1.5 bg-blue-600 text-white rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                
                {/* Link to Rubric button */}
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Link to Rubric
                </button>
              </div>
              
              {/* Pin icon - bookmark */}
              <button className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>

            {/* Rich text editor mockup */}
            <div className="border-2 border-blue-500 rounded-md">
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
                <button className="p-1 hover:bg-gray-200 rounded text-sm font-bold">B</button>
                <button className="p-1 hover:bg-gray-200 rounded text-sm italic">I</button>
                <button className="p-1 hover:bg-gray-200 rounded text-sm underline">U</button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button className="p-1 hover:bg-gray-200 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button className="p-1 hover:bg-gray-200 rounded text-sm">⋯</button>
              </div>
              
              {/* Text area with rich text editor styling */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 text-sm resize-none focus:outline-none min-h-[80px] border-0"
                  autoFocus
                />
                
                {/* Word count */}
                <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                  {editContent.trim().split(/\s+/).filter(word => word.length > 0).length} words
                </div>
                
                {/* Reusable Comments Suggestions */}
                {isReusableCommentsEnabled && showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                  style={{ minWidth: '300px' }}
                >
                  <div className="p-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200 sticky top-0">
                    💬 Reusable Comments ({suggestions.length}) - Use ↑↓ to navigate, Enter to select
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      data-suggestion-index={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index === selectedSuggestionIndex ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="text-sm text-gray-900 mb-1">{suggestion.content}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          suggestion.type === 'Grading' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {suggestion.type}
                        </span>
                        {suggestion.usageCount > 0 && (
                          <span>Used {suggestion.usageCount} time{suggestion.usageCount !== 1 ? 's' : ''}</span>
                        )}
                        <span>{suggestion.tags.slice(0, 2).join(', ')}</span>
                        {suggestion.source === 'system' && (
                          <span className="text-green-600">★ System</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                )}
              </div>
            </div>

            {/* Convert to QuickMark checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="convertToQuickMark"
                checked={convertToQuickMark}
                onChange={(e) => setConvertToQuickMark(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="convertToQuickMark" className="ml-2 text-sm text-gray-700">
                Convert to QuickMark
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={onDelete}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (content === "Click to add your comment...") {
                      onDelete?.();
                    } else {
                      setEditContent(content);
                      setIsEditing(false);
                      setShowSuggestions(false);
                      setSuggestions([]);
                    }
                  }}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editContent.trim()) {
                      // If reusable comments is enabled, add this comment to the bank
                      if (isReusableCommentsEnabled) {
                        console.log(`💾 CommentCard: Creating reusable comment "${editContent.trim()}" of type "${type}"`);
                        createReusableCommentFromText(editContent.trim(), type);
                      }
                      
                      onContentChange?.(editContent.trim());
                      setIsEditing(false);
                      setShowSuggestions(false);
                      setSuggestions([]);
                    } else {
                      onDelete?.();
                    }
                  }}
                  className="px-4 py-2 text-sm text-white bg-teal-600 rounded-md hover:bg-teal-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div 
              className={`text-sm leading-relaxed text-gray-900 p-2 -m-2 rounded transition-colors cursor-pointer ${
                isContentHovered ? 'bg-gray-100' : ''
              }`}
              onMouseEnter={() => setIsContentHovered(true)}
              onMouseLeave={() => setIsContentHovered(false)}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              {content}
            </div>
            
            {/* Commenter info - only show when active/selected */}
            {isActive && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-900">{commenterName}</div>
                <div className="text-xs text-gray-500">{formattedTimestamp}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}