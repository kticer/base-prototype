/**
 * Utilities for parsing and handling chat action buttons
 */

export interface ChatAction {
  type: 'draft_comment' | 'add_comment' | 'add_summary_comment' | 'highlight_text' | 'navigate' | 'generate_list' | 'show_source' | 'next_issue' | 'prev_issue' | 'retry';
  label: string;
  payload?: any;
}

export interface ParsedChatResponse {
  text: string;
  actions: ChatAction[];
}

/**
 * Parse AI response for embedded action buttons
 * Format: [ACTION:action_type|Label Text|optional_payload]
 *
 * Examples:
 * - [ACTION:draft_comment|Help me draft a comment]
 * - [ACTION:highlight_text|Show me the issue|mc1]
 * - [ACTION:navigate|Go to Grading tab|Grading]
 */
export function parseActionsFromResponse(text: string): ParsedChatResponse {
  const actionRegex = /\[ACTION:(\w+)\|([^\]|]+)(?:\|([^\]]+))?\]/g;
  const actions: ChatAction[] = [];
  const seen = new Set<string>();
  let match;

  while ((match = actionRegex.exec(text)) !== null) {
    const [, type, label, payload] = match;

    // Create a unique key for deduplication
    // Use type + payload (if exists) to identify duplicates
    // This allows same type with different payloads, but prevents exact duplicates
    const uniqueKey = payload ? `${type}:${payload}` : `${type}:${label}`;

    // Skip if we've already seen this exact action
    if (seen.has(uniqueKey)) {
      console.log(`⚠️ Skipping duplicate action: ${type} - ${label}`);
      continue;
    }

    seen.add(uniqueKey);
    actions.push({
      type: type as ChatAction['type'],
      label,
      payload: payload || undefined,
    });
  }

  // Remove action syntax from text
  const cleanText = text.replace(actionRegex, '').trim();

  return {
    text: cleanText,
    actions,
  };
}

/**
 * Format action button for display
 */
export function formatActionLabel(action: ChatAction): string {
  return action.label;
}

/**
 * Add fallback action buttons if the AI didn't include any
 * This ensures consistent UX even when the AI doesn't follow instructions
 */
export function ensureActionButtons(
  parsed: ParsedChatResponse,
  context: {
    prompt: string;
    screen?: string; // Add screen context to prevent inappropriate actions
    similarityScore?: number;
    matchCards?: Array<{ id: string; academicIntegrityIssue?: boolean; similarityPercent: number }>;
  }
): ParsedChatResponse {
  // If AI already included actions, trust them
  if (parsed.actions.length > 0) {
    return parsed;
  }

  const fallbackActions: ChatAction[] = [];
  const responseText = parsed.text.toLowerCase();
  const prompt = context.prompt.toLowerCase();
  const isDocumentViewer = context.screen === 'document-viewer';

  // Pattern 1: Similarity score explanation (only on document-viewer)
  if (
    isDocumentViewer &&
    (
      (prompt.includes('explain') && prompt.includes('similarity')) ||
      prompt.includes('similarity score') ||
      responseText.includes('similarity score') ||
      responseText.includes('similarity comes from')
    )
  ) {
    // Find the largest uncited source
    const problematicSource = context.matchCards
      ?.filter((mc) => mc.academicIntegrityIssue)
      .sort((a, b) => b.similarityPercent - a.similarityPercent)[0];

    if (problematicSource) {
      fallbackActions.push({
        type: 'draft_comment',
        label: 'Help me draft a comment',
        payload: problematicSource.id,
      });
      fallbackActions.push({
        type: 'highlight_text',
        label: 'Show me the issue',
        payload: problematicSource.id,
      });
    } else if (context.matchCards?.[0]) {
      // If no integrity issues, offer to view the largest source
      fallbackActions.push({
        type: 'show_source',
        label: 'View largest source',
        payload: context.matchCards[0].id,
      });
    }
  }

  // Pattern 2: Issues/concerns mentioned (only on document-viewer)
  if (
    isDocumentViewer &&
    (
      responseText.includes('issue') ||
      responseText.includes('concern') ||
      responseText.includes('uncited') ||
      responseText.includes('not cited') ||
      responseText.includes('academic integrity')
    )
  ) {
    if (!fallbackActions.some((a) => a.type === 'draft_comment')) {
      fallbackActions.push({
        type: 'draft_comment',
        label: 'Help me draft a comment',
      });
    }
  }

  // Pattern 3: Grading mentioned (only on document-viewer)
  if (
    isDocumentViewer &&
    (
      responseText.includes('grading') ||
      responseText.includes('grade') ||
      responseText.includes('rubric') ||
      responseText.includes('score')
    )
  ) {
    if (!fallbackActions.some((a) => a.type === 'navigate')) {
      fallbackActions.push({
        type: 'navigate',
        label: 'Go to Grading tab',
        payload: 'Grading',
      });
    }
  }

  // Pattern 4: Multiple issues - offer navigation (only on document-viewer)
  if (isDocumentViewer) {
    const issueCount = context.matchCards?.filter((mc) => mc.academicIntegrityIssue).length || 0;
    if (issueCount > 1 && (
      responseText.includes('issue') ||
      responseText.includes('similarity') ||
      responseText.includes('match')
    )) {
      if (!fallbackActions.some((a) => a.type === 'next_issue')) {
        fallbackActions.push({
          type: 'next_issue',
          label: `Next issue (${issueCount} total)`,
        });
      }
    }
  }

  return {
    text: parsed.text,
    actions: fallbackActions,
  };
}
