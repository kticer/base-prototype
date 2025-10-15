import { useEffect, useRef, useState, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import { useStore } from '../../store';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Markdown from '../common/Markdown';
import { askGeminiStream } from '../../services/geminiClient';
import { parseActionsFromResponse, ensureActionButtons, type ChatAction } from '../../utils/chatActions';
import { ChatActionButton } from './ChatActionButton';

interface GlobalChatPanelProps {
  /** Context-specific data to send to AI */
  contextData?: any;
  /** Screen-specific prompt suggestions */
  promptSuggestions?: string[];
  /** Callback when chat requests navigation */
  onNavigate?: (target: string) => void;
  /** Callback when artifact is generated */
  onArtifactGenerated?: (artifact: any) => void;
}

export default function GlobalChatPanel({
  contextData,
  promptSuggestions = [],
  onNavigate,
  onArtifactGenerated,
}: GlobalChatPanelProps) {
  const {
    chat,
    closeChat,
    setChatPanelWidth,
    addChatMessage,
    clearChatHistory,
    setGeneratingArtifact,
    handleDraftCommentAction,
    handleAddCommentAction,
    handleHighlightTextAction,
    handleShowSourceAction,
  } = useStore();

  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');

  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  const currentScreen = chat.currentScreen;
  const messages = currentScreen ? chat.conversations[currentScreen].messages : [];
  const isOverlay = chat.displayMode === 'overlay';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 144; // ~9 lines
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [input, autoResize]);

  // Handle resize drag
  const handleResizeStart = (e: React.MouseEvent) => {
    if (isOverlay) return; // Only resize in shrink mode
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = chat.panelWidth;
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e: MouseEvent) => {
      const deltaX = resizeStartX.current - e.clientX;
      const newWidth = resizeStartWidth.current + deltaX;
      setChatPanelWidth(newWidth);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, setChatPanelWidth]);

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || busy || !currentScreen) return;

    setInput('');
    setBusy(true);
    setLastPrompt(prompt); // Store for fallback action button generation

    // Add user message
    addChatMessage({ role: 'user', content: prompt });

    // Detect if user is requesting a rubric/artifact
    const isRubricRequest = /\b(create|generate|make|build|design)\s+(a\s+)?(rubric|grading\s+criteria|assessment|evaluation)/i.test(prompt);

    try {
      // Create a placeholder for streaming response
      let streamingContent = '';
      const startTime = Date.now();

      // Enhance prompt if rubric requested but not explicitly structured
      const enhancedPrompt = isRubricRequest && !prompt.includes('```json')
        ? `${prompt}\n\nIMPORTANT: Please provide the rubric in the exact JSON format specified in the system instructions, wrapped in a \`\`\`json code fence.`
        : prompt;

      // Use Gemini streaming API
      const response = await askGeminiStream(enhancedPrompt, contextData, (chunk) => {
        streamingContent += chunk;
      });

      const fullText = response.text || streamingContent;

      // Add final response
      addChatMessage({
        role: 'assistant',
        content: fullText,
        engine: response.isReal ? 'gemini' : 'mock',
      });

      // Check for navigation commands
      const navMatch = fullText.match(/```json\s*\n.*?"command":\s*"navigate".*?"target":\s*"([^"]+)"/s);
      if (navMatch && onNavigate) {
        const target = navMatch[1];
        onNavigate(target);
        addChatMessage({
          role: 'system',
          content: `Navigated to ${target}`,
        });
      }

      // Enhanced artifact detection - try multiple approaches
      let artifact = null;

      // 1. Look for properly formatted JSON artifact
      const jsonMatch = fullText.match(/```json\s*\n([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.type === 'rubric' && parsed.criteria) {
            artifact = parsed;
            console.log('✅ Found structured rubric artifact');
          }
        } catch (e) {
          console.warn('Failed to parse JSON block:', e);
        }
      }

      // 2. If rubric was requested but no valid artifact found, try to extract structured data
      if (!artifact && isRubricRequest) {
        console.log('🔍 Attempting to extract rubric from unstructured response...');
        artifact = extractRubricFromText(fullText);
      }

      // Set artifact if found
      if (artifact) {
        setGeneratingArtifact(true, artifact);
        if (onArtifactGenerated) {
          onArtifactGenerated(artifact);
        }
        console.log('📝 Artifact generated:', artifact);
      } else if (isRubricRequest) {
        console.warn('⚠️ Rubric requested but could not extract artifact from response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
      });
    } finally {
      setBusy(false);
    }
  };

  // Handle action button clicks
  const handleChatAction = useCallback(async (action: ChatAction) => {
    console.log('🎯 Chat action triggered:', action);

    try {
      switch (action.type) {
        case 'draft_comment': {
          // Parse payload for matchCardId
          const matchCardId = action.payload;
          const draftedText = await handleDraftCommentAction({ matchCardId });

          // Send drafted comment back to chat for review
          addChatMessage({
            role: 'assistant',
            content: `Here's a draft comment:\n\n"${draftedText}"\n\n[ACTION:add_comment|Add this comment|${draftedText}]`,
          });
          break;
        }

        case 'add_comment': {
          // Payload contains the comment text
          const text = action.payload || action.label;
          handleAddCommentAction({ text });

          addChatMessage({
            role: 'system',
            content: '✅ Comment added to document.',
          });
          break;
        }

        case 'highlight_text': {
          // Payload contains matchCardId
          const matchCardId = action.payload;
          if (matchCardId) {
            handleHighlightTextAction({ matchCardId });
            addChatMessage({
              role: 'system',
              content: '✅ Navigated to highlighted text.',
            });
          }
          break;
        }

        case 'navigate': {
          if (action.payload && onNavigate) {
            onNavigate(action.payload);
            addChatMessage({
              role: 'system',
              content: `✅ Navigated to ${action.payload}.`,
            });
          }
          break;
        }

        case 'show_source': {
          const matchCardId = action.payload;
          if (matchCardId) {
            handleShowSourceAction({ matchCardId });
            addChatMessage({
              role: 'system',
              content: '✅ Showing source details.',
            });
          }
          break;
        }

        default:
          console.warn('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error('Error handling chat action:', error);
      addChatMessage({
        role: 'system',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [addChatMessage, onNavigate, handleDraftCommentAction, handleAddCommentAction, handleHighlightTextAction, handleShowSourceAction]);

  // Helper function to extract rubric from unstructured text
  function extractRubricFromText(text: string): any | null {
    try {
      console.log('📝 Attempting to extract rubric from text (length:', text.length, ')');

      // Look for criteria patterns in the text
      const lines = text.split('\n');
      const criteria: any[] = [];

      // Multiple pattern matching strategies
      const patterns = [
        // Pattern 1: "1. **Criterion**: description" or "1. Criterion: description"
        /^\s*\d+\.\s*\*?\*?([^*:\n]+)\*?\*?\s*:?\s*(.+)/,
        // Pattern 2: "* **Criterion**: description" or "- Criterion: description"
        /^\s*[-*•]\s*\*?\*?([^*:\n]+)\*?\*?\s*:?\s*(.+)/,
        // Pattern 3: "## Criterion" followed by description
        /^\s*#{1,3}\s+([^\n]+)/,
        // Pattern 4: Just bold text as criterion
        /^\s*\*\*([^*]+)\*\*\s*[-:]?\s*(.+)/,
      ];

      let currentCriterion: any = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let matched = false;

        // Try each pattern
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match) {
            const name = match[1].trim();
            const description = match[2]?.trim() || '';

            // Skip if it's likely a section header rather than criterion
            if (name.toLowerCase().includes('rubric') || name.toLowerCase().includes('criteria')) {
              continue;
            }

            // Extract points from name or description
            const pointsMatch = (name + ' ' + description).match(/(\d+)\s*(points?|pts?)/i);
            const points = pointsMatch ? parseInt(pointsMatch[1]) : 10;

            // Clean the description
            const cleanDesc = description
              .replace(/\(\d+\s*points?\)/i, '')
              .replace(/\d+\s*pts?/i, '')
              .replace(/^\s*[-:]\s*/, '')
              .trim();

            if (currentCriterion && !cleanDesc) {
              // This might be a continuation of the previous criterion
              continue;
            }

            currentCriterion = {
              name: name.replace(/\(\d+\s*points?\)/i, '').replace(/\d+\s*pts?/i, '').trim(),
              description: cleanDesc || name,
              points,
            };

            criteria.push(currentCriterion);
            matched = true;
            break;
          }
        }

        // If we have a current criterion and this line looks like a continuation
        if (!matched && currentCriterion && line.length > 10 && !line.match(/^\d+\.|^[-*•]/)) {
          currentCriterion.description += ' ' + line;
        }
      }

      console.log('🔍 Extracted criteria:', criteria.length);

      if (criteria.length >= 2) {
        // Successfully extracted criteria - create artifact
        const rubric = {
          type: 'rubric',
          title: 'Generated Rubric',
          layout: 'linear',
          criteria: criteria.map(c => ({
            ...c,
            description: c.description.slice(0, 200), // Limit description length
          })),
        };
        console.log('✅ Successfully created rubric artifact:', rubric);
        return rubric;
      }

      console.log('❌ Not enough criteria found (need at least 2, found', criteria.length, ')');

      // Debug: Show what we found
      if (criteria.length > 0) {
        console.log('Partial extraction:', criteria);
      }

      // Last resort: Look for any structure that resembles criteria
      const simpleMatch = text.match(/(?:^|\n)\s*(?:\d+\.|[-*])\s*([^\n]{10,100})/gm);
      if (simpleMatch && simpleMatch.length >= 3) {
        console.log('🔄 Trying simple pattern fallback, found', simpleMatch.length, 'items');
        const simpleCriteria = simpleMatch.slice(0, 10).map((item, idx) => ({
          name: `Criterion ${idx + 1}`,
          description: item.replace(/^\s*(?:\d+\.|[-*])\s*/, '').trim(),
          points: 10,
        }));
        return {
          type: 'rubric',
          title: 'Generated Rubric',
          layout: 'linear',
          criteria: simpleCriteria,
        };
      }

      return null;
    } catch (e) {
      console.error('❌ Failed to extract rubric from text:', e);
      return null;
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClearHistory = () => {
    if (!currentScreen) return;
    const ok = window.confirm(`Clear chat history for ${currentScreen}?`);
    if (ok) {
      clearChatHistory(currentScreen);
    }
  };

  const handlePromptSuggestionClick = async (suggestion: string) => {
    // Directly send the suggestion instead of populating the input field
    if (!suggestion.trim() || busy || !currentScreen) return;

    setBusy(true);
    setLastPrompt(suggestion); // Store for fallback action button generation

    // Add user message
    addChatMessage({ role: 'user', content: suggestion });

    const isRubricRequest = /\b(create|generate|make|build|design)\s+(a\s+)?(rubric|grading\s+criteria|assessment|evaluation)/i.test(suggestion);

    try {
      let streamingContent = '';

      const enhancedPrompt = isRubricRequest && !suggestion.includes('```json')
        ? `${suggestion}\n\nIMPORTANT: Please provide the rubric in the exact JSON format specified in the system instructions, wrapped in a \`\`\`json code fence.`
        : suggestion;

      const response = await askGeminiStream(enhancedPrompt, contextData, (chunk) => {
        streamingContent += chunk;
      });

      const fullText = response.text || streamingContent;

      addChatMessage({
        role: 'assistant',
        content: fullText,
        engine: response.isReal ? 'gemini' : 'mock',
      });

      // Handle navigation commands
      const navMatch = fullText.match(/```json\s*\n.*?"command":\s*"navigate".*?"target":\s*"([^"]+)"/s);
      if (navMatch && onNavigate) {
        const target = navMatch[1];
        onNavigate(target);
        addChatMessage({
          role: 'system',
          content: `Navigated to ${target}`,
        });
      }

      // Handle artifacts
      let artifact = null;
      const jsonMatch = fullText.match(/```json\s*\n([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.type === 'rubric' && parsed.criteria) {
            artifact = parsed;
          }
        } catch (e) {
          console.warn('Failed to parse JSON block:', e);
        }
      }

      if (!artifact && isRubricRequest) {
        artifact = extractRubricFromText(fullText);
      }

      if (artifact) {
        setGeneratingArtifact(true, artifact);
        if (onArtifactGenerated) {
          onArtifactGenerated(artifact);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
      });
    } finally {
      setBusy(false);
    }
  };

  if (!chat.isOpen || !currentScreen) return null;

  // Expand width when showing artifact
  const baseWidth = chat.panelWidth;
  const expandedWidth = chat.isGeneratingArtifact ? Math.min(baseWidth * 2, 900) : baseWidth;

  const panelStyle: React.CSSProperties = isOverlay
    ? {
        position: 'fixed',
        right: '1rem',
        top: '5rem',
        bottom: '1rem',
        width: `${expandedWidth}px`,
        zIndex: 1000,
      }
    : {
        width: `${expandedWidth}px`,
        flexShrink: 0,
      };

  return (
    <div
      ref={panelRef}
      className={`flex ${chat.isGeneratingArtifact ? 'flex-row' : 'flex-col'} bg-white border-l ${isOverlay ? 'shadow-2xl rounded-lg border' : ''} h-full`}
      style={panelStyle}
    >
      {/* Resize handle (only in shrink mode) */}
      {!isOverlay && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
          onMouseDown={handleResizeStart}
          style={{ marginLeft: '-2px' }}
        />
      )}

      {/* Chat Section */}
      <div className={`flex flex-col min-h-0 ${chat.isGeneratingArtifact ? 'w-1/2 border-r' : 'flex-1'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h3 className="font-semibold text-sm">AI Assistant</h3>
          <span className="text-xs text-gray-500">({currentScreen})</span>
        </div>
        <button
          onClick={closeChat}
          className="p-1 hover:bg-gray-200 rounded"
          title="Close chat"
        >
          <XMarkIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollerRef} className="flex-1 overflow-auto p-3 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-8">
            <p className="mb-4">👋 Hi! I'm your AI assistant.</p>
            <p>Ask me anything about {currentScreen === 'document-viewer' ? 'this document' : `the ${currentScreen} page`}.</p>
          </div>
        )}

        {messages.map((msg) => {
          // Parse actions from assistant messages
          let parsedContent = msg.role === 'assistant' ? parseActionsFromResponse(msg.content) : { text: msg.content, actions: [] };

          // Apply fallback action buttons if AI didn't include any
          if (msg.role === 'assistant' && parsedContent.actions.length === 0) {
            parsedContent = ensureActionButtons(parsedContent, {
              prompt: lastPrompt,
              similarityScore: contextData?.similarityScore,
              matchCards: contextData?.matchCards,
            });
          }

          return (
            <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  'max-w-[85%] rounded px-3 py-2 text-sm ' +
                  (msg.role === 'user'
                    ? 'bg-blue-600 text-white whitespace-pre-wrap'
                    : msg.role === 'system'
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs'
                    : 'bg-white border')
                }
              >
                {msg.role === 'assistant' && msg.engine === 'gemini' && (
                  <div className="text-[10px] text-gray-400 mb-1">Gemini</div>
                )}
                {msg.role === 'user' || msg.role === 'system' ? (
                  parsedContent.text
                ) : (
                  <Markdown text={parsedContent.text} />
                )}

                {/* Render action buttons if present */}
                {parsedContent.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parsedContent.actions.map((action, idx) => (
                      <ChatActionButton
                        key={idx}
                        action={action}
                        onAction={handleChatAction}
                        disabled={busy}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Prompt Suggestions - Always visible for quick actions */}
      {promptSuggestions.length > 0 && (
        <div className="px-3 py-2 border-t bg-gray-50">
          <div className="text-[10px] text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
            {messages.length === 0 ? 'Quick Actions' : 'Suggested Actions'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {promptSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptSuggestionClick(suggestion)}
                className="text-xs px-3 py-1.5 bg-white hover:bg-blue-50 hover:border-blue-300 rounded-full border border-gray-300 text-gray-700 transition-colors duration-150 shadow-sm hover:shadow"
                disabled={busy}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-2 bg-white flex flex-col gap-2">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            className="flex-1 border rounded px-3 py-2 text-sm resize-none overflow-auto max-h-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message... (Shift+Enter for newline)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
            rows={1}
          />
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            onClick={sendMessage}
            disabled={busy || !input.trim()}
          >
            Send
          </button>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
          <button
            className="text-xs text-gray-600 hover:text-gray-800 underline"
            onClick={handleClearHistory}
            disabled={busy || messages.length === 0}
          >
            Clear history
          </button>
        </div>
      </div>
      </div>
      {/* End of Chat Section */}

      {/* Artifact Preview Section */}
      {chat.isGeneratingArtifact && chat.currentArtifact && (
        <div className="w-1/2 flex flex-col bg-gray-50">
          <div className="flex items-center justify-between p-3 border-b bg-white">
            <h3 className="font-semibold text-sm">📝 Generated Artifact</h3>
            <button
              onClick={() => setGeneratingArtifact(false)}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <ArtifactPreview artifact={chat.currentArtifact} />
          </div>
          <div className="border-t p-3 bg-white flex gap-2">
            <button className="flex-1 px-3 py-2 border rounded text-sm hover:bg-gray-50">
              Edit
            </button>
            <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
              Save to Rubrics
            </button>
            <button className="px-3 py-2 border rounded text-sm hover:bg-gray-50">
              Export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Artifact Preview Component
function ArtifactPreview({ artifact }: { artifact: any }) {
  if (!artifact || artifact.type !== 'rubric') {
    return <div className="text-sm text-gray-500">Unknown artifact type</div>;
  }

  const { title, layout, criteria } = artifact;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div>
        <h4 className="font-bold text-lg">{title || 'Rubric'}</h4>
        <div className="text-xs text-gray-500 mt-1">
          Layout: {layout === 'grid' ? 'Grid with Levels' : 'Linear'}
        </div>
      </div>

      {layout === 'grid' ? (
        <div className="space-y-4">
          {criteria?.map((criterion: any, idx: number) => (
            <div key={idx} className="border rounded p-3">
              <div className="font-semibold text-sm mb-1">{criterion.name}</div>
              <div className="text-xs text-gray-600 mb-2">{criterion.description}</div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {criterion.levels?.map((level: any, levelIdx: number) => (
                  <div key={levelIdx} className="border rounded p-2 bg-gray-50">
                    <div className="font-medium">{level.name}</div>
                    <div className="text-blue-600 font-bold">{level.points} pts</div>
                    <div className="text-gray-500 mt-1">{level.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {criteria?.map((criterion: any, idx: number) => (
            <div key={idx} className="border rounded p-3 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-sm">{criterion.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{criterion.description}</div>
                </div>
                <div className="text-blue-600 font-bold text-sm">
                  {criterion.points} pts
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-right text-sm font-semibold text-gray-700">
        Total: {criteria?.reduce((sum: number, c: any) => sum + (c.points || 0), 0)} points
      </div>
    </div>
  );
}
