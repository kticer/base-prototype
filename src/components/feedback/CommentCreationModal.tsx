import { useState, useRef, useEffect } from "react";
import { useFeatureFlag } from "../../hooks/useFeatureFlag";
import { useStore } from "../../store";
import type { ReusableComment } from "../../types/reusableComments";

interface CommentCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateComment: (type: "Grading" | "Comment", content: string) => void;
  initialType?: "Grading" | "Comment";
}

export function CommentCreationModal({
  isOpen,
  onClose,
  onCreateComment,
  initialType = "Comment"
}: CommentCreationModalProps) {
  const [selectedType, setSelectedType] = useState<"Grading" | "Comment">(initialType);
  const [content, setContent] = useState("");
  const [convertToQuickMark, setConvertToQuickMark] = useState(false);
  const [quickMarkTitle, setQuickMarkTitle] = useState("");
  
  // Reusable Comments Feature
  const isReusableCommentsEnabled = useFeatureFlag('reusableComments');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ReusableComment[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { findSimilarComments, useReusableComment, createReusableCommentFromText } = useStore();

  // Handle content changes and reusable comment suggestions
  useEffect(() => {
    if (!isReusableCommentsEnabled || !content.trim()) {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      const similarComments = findSimilarComments(content.trim(), 5);
      setSuggestions(similarComments);
      setShowSuggestions(similarComments.length > 0);
      setSelectedSuggestionIndex(-1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [content, isReusableCommentsEnabled, findSimilarComments]);

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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, selectedSuggestionIndex]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (content.trim()) {
      // If reusable comments is enabled, add this comment to the bank
      if (isReusableCommentsEnabled) {
        createReusableCommentFromText(content.trim(), selectedType);
      }
      
      onCreateComment(selectedType, content.trim());
      setContent("");
      setConvertToQuickMark(false);
      setQuickMarkTitle("");
      setShowSuggestions(false);
      setSuggestions([]);
      onClose();
    }
  };

  const handleSelectSuggestion = (suggestion: ReusableComment) => {
    setContent(suggestion.content);
    useReusableComment(suggestion.id);
    setShowSuggestions(false);
    setSuggestions([]);
    textareaRef.current?.focus();
  };

  const handleCancel = () => {
    setContent("");
    setConvertToQuickMark(false);
    setQuickMarkTitle("");
    setShowSuggestions(false);
    setSuggestions([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Comment Creation</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Comment Type Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setSelectedType("Comment")}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                selectedType === "Comment"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Comment
            </button>
            <button
              onClick={() => setSelectedType("Grading")}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                selectedType === "Grading"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Grading
            </button>
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-4">
            <div className="relative">
              <div className="border border-gray-300 rounded-md">
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
                  <button className="p-2 hover:bg-gray-200 rounded text-sm font-bold" title="Bold">
                    B
                  </button>
                  <button className="p-2 hover:bg-gray-200 rounded text-sm italic" title="Italic">
                    I
                  </button>
                  <button className="p-2 hover:bg-gray-200 rounded text-sm underline" title="Underline">
                    U
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  <button className="p-2 hover:bg-gray-200 rounded" title="Bullet List">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                  <button className="p-2 hover:bg-gray-200 rounded" title="Link">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>
                  {isReusableCommentsEnabled && content.trim() && (
                    <>
                      <div className="w-px h-4 bg-gray-300 mx-1"></div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {suggestions.length > 0 ? `${suggestions.length} suggestions` : 'Type to see suggestions'}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Text area */}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={isReusableCommentsEnabled ? "Add a comment (suggestions will appear as you type)" : "Add a comment"}
                  className="w-full p-4 text-sm resize-none focus:outline-none min-h-[120px]"
                  autoFocus
                />
              </div>

              {/* Reusable Comments Suggestions */}
              {isReusableCommentsEnabled && showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                >
                  <div className="p-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                    💬 Reusable Comments ({suggestions.length}) - Use ↑↓ to navigate, Enter to select
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
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

            {/* Link to Rubric button */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Link to Rubric
              </button>
              <div className="h-4 w-px bg-gray-300"></div>
            </div>

            {/* Convert to QuickMark */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="modal-quickmark-convert"
                  checked={convertToQuickMark}
                  onChange={(e) => setConvertToQuickMark(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="modal-quickmark-convert" className="text-sm text-gray-700">
                  Convert to QuickMark
                </label>
              </div>

              {convertToQuickMark && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      QuickMark title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={quickMarkTitle}
                      onChange={(e) => setQuickMarkTitle(e.target.value)}
                      placeholder="Enter QuickMark title"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={50}
                    />
                    <div className="text-xs text-gray-500 text-right mt-1">
                      Remaining characters: {50 - quickMarkTitle.length}/50
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      QuickMark set <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Default QM set</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="p-2 text-red-500 hover:bg-red-50 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!content.trim()}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}