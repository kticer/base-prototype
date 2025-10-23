# Gemini Prompt System Overview

This document summarizes which files construct prompts for Google Gemini and how the end-to-end prompting and response flow works in this prototype.

## Prompt-Building Files

- `src/components/chatbot/GlobalChatPanel.tsx`
  - Builds the final prompt sent to Gemini.
  - Enhances user input with guidance (request specific JSON artifacts when asked; otherwise prefer concise Markdown; avoid rubrics unless explicitly requested).
  - Appends contextual details when a prompt suggestion provides `contextEnhancement`.
  - Sends `conversationHistory` + `contextData` to the client adapter (`askGeminiStream`).
  - Parses returned artifacts/actions and triggers UI behavior (show source, highlight, add comment, navigate).

- `src/pages/DocumentViewer.tsx`
  - Produces context-aware `promptSuggestions` with a `label` and `contextEnhancement` (auto-sent by GlobalChatPanel).
  - Provides rich `contextData` (doc metadata, similarity, match cards, highlights, page content, metrics, sourceName→id map).

- `src/pages/InboxPage.tsx`
  - Generates inbox-specific `promptSuggestions` based on computed metrics (ungraded, high-similarity, recency).
  - Supplies inbox `contextData` including `metrics`, `triageWeights`, `topPriorityIds`, and trimmed `submissions`.

- `src/pages/InsightsPage.tsx`
  - Generates analytics-focused `promptSuggestions` and passes course-wide `contextData` (insight metrics, common sources, totals).

- `src/pages/SettingsPage.tsx`
  - Provides simple static `promptSuggestions` for settings configuration topics.

- `src/services/geminiClient.ts`
  - Client-side adapter that accepts `prompt` + `GeminiContext` and calls `/api/chat` or `/api/chat/stream` when `VITE_USE_REAL_GEMINI === 'true'`.
  - Provides deterministic mock responses as a fallback.

- `server/index.js`
  - Server-side system instruction and context builder. Combines base rules, screen-specific guidance, artifact rules, and action rules into a single system instruction.
  - "Lightens" the incoming context to a concise, text block (doc info, similarity, highlights, top sources, page snippets, metrics, triage data) and prepends it to the user query.
  - Invokes Gemini via `@google/generative-ai` and returns sanitized text to the client. Supports streaming and non-streaming.

- `src/utils/chatActions.ts`
  - Defines the expected JSON action schema and parsing. Adds fallback actions if none are emitted to keep UX consistent.

## Request Flow

1. A page (Document/Inbox/Insights/Settings) composes `contextData` and `promptSuggestions`.
2. The user types or clicks a suggestion. GlobalChatPanel enhances the prompt:
   - If an artifact is clearly requested (rubric/report/table/feedback-plan), it asks for a single JSON object in a ```json code fence.
   - Otherwise, it requests clear Markdown and instructs to avoid rubrics.
   - It includes recent `conversationHistory` and the current `contextData`.
3. `askGeminiStream(prompt, contextData, onChunk)` posts `{ prompt, context }` to `/api/chat/stream` when real mode is enabled; otherwise returns a mock.
4. `server/index.js` resolves the model (prefers Flash), builds the system instruction, lightens the context, prepends it to the user prompt, and calls Gemini. Responses are sanitized (legacy `[ACTION:...]` removed; JSON blocks allowed).
5. GlobalChatPanel assembles streamed chunks, extracts a JSON artifact if present, parses any JSON `actions`, and executes them (add comment, highlight, show source, navigate, etc.). It also applies UI heuristics (e.g., auto-navigate to AI Writing or largest match when applicable).

## System Instruction Composition (server/index.js)

- Base rules: instructor-focused, concise, do not expose internal IDs (e.g., `highlightId`, `matchCardId`).
- Screen-specific guidance:
  - Document Viewer: integrity analysis, feedback, navigation actions, use provided metrics.
  - Inbox: prioritize using pre-computed metrics/triage; table artifacts for lists.
  - Insights: course-wide metrics usage.
  - Settings: configuration help.
- Artifact rules: return a single JSON artifact (rubric/report/table/feedback-plan) inside a ```json block; never produce rubrics unless explicitly asked.
- Action rules: return JSON actions array inside a ```json block; keep labels clear; constrain payloads.

## Context Provided to Gemini (examples)

- Document: `{ id, title, author }`
- Similarity: `similarityScore`, top `matchCards` (id, sourceName, similarityPercent, cited flags, issue flags)
- Highlights: simplified visible highlights with `id`, `matchCardId`, `page`, and text
- Pages: excerpts of `first`, `current`, `last` page content and `total`
- Metrics: inbox/document/insights metrics objects
- Inbox triage: `triageWeights`, `topPriorityIds`, trimmed `submissions` with selected fields
- Source map: `sourceIdMap` (sourceName → matchCardId) to allow name-based references

## Environment Switches and Model Selection

- Frontend
  - `VITE_USE_REAL_GEMINI`: when `'true'`, calls the server; otherwise uses local mock in `geminiClient`.
- Backend
  - `GEMINI_API_KEY`: enables real calls; missing key returns `MOCK:` responses.
  - `GEMINI_MODEL`/`GEMINI_REQUIRE_FLASH`: influence model selection (prefers Flash models).

## Where to Tweak Behavior

- System instructions and context formatting: `server/index.js` (base/screen/artifact/action rules; `lighten` function; context preface).
- Prompt enhancement and artifact parsing: `src/components/chatbot/GlobalChatPanel.tsx`.
- Suggestion generation: `src/pages/DocumentViewer.tsx`, `src/pages/InboxPage.tsx`, `src/pages/InsightsPage.tsx`, `src/pages/SettingsPage.tsx`.
- Client adapter and mock behavior: `src/services/geminiClient.ts`.
- Action schema and fallbacks: `src/utils/chatActions.ts`.

