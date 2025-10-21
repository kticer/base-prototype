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
  /** Screen-specific prompt suggestions (can be strings or objects with context) */
  promptSuggestions?: (string | { label: string; contextEnhancement: string })[];
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
    handleAddSummaryCommentAction,
    handleHighlightTextAction,
    handleShowSourceAction,
  } = useStore();

  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [isClosingArtifact, setIsClosingArtifact] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<Record<number, 'thumbsup' | 'thumbsdown'>>({});
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [showContextHelp, setShowContextHelp] = useState(false);
  const [showFollowUps, setShowFollowUps] = useState<Record<number, boolean>>({});
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  const currentScreen = chat.currentScreen;
  const messages = currentScreen ? chat.conversations[currentScreen].messages : [];
  const isDocumentViewer = currentScreen === 'document-viewer';
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

  const sendMessage = async (overridePrompt?: string) => {
    const raw = overridePrompt ?? input;
    const prompt = (raw || '').trim();
    if (!prompt || busy || !currentScreen) return;

    if (!overridePrompt) setInput('');
    setBusy(true);
    setLastPrompt(prompt); // Store for fallback action button generation

    // Add user message
    addChatMessage({ role: 'user', content: prompt });

    // Classify desired artifact type (only if clearly requested)
    const classifyDesiredArtifact = (text: string, screen: string | null): 'rubric' | 'feedback-plan' | 'report' | 'table' | null => {
      const t = text.toLowerCase();
      const actionVerb = /(create|generate|make|build|design|draft|write|produce)/.test(t);
      // Rubric only when explicitly asked
      if (actionVerb && /\brubric(s)?\b|grading criteria|assessment rubric/.test(t)) return 'rubric';
      // Feedback plan intents
      if (actionVerb && /(feedback plan|meeting plan|conference plan|talking points|intervention plan|action plan)/.test(t)) return 'feedback-plan';
      // Report intents only when explicitly asked to create a report
      if (actionVerb && /\breport\b/.test(t)) return 'report';
      // Table intents, especially on inbox/insights
      if ((/\btable\b|\btabular\b/.test(t) || (/show|list|rank|prioritize|which|top\s+\d+/).test(t)) && (screen === 'inbox' || screen === 'insights')) return 'table';
      return null;
    };

    const desiredType = classifyDesiredArtifact(prompt, currentScreen);
    // Back-compat rubric detection used elsewhere
    const hasActionVerb = /\b(create|generate|make|build|design|draft|write)\b/i.test(prompt);
    const hasRubricKeyword = /\brubric\b/i.test(prompt);
    const isRubricRequest = hasActionVerb && hasRubricKeyword;

    try {
      // Create a placeholder for streaming response
      let streamingContent = '';
      const startTime = Date.now();

      // Enhance prompt if rubric requested but not explicitly structured
      let enhancedPrompt = prompt;
      if (desiredType === 'rubric' && !prompt.includes('```json')) {
        enhancedPrompt += `\n\nIMPORTANT: Only because I asked for a rubric, provide it in the exact JSON format specified in the system instructions, wrapped in a \`\`\`json code fence.`;
      } else if (desiredType && desiredType !== 'rubric' && !prompt.includes('```json')) {
        enhancedPrompt += `\n\nIf you produce a structured artifact, use a \`\`\`json code block with type:"${desiredType}". Otherwise reply with well-formatted Markdown (headings and bullets). Do NOT generate a rubric.`;
      } else if (!desiredType) {
        enhancedPrompt += `\n\nUnless explicitly asked for a structure, respond with clear, well-formatted Markdown. Do NOT generate a rubric unless I explicitly ask for a rubric.`;
      }

      // Include conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10);

      // Use Gemini streaming API
      const response = await askGeminiStream(enhancedPrompt, {
        ...contextData,
        conversationHistory,
      }, (chunk) => {
        streamingContent += chunk;
      });

      const fullText = response.text || streamingContent;

      // Artifact detection - only look for properly formatted JSON
      let artifact = null;

      // Only look for JSON code blocks (don't try to extract from unstructured text)
      const jsonMatch = fullText.match(/```json\s*\n([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          const parsedType = parsed && typeof parsed.type === 'string' ? String(parsed.type) : '';
          // Accept only appropriate artifact types
          if (parsedType === 'rubric') {
            // Only allow rubric artifacts when explicitly requested
            if (isRubricRequest || desiredType === 'rubric') {
              if (parsed.criteria) {
                artifact = parsed;
                console.log('✅ Accepted rubric artifact (explicitly requested)');
              }
            } else {
              console.log('🚫 Ignoring rubric artifact (not requested)');
            }
          } else if (parsedType === 'report' || parsedType === 'table' || parsedType === 'feedback-plan') {
            // Allow other artifact types when provided; if desiredType specified, require match
            if (!desiredType || desiredType === parsedType) {
              artifact = parsed;
              console.log('✅ Accepted artifact:', parsedType);
            } else {
              console.log('🚫 Ignoring artifact mismatch. Wanted:', desiredType, 'Got:', parsedType);
            }
          } else if (parsed.type) {
            // Accept any structured artifact with a type field if it's not rubric and not conflicting
            if (parsedType !== 'rubric' && (!desiredType || desiredType === parsedType)) {
              artifact = parsed;
              console.log('✅ Accepted generic artifact:', parsedType);
            }
          }

          // Set artifact if found
          if (artifact) {
            setGeneratingArtifact(true, artifact);
            if (onArtifactGenerated) {
              onArtifactGenerated(artifact);
            }
            console.log('📝 Artifact generated:', artifact);
          }
        } catch (e) {
          console.warn('Failed to parse JSON block:', e);
        }
      }

      // Add final response with artifact reference
      addChatMessage({
        role: 'assistant',
        content: fullText,
        engine: response.isReal ? 'gemini' : 'mock',
        artifact: artifact, // Attach artifact to message
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

      // If rubric was explicitly requested but not found, log a warning
      if (!artifact && (isRubricRequest || desiredType === 'rubric')) {
        console.warn('⚠️ Rubric requested but AI did not provide properly formatted JSON');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      addChatMessage({
        role: 'system',
        content: isNetworkError
          ? '❌ **Connection Error**\n\nCould not connect to AI service. Please check your internet connection and try again.\n\n[ACTION:retry|Retry|' + prompt + ']'
          : '❌ **Error Processing Request**\n\nSomething went wrong. This might help:\n• Try rephrasing your question\n• Check if the document is loaded\n• Refresh the page if issues persist\n\n[ACTION:retry|Try Again|' + prompt + ']',
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

          // Always try to use AI for more contextual drafting
          const useAI = !busy && (contextData?.matchCards || contextData?.doc);

          if (useAI) {
            // Use AI to draft a more sophisticated comment
            setBusy(true);
            addChatMessage({
              role: 'system',
              content: '✍️ Drafting comment with AI assistance...',
            });

            try {
              // Build context for AI comment drafting
              let aiPrompt = '';

              if (matchCardId && contextData?.matchCards) {
                const matchCard = contextData.matchCards.find((mc: any) => mc.id === matchCardId);
                if (matchCard) {
                  aiPrompt = `Draft a professional, constructive comment for a student about this similarity match:\n\n` +
                    `Document: "${contextData.doc?.title || 'Untitled'}"\n` +
                    `Source: ${matchCard.sourceName}\n` +
                    `Similarity: ${matchCard.similarityPercent}%\n` +
                    `Citation status: ${matchCard.isCited ? 'Cited' : 'Not cited'}\n` +
                    `Academic integrity issue: ${matchCard.academicIntegrityIssue ? 'Yes' : 'No'}\n\n` +
                    `Requirements:\n` +
                    `- Keep it brief (2-3 sentences maximum)\n` +
                    `- Be specific about the issue\n` +
                    `- Be constructive and educational\n` +
                    `- Suggest a concrete next step for the student\n` +
                    `- Use a supportive but professional tone\n\n` +
                    `Respond with ONLY the comment text, no quotes, no additional explanation.`;
                }
              } else {
                // Generic comment request without specific match card
                aiPrompt = `Draft a brief (2-3 sentences), professional feedback comment for a student paper.\n` +
                  `Document: "${contextData?.doc?.title || 'Untitled'}"\n` +
                  `Focus on being constructive, specific, and actionable.\n\n` +
                  `Respond with ONLY the comment text, no quotes, no additional explanation.`;
              }

              let streamingContent = '';
              const response = await askGeminiStream(aiPrompt, contextData, (chunk) => {
                streamingContent += chunk;
              });

              const draftedText = (response.text || streamingContent).trim();

              // Remove any surrounding quotes that AI might have added
              const cleanedText = draftedText.replace(/^["']|["']$/g, '');

              addChatMessage({
                role: 'assistant',
                content: `Here's a draft comment:\n\n"${cleanedText}"\n\n[ACTION:add_comment|Add this comment|${cleanedText}]`,
                engine: response.isReal ? 'gemini' : 'mock',
              });
            } catch (error) {
              console.error('AI draft comment failed:', error);
              // Fallback to deterministic draft
              const draftedText = await handleDraftCommentAction({ matchCardId });
              addChatMessage({
                role: 'assistant',
                content: `Here's a draft comment:\n\n"${draftedText}"\n\n[ACTION:add_comment|Add this comment|${draftedText}]`,
              });
            } finally {
              setBusy(false);
            }
          } else {
            // Use deterministic drafting when AI is unavailable
            const draftedText = await handleDraftCommentAction({ matchCardId });
            addChatMessage({
              role: 'assistant',
              content: `Here's a draft comment:\n\n"${draftedText}"\n\n[ACTION:add_comment|Add this comment|${draftedText}]`,
            });
          }
          break;
        }

        case 'add_comment': {
          // Payload can be a string or object with {text, highlightId, page}
          let text: string;
          let highlightId: string | undefined;
          let page: number | undefined;

          if (typeof action.payload === 'object' && action.payload !== null) {
            text = action.payload.text || action.label;
            highlightId = action.payload.highlightId;
            page = action.payload.page;
          } else {
            text = action.payload || action.label;
          }

          // Remove any [ACTION:...] syntax from the comment text
          text = text.replace(/\[ACTION:[^\]]+\]/g, '').trim();
          handleAddCommentAction({ text, highlightId, page });

          addChatMessage({
            role: 'system',
            content: '✓ Comment added',
          });
          break;
        }

        case 'add_summary_comment': {
          // Payload contains the summary comment text - strip any ACTION syntax
          let text = action.payload || action.label;
          // Remove any [ACTION:...] syntax from the comment text
          text = text.replace(/\[ACTION:[^\]]+\]/g, '').trim();
          handleAddSummaryCommentAction({ text });

          addChatMessage({
            role: 'system',
            content: '✓ Summary added',
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
              content: '✓ Navigated',
            });
          }
          break;
        }

        case 'navigate': {
          if (action.payload && onNavigate) {
            onNavigate(action.payload);
            addChatMessage({
              role: 'system',
              content: `✓ Switched to ${action.payload}`,
            });
          }
          break;
        }

        case 'show_source': {
          const matchCardId = action.payload;
          if (matchCardId) {
            handleShowSourceAction({ matchCardId });
            // No confirmation message needed for show_source
          }
          break;
        }

        case 'next_issue':
        case 'prev_issue': {
          // Navigate to next/previous academic integrity issue
          const direction = action.type === 'next_issue' ? 1 : -1;
          const issues = contextData?.matchCards
            ?.filter((mc: any) => mc.academicIntegrityIssue)
            .sort((a: any, b: any) => b.similarityPercent - a.similarityPercent) || [];

          if (issues.length === 0) {
            addChatMessage({
              role: 'system',
              content: '✓ No issues found',
            });
            break;
          }

          // Find current issue index
          const currentId = contextData?.matchCards?.find((mc: any) =>
            mc.id === useStore.getState().navigation.selectedSourceId
          )?.id;
          const currentIndex = currentId ? issues.findIndex((i: any) => i.id === currentId) : -1;
          const nextIndex = currentIndex + direction;

          if (nextIndex < 0 || nextIndex >= issues.length) {
            addChatMessage({
              role: 'system',
              content: `✓ ${direction > 0 ? 'Last issue' : 'First issue'}`,
            });
            break;
          }

          const nextIssue = issues[nextIndex];
          handleHighlightTextAction({ matchCardId: nextIssue.id });
          addChatMessage({
            role: 'system',
            content: `📍 Issue ${nextIndex + 1} of ${issues.length}: ${nextIssue.similarityPercent}% match to **${nextIssue.sourceName}**\n\n[ACTION:draft_comment|Draft a comment|${nextIssue.id}]`,
          });
          break;
        }

        case 'retry': {
          // Retry with the original prompt
          const originalPrompt = action.payload;
          if (originalPrompt) {
            setInput(originalPrompt);
            // Auto-send after a brief delay
            setTimeout(() => {
              sendMessage();
            }, 100);
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
        content: `❌ **Action Error**\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or rephrase your request.`,
      });
    }
  }, [addChatMessage, onNavigate, handleDraftCommentAction, handleAddCommentAction, handleAddSummaryCommentAction, handleHighlightTextAction, handleShowSourceAction, contextData, busy, setBusy]);

  // Helper function to extract rubric from unstructured text
  // DEPRECATED: No longer used - we now require explicit JSON formatting
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // Cmd/Ctrl + Enter to send
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
      return;
    }
    // Enter (without Shift) to send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      // Cmd/Ctrl + K to toggle chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (chat.isOpen) {
          closeChat();
        } else {
          useStore.getState().openChat();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [chat.isOpen, closeChat]);

  const handleClearHistory = () => {
    if (!currentScreen) return;
    const ok = window.confirm(`Clear chat history for ${currentScreen}?`);
    if (ok) {
      clearChatHistory(currentScreen);
    }
  };

  const handlePromptSuggestionClick = async (suggestion: string | { label: string; contextEnhancement: string }) => {
    // Handle both string and object formats
    const label = typeof suggestion === 'string' ? suggestion : suggestion.label;
    const contextEnhancement = typeof suggestion === 'string' ? '' : suggestion.contextEnhancement;

    // Directly send the suggestion instead of populating the input field
    if (!label.trim() || busy || !currentScreen) return;

    setBusy(true);
    setLastPrompt(label); // Store for fallback action button generation

    // Add user message (show only the label to user)
    addChatMessage({ role: 'user', content: label });

    // Classify desired artifact for suggestions too
    const classifyDesiredArtifact = (text: string, screen: string | null): 'rubric' | 'feedback-plan' | 'report' | 'table' | null => {
      const t = text.toLowerCase();
      const actionVerb = /(create|generate|make|build|design|draft|write|produce)/.test(t);
      if (actionVerb && /\brubric(s)?\b|grading criteria|assessment rubric/.test(t)) return 'rubric';
      if (actionVerb && /(feedback plan|meeting plan|conference plan|talking points|intervention plan|action plan)/.test(t)) return 'feedback-plan';
      if (actionVerb && /\breport\b/.test(t)) return 'report';
      if ((/\btable\b|\btabular\b/.test(t) || (/show|list|rank|prioritize|which|top\s+\d+/).test(t)) && (currentScreen === 'inbox' || currentScreen === 'insights')) return 'table';
      return null;
    };
    const desiredType = classifyDesiredArtifact(label, currentScreen);
    const hasActionVerb = /\b(create|generate|make|build|design|draft|write)\b/i.test(label);
    const hasRubricKeyword = /\brubric\b/i.test(label);
    const isRubricRequest = hasActionVerb && hasRubricKeyword;

    try {
      let streamingContent = '';

      // Build enhanced prompt with context
      let enhancedPrompt = label;
      if (contextEnhancement) {
        enhancedPrompt = `${label}\n\nContext: ${contextEnhancement}`;
      }
      if (desiredType === 'rubric' && !label.includes('```json')) {
        enhancedPrompt += `\n\nIMPORTANT: Only because I asked for a rubric, provide it in the exact JSON format specified in the system instructions, wrapped in a \`\`\`json code fence.`;
      } else if (desiredType && desiredType !== 'rubric' && !label.includes('```json')) {
        enhancedPrompt += `\n\nIf you produce a structured artifact, use a \`\`\`json code block with type:"${desiredType}". Otherwise reply with well-formatted Markdown (headings and bullets). Do NOT generate a rubric.`;
      } else if (!desiredType) {
        enhancedPrompt += `\n\nUnless explicitly asked for a structure, respond with clear, well-formatted Markdown. Do NOT generate a rubric unless I explicitly ask for a rubric.`;
      }

      const response = await askGeminiStream(enhancedPrompt, contextData, (chunk) => {
        streamingContent += chunk;
      });

      const fullText = response.text || streamingContent;

      // Handle artifacts - only look for properly formatted JSON
      let artifact = null;
      const jsonMatch = fullText.match(/```json\s*\n([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          const parsedType = parsed && typeof parsed.type === 'string' ? String(parsed.type) : '';
          if (parsedType === 'rubric') {
            if (isRubricRequest || desiredType === 'rubric') {
              if (parsed.criteria) artifact = parsed;
            }
          } else if (parsedType === 'report' || parsedType === 'table' || parsedType === 'data' || parsedType === 'feedback-plan') {
            if (!desiredType || desiredType === parsedType) artifact = parsed;
          } else if (parsed.type) {
            if (parsedType !== 'rubric' && (!desiredType || desiredType === parsedType)) artifact = parsed;
          }

          if (artifact) {
            setGeneratingArtifact(true, artifact);
            if (onArtifactGenerated) {
              onArtifactGenerated(artifact);
            }
          }
        } catch (e) {
          console.warn('Failed to parse JSON block:', e);
        }
      }

      addChatMessage({
        role: 'assistant',
        content: fullText,
        engine: response.isReal ? 'gemini' : 'mock',
        artifact: artifact, // Attach artifact to message
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

      if (!artifact && (isRubricRequest || desiredType === 'rubric')) {
        console.warn('⚠️ Rubric requested but AI did not provide properly formatted JSON');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      addChatMessage({
        role: 'system',
        content: isNetworkError
          ? '❌ **Connection Error**\n\nCould not connect to AI service. Please check your internet connection and try again.\n\n[ACTION:retry|Retry|' + prompt + ']'
          : '❌ **Error Processing Request**\n\nSomething went wrong. This might help:\n• Try rephrasing your question\n• Check if the document is loaded\n• Refresh the page if issues persist\n\n[ACTION:retry|Try Again|' + prompt + ']',
      });
    } finally {
      setBusy(false);
    }
  };

  // Handle message feedback
  const handleMessageFeedback = (messageIndex: number, feedback: 'thumbsup' | 'thumbsdown') => {
    setMessageFeedback(prev => ({
      ...prev,
      [messageIndex]: prev[messageIndex] === feedback ? undefined : feedback,
    }));

    // Log feedback (in production, send to analytics/backend)
    console.log(`Message ${messageIndex} feedback:`, feedback);
  };

  // Handle copy message
  const handleCopyMessage = async (content: string, messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageIndex(messageIndex);
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedMessageIndex(null);
      }, 2000);
      console.log('Message copied to clipboard');
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  // Handle regenerate response
  const handleRegenerateResponse = async (messageIndex: number) => {
    // Find most recent user message before this assistant message
    let userIdx = messageIndex - 1;
    while (userIdx >= 0 && messages[userIdx].role !== 'user') userIdx--;
    const userMessage = userIdx >= 0 ? messages[userIdx] : null;
    if (!userMessage) {
      console.error('Cannot find user message to regenerate from');
      return;
    }

    // Remove this assistant response (and anything after it)
    const updatedMessages = messages.slice(0, messageIndex);
    if (currentScreen) {
      useStore.setState(state => ({
        chat: {
          ...state.chat,
          conversations: {
            ...state.chat.conversations,
            [currentScreen]: {
              ...state.chat.conversations[currentScreen],
              messages: updatedMessages,
            },
          },
        },
      }));
    }

    // Re-send using the original user prompt
    await sendMessage(userMessage.content);
  };

  // Handle refine response (shorter, simpler, example)
  const handleRefineResponse = async (messageIndex: number, refinementType: 'shorter' | 'simpler' | 'example') => {
    const aiMessage = messages[messageIndex];
    if (!aiMessage || aiMessage.role !== 'assistant') {
      console.error('Cannot find AI message to refine');
      return;
    }

    const refinementPrompts = {
      shorter: 'Please provide a shorter, more concise version of your previous response.',
      simpler: 'Please explain your previous response in simpler terms that are easier to understand.',
      example: 'Please provide a concrete example to illustrate your previous response.',
    };

    setInput(refinementPrompts[refinementType]);
    setTimeout(async () => {
      await sendMessage();
    }, 100);
  };

  // Generate follow-up suggestions based on context and message
  const generateFollowUpSuggestions = (messageIndex: number): string[] => {
    const msg = messages[messageIndex];
    if (!msg || msg.role !== 'assistant') return [];

    const userMsg = messages[messageIndex - 1];
    const userPrompt = userMsg?.content.toLowerCase() || '';

    // Context-specific follow-ups
    if (currentScreen === 'document-viewer') {
      if (userPrompt.includes('thesis') || userPrompt.includes('argument')) {
        return [
          'What evidence supports this thesis?',
          'Are there any counter-arguments I should address?',
        ];
      }
      if (userPrompt.includes('similarity') || userPrompt.includes('match')) {
        return [
          'How should I cite these sources?',
          'Which matches are the most concerning?',
        ];
      }
      if (userPrompt.includes('comment') || userPrompt.includes('feedback')) {
        return [
          'Can you suggest more feedback?',
          'What tone should I use for this comment?',
        ];
      }
      return [
        'What else should I look for in this document?',
        'Can you explain this in more detail?',
      ];
    }

    if (currentScreen === 'inbox') {
      return [
        'Show me submissions with high similarity',
        'What trends do you see in recent submissions?',
      ];
    }

    // Generic follow-ups
    return [
      'Can you explain that differently?',
      'What should I do next?',
    ];
  };

  if (!chat.isOpen || !currentScreen) return null;

  // Expand width when showing artifact
  const baseWidth = chat.panelWidth;
  const expandedWidth = chat.isGeneratingArtifact ? Math.min(baseWidth * 2, 900) : baseWidth;

  // When an artifact is shown, force overlay to avoid pushing the document layout
  const overlayActive = isOverlay || chat.isGeneratingArtifact;

  // In document viewer shrink mode: static positioning in flex layout
  // In overlay mode or other screens: use fixed positioning
  const panelStyle: React.CSSProperties = isDocumentViewer && !overlayActive
    ? {
        // Document viewer, shrink mode: static in flex layout
        width: `${expandedWidth}px`,
        flexShrink: 0,
        transition: 'width 300ms ease-in-out',
      }
    : overlayActive
    ? {
        // Overlay mode (all screens): fixed with rounded corners
        position: 'fixed',
        right: '1rem',
        top: '5rem',
        bottom: '1rem',
        width: `${expandedWidth}px`,
        zIndex: 1000,
        transition: 'transform 300ms ease-in-out, width 300ms ease-in-out',
      }
    : {
        // Other screens, shrink mode: fixed full height
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: `${expandedWidth}px`,
        zIndex: 50, // Higher than table overflow menus
        transition: 'transform 300ms ease-in-out, width 300ms ease-in-out',
      };

  return (
    <div
      ref={panelRef}
      className={`flex ${chat.isGeneratingArtifact ? 'flex-row' : 'flex-col'} bg-white border-l ${overlayActive ? 'shadow-2xl rounded-lg border' : 'h-full'} ${
        isDocumentViewer && !overlayActive ? 'animate-slide-in-left' : overlayActive ? 'animate-slide-in-right' : 'animate-slide-in-right'
      }`}
      style={panelStyle}
    >
      {/* Resize handle (only in shrink mode) */}
      {!overlayActive && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
          onMouseDown={handleResizeStart}
          style={{ marginLeft: '-2px' }}
        />
      )}

      {/* Chat Section */}
      <div className={`flex flex-col min-h-0 transition-all duration-300 ease-in-out ${chat.isGeneratingArtifact ? 'w-2/5 border-r' : 'flex-1'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h3 className="font-semibold text-sm">AI Assistant</h3>
          <span className="text-xs text-gray-500">({currentScreen})</span>
          <div className="relative">
            <button
              onClick={() => setShowContextHelp(!showContextHelp)}
              className="p-1 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700"
              title="What can the AI see?"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
            {showContextHelp && (
              <div className="absolute left-0 top-8 w-64 bg-white border shadow-lg rounded-lg p-3 text-xs z-50">
                <div className="mb-2 font-semibold text-gray-700">AI has access to:</div>
                <ul className="space-y-1 text-gray-600">
                  {currentScreen === 'document-viewer' && (
                    <>
                      <li>• Document title and author</li>
                      <li>• Current, first, and last page content</li>
                      <li>• All similarity matches and sources</li>
                      <li>• Your comments and highlights</li>
                    </>
                  )}
                  {currentScreen === 'inbox' && (
                    <>
                      <li>• All submissions in your inbox</li>
                      <li>• Submission metadata (dates, authors, similarity scores)</li>
                      <li>• Statistics and trends</li>
                    </>
                  )}
                  {currentScreen === 'insights' && (
                    <>
                      <li>• Course analytics data</li>
                      <li>• Submission trends</li>
                      <li>• Similarity score distributions</li>
                    </>
                  )}
                  {currentScreen === 'settings' && (
                    <>
                      <li>• Application settings</li>
                      <li>• Feature flags</li>
                      <li>• User preferences</li>
                    </>
                  )}
                </ul>
                <button
                  onClick={() => setShowContextHelp(false)}
                  className="mt-2 text-blue-600 hover:underline text-xs"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
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
      <div ref={scrollerRef} className="flex-1 overflow-auto p-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-8 px-4">
            <p className="mb-6 text-base">👋 Hi! I'm your AI assistant.</p>
            <p className="mb-4">Here are some things I can help with:</p>
            <div className="grid gap-2 max-w-md mx-auto">
              {promptSuggestions.slice(0, 4).map((suggestion, idx) => {
                const label = typeof suggestion === 'string' ? suggestion : suggestion.label;
                return (
                  <button
                    key={idx}
                    onClick={async () => {
                      setInput(label);
                      // Auto-send after a brief delay to show the input
                      setTimeout(async () => {
                        await sendMessage();
                      }, 50);
                    }}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left text-gray-700 text-sm"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          // Parse actions from assistant and system messages
          let parsedContent = (msg.role === 'assistant' || msg.role === 'system')
            ? parseActionsFromResponse(msg.content)
            : { text: msg.content, actions: [] };

          // Apply fallback action buttons if AI didn't include any (only for assistant messages)
          if (msg.role === 'assistant' && parsedContent.actions.length === 0) {
            parsedContent = ensureActionButtons(parsedContent, {
              prompt: lastPrompt,
              screen: contextData?.screen,
              similarityScore: contextData?.similarityScore,
              matchCards: contextData?.matchCards,
            });
          }

          return (
            <div key={msg.id} className={`${msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'} ${msg.role === 'system' ? 'mt-1' : 'mt-3'}`}>
              <div
                className={
                  'max-w-[85%] rounded overflow-hidden ' +
                  (msg.role === 'user'
                    ? 'bg-blue-600 text-white text-sm'
                    : msg.role === 'system'
                    ? 'bg-transparent text-gray-600 text-xs'
                    : 'bg-white border text-sm')
                }
              >
                {/* Message content with padding */}
                <div className={
                  msg.role === 'user'
                    ? 'px-3 py-2 whitespace-pre-wrap'
                    : msg.role === 'system'
                    ? 'px-2 py-0.5'
                    : 'px-3 py-2'
                }>
                  {msg.role === 'assistant' && msg.engine === 'gemini' && (
                    <div className="text-[10px] text-gray-400 mb-1 flex items-center gap-2">
                      <span>Gemini</span>
                      <span className="text-gray-300">•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  {msg.role === 'assistant' && !msg.engine && (
                    <div className="text-[10px] text-gray-400 mb-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {msg.role === 'user' ? (
                    <>
                      {parsedContent.text}
                      <div className="text-[10px] text-blue-200 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </>
                  ) : (
                    <Markdown
                      text={parsedContent.text}
                      matchCards={contextData?.matchCards}
                      onCitationClick={(sourceId) => {
                        handleShowSourceAction({ sourceId });
                      }}
                    />
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

                  {/* Message feedback buttons (thumbs up/down, copy, regenerate) - only for assistant messages */}
                  {msg.role === 'assistant' && (
                    <>
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-3 text-xs">
                        <button
                          onClick={() => handleMessageFeedback(messages.indexOf(msg), 'thumbsup')}
                          className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors ${
                            messageFeedback[messages.indexOf(msg)] === 'thumbsup' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="Good response"
                        >
                          <span className="text-sm">👍</span>
                        </button>
                        <button
                          onClick={() => handleMessageFeedback(messages.indexOf(msg), 'thumbsdown')}
                          className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors ${
                            messageFeedback[messages.indexOf(msg)] === 'thumbsdown' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
                          }`}
                          title="Bad response"
                        >
                          <span className="text-sm">👎</span>
                        </button>
                        <div className="flex-1"></div>
                        <button
                          onClick={() => handleCopyMessage(parsedContent.text, messages.indexOf(msg))}
                          className="px-2 py-1 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                        >
                          {copiedMessageIndex === messages.indexOf(msg) ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={() => handleRegenerateResponse(messages.indexOf(msg))}
                          className="px-2 py-1 rounded hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={busy}
                        >
                          Regenerate
                        </button>
                      </div>
                      {/* Suggested follow-up questions */}
                      {(() => {
                        const followUps = generateFollowUpSuggestions(messages.indexOf(msg));
                        if (followUps.length === 0) return null;

                        const messageIndex = messages.indexOf(msg);
                        const isExpanded = showFollowUps[messageIndex];

                        return (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => {
                                const newState = !isExpanded;
                                setShowFollowUps(prev => ({
                                  ...prev,
                                  [messageIndex]: newState
                                }));

                                // Auto-scroll when expanding to show the suggestions
                                if (newState) {
                                  setTimeout(() => {
                                    if (scrollerRef.current) {
                                      scrollerRef.current.scrollBy({
                                        top: 120,
                                        behavior: 'smooth'
                                      });
                                    }
                                  }, 50);
                                }
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            >
                              <span>{isExpanded ? '▼' : '▶'}</span>
                              <span>Suggested follow-ups</span>
                            </button>
                            {isExpanded && (
                              <div className="mt-2 flex flex-col gap-1">
                                {followUps.map((question, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setInput(question);
                                      inputRef.current?.focus();
                                    }}
                                    className="text-left px-3 py-2 text-xs bg-gray-50 hover:bg-blue-50 rounded text-gray-700 hover:text-blue-700 transition-colors"
                                  >
                                    {question}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>

                {/* Render "View Artifact" button if message has an artifact - full width at bottom */}
                {msg.artifact && (
                  <button
                    onClick={() => setGeneratingArtifact(true, msg.artifact)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all border-t border-blue-400"
                  >
                    <span className="text-base">📝</span>
                    <span>View Artifact</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator when busy */}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-white border rounded px-3 py-2 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Suggestions - Collapsible */}
      {promptSuggestions.length > 0 && (
        <div className="border-t bg-gray-50">
          {/* Collapse toggle bar */}
          <button
            onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
              Suggested Actions
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${suggestionsExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Expandable content */}
          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              suggestionsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {promptSuggestions.map((suggestion, idx) => {
                const label = typeof suggestion === 'string' ? suggestion : suggestion.label;
                return (
                  <button
                    key={idx}
                    onClick={() => handlePromptSuggestionClick(suggestion)}
                    className="text-xs px-3 py-1.5 bg-white hover:bg-blue-50 hover:border-blue-300 rounded-full border border-gray-300 text-gray-700 transition-colors duration-150 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={busy}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-2 bg-white flex flex-col gap-2">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            className="flex-1 border rounded px-3 py-2 text-sm resize-none overflow-auto max-h-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
            rows={1}
          />
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2 min-w-[70px] justify-center"
            onClick={sendMessage}
            disabled={busy || !input.trim()}
          >
            {busy ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending</span>
              </>
            ) : (
              'Send'
            )}
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
      {(chat.isGeneratingArtifact || isClosingArtifact) && chat.currentArtifact && (
        <div className={`w-3/5 flex flex-col bg-gray-50 ${isClosingArtifact ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          <div className="flex items-center justify-between p-3 border-b bg-white">
            <h3 className="font-semibold text-sm">📝 {chat.currentArtifact?.type ? String(chat.currentArtifact.type).replace(/\b\w/g, c => c.toUpperCase()) : 'Artifact'}{chat.currentArtifact?.title ? `: ${chat.currentArtifact.title}` : ''}</h3>
            <button
              onClick={() => {
                setIsClosingArtifact(true);
                // Wait for animation to complete before actually closing
                setTimeout(() => {
                  setGeneratingArtifact(false);
                  setIsClosingArtifact(false);
                }, 300); // Match animation duration
              }}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <ArtifactPreview artifact={chat.currentArtifact} />
          </div>
          <div className="border-t p-3 bg-white flex gap-2">
            {chat.currentArtifact?.type === 'rubric' && (
              <button
                onClick={() => {
                  console.log('Edit rubric:', chat.currentArtifact);
                }}
                className="flex-1 px-3 py-2 border rounded text-sm hover:bg-gray-50"
              >
                Edit
              </button>
            )}
            {chat.currentArtifact?.type === 'rubric' && (
              <button
                onClick={() => {
                  if (chat.currentArtifact?.type === 'rubric') {
                    const rubric = {
                      id: `rubric-${Date.now()}`,
                      title: chat.currentArtifact.title || 'Untitled Rubric',
                      type: chat.currentArtifact.layout || 'weighted',
                      criteria: chat.currentArtifact.criteria || [],
                      scales: chat.currentArtifact.scales || [],
                      createdAt: new Date().toISOString(),
                      lastModified: new Date().toISOString(),
                    };

                    // Add to rubrics list and save
                    useStore.setState((state) => ({ rubrics: [...state.rubrics, rubric] }));
                    useStore.getState().saveRubrics();

                    addChatMessage({ role: 'system', content: `✓ Rubric saved` });
                    console.log('Saved rubric:', rubric);
                  }
                }}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Save to Rubrics
              </button>
            )}
            <button
              onClick={() => {
                if (chat.currentArtifact) {
                  // Export as JSON
                  const dataStr = JSON.stringify(chat.currentArtifact, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  const safeTitle = (chat.currentArtifact.title || 'artifact').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                  const typePrefix = (chat.currentArtifact.type || 'artifact').toString();
                  link.download = `${typePrefix}-${safeTitle}-${Date.now()}.json`;
                  link.click();
                  URL.revokeObjectURL(url);

                  console.log('Exported artifact:', chat.currentArtifact);
                }
              }}
              className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
            >
              Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Artifact Preview Component
function ArtifactPreview({ artifact }: { artifact: any }) {
  if (!artifact) {
    return <div className="text-sm text-gray-500">No artifact to display</div>;
  }

  // Render based on artifact type
  switch (artifact.type) {
    case 'rubric':
      return <RubricArtifact artifact={artifact} />;
    case 'feedback-plan':
      return <FeedbackPlanArtifact artifact={artifact} />;
    case 'report':
      return <ReportArtifact artifact={artifact} />;
    case 'table':
      return <TableArtifact artifact={artifact} />;
    default:
      // Fallback to a generic viewer for unknown or missing types
      return <GenericArtifact artifact={artifact} />;
  }
}

// Rubric Artifact Component
function RubricArtifact({ artifact }: { artifact: any }) {
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

// Feedback Plan Artifact Component
function FeedbackPlanArtifact({ artifact }: { artifact: any }) {
  const { title, sections } = artifact;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div>
        <h4 className="font-bold text-lg">{title || 'Feedback Plan'}</h4>
        <div className="text-xs text-gray-500 mt-1">Meeting Plan for Student</div>
      </div>

      <div className="space-y-4">
        {sections?.map((section: any, idx: number) => (
          <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
            <div className="font-semibold text-sm text-blue-900 mb-2">{section.heading}</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{section.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Report Artifact Component
function ReportArtifact({ artifact }: { artifact: any }) {
  const { title, sections } = artifact;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div>
        <h4 className="font-bold text-lg">{title || 'Report'}</h4>
        <div className="text-xs text-gray-500 mt-1">Analysis Report</div>
      </div>

      <div className="space-y-4">
        {sections?.map((section: any, idx: number) => (
          <div key={idx} className="space-y-2">
            <h5 className="font-semibold text-sm text-gray-900">{section.heading}</h5>
            {section.content && (
              <p className="text-sm text-gray-700">{section.content}</p>
            )}
            {section.items && (
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {section.items.map((item: string, itemIdx: number) => (
                  <li key={itemIdx}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Table Artifact Component
function TableArtifact({ artifact }: { artifact: any }) {
  const { title, headers, rows } = artifact;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div>
        <h4 className="font-bold text-lg">{title || 'Data Table'}</h4>
        <div className="text-xs text-gray-500 mt-1">Tabular Data</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-collapse border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {headers?.map((header: string, idx: number) => (
                <th key={idx} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.map((row: any[], rowIdx: number) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell: any, cellIdx: number) => (
                  <td key={cellIdx} className="border border-gray-300 px-3 py-2 text-gray-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Generic Artifact Component (fallback)
function GenericArtifact({ artifact }: { artifact: any }) {
  const type = artifact?.type || 'generic';
  const title = artifact?.title || 'Artifact';
  const json = JSON.stringify(artifact, null, 2);

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div>
        <h4 className="font-bold text-lg">{title}</h4>
        <div className="text-xs text-gray-500 mt-1">Type: {String(type)}</div>
      </div>
      <div className="text-xs text-gray-600">
        <div className="mb-1 font-medium">Raw Data</div>
        <pre className="bg-gray-50 border rounded p-3 overflow-auto text-xs"><code>{json}</code></pre>
      </div>
    </div>
  );
}
