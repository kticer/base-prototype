# UX AI Chatbot Prototype (Late 2025)

An educational document analysis and grading application featuring AI-powered assistance for academic integrity review. This prototype demonstrates the "First to Insight" user journey, helping educators quickly understand and address similarity scores with intelligent, context-aware support.

**Prototype Focus:** Chatbot vision for narratives (October 2025) - Story 1: From Score to Action in Under a Minute

## Overview

This React + TypeScript application simulates an iThenticate-like plagiarism detection system enhanced with an AI assistant powered by Google Gemini. The AI provides proactive guidance, helping educators analyze similarity scores, identify academic integrity issues, and take appropriate action—all through conversational interaction.

### Key Features

- **🎯 AI-Powered Analysis**: Context-aware chatbot that explains similarity scores, identifies issues, and suggests next steps
- **⚡ Proactive Assistance**: Clickable prompt suggestions that auto-send for instant analysis
- **🎬 Action Buttons**: AI offers interactive buttons like "Help me draft a comment" that execute actions directly
- **📊 Similarity Detection**: Document highlighting with match cards showing sources (Internet, Submitted Works, Publications)
- **💬 Feedback System**: Add comments, annotations, and feedback with AI assistance
- **📝 Grading Tools**: Rubric creation, scoring, and comprehensive grading workflows
- **📈 Analytics**: Course-wide insights and submission statistics

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **(Optional)** Google Gemini API key for real AI responses

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/kticer/ux-chatbot-prototype.git
cd ux-chatbot-prototype

# Install dependencies
npm install
```

### Step 2: Start the Development Servers

You need **two terminals** running simultaneously:

**Terminal 1 - Frontend (Vite):**
```bash
npm run dev
```
This starts the React app at `http://localhost:5173`

**Terminal 2 - Chat API (Express):**
```bash
npm run chat-api
```
This starts the Gemini API proxy at `http://localhost:3001`

### Step 3: (Optional) Configure Gemini API

For real AI responses instead of mock data:

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set the environment variable before starting the chat API:

```bash
# Terminal 2
export GEMINI_API_KEY="your-api-key-here"
npm run chat-api
```

**Without an API key:** The chat will work in mock mode with simulated responses that don't include action buttons.

### Step 4: Test the Application

1. **Open the app**: Navigate to `http://localhost:5173`
2. **Find the test document**:
   - Go to "Research Papers – Fall 2024" folder
   - Click "The Impact of Climate Change on Global Agriculture" (35% similarity)
3. **Open the chat panel**: Click the chat icon or panel
4. **Try proactive prompts**: Click "Explain this similarity score"
5. **Use action buttons**: Click buttons like "[Help me draft a comment]" in the AI response

### Expected Behavior

✅ **Working correctly:**
- Proactive prompt pills appear above the chat input
- Clicking prompts automatically sends the message
- AI responds with clear explanations (shows "Gemini" label with real API)
- Action buttons appear in AI responses
- Clicking action buttons performs actions (drafts comments, navigates highlights, etc.)
- System messages confirm actions: "✅ Comment added"

❌ **Common issues:**
- **No action buttons**: API key not set (mock mode)
- **"Document not found"**: Document validation error, restart dev server
- **Chat not responding**: Chat API server not running in Terminal 2

## Development Commands

```bash
# Frontend Development
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build

# Backend (Chat API)
npm run chat-api         # Start Express API server (port 3001)

# Testing & Quality
npm test                 # Run Jest tests
npm run lint             # Run ESLint

# All servers (requires compatible shell)
npm run dev & npm run chat-api   # Run both servers
```

## Architecture

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **State**: Zustand for global state management
- **Backend**: Express.js proxy for Gemini API
- **AI**: Google Gemini (Flash models preferred)
- **Storage**: LocalStorage for user data, comments, rubrics
- **Testing**: Jest, React Testing Library

### Project Structure

```
├── public/
│   └── data/
│       ├── documents/           # Document JSON files with similarity data
│       └── folder_structure.json
├── server/
│   ├── index.js                 # Express API proxy for Gemini
│   └── logger.js                # Structured logging
├── src/
│   ├── components/
│   │   ├── chatbot/             # Chat UI and action buttons
│   │   ├── document/            # Document viewer components
│   │   ├── feedback/            # Comments and grading
│   │   ├── rubric/              # Rubric creator and editor
│   │   └── settings/            # Feature flags and controls
│   ├── hooks/                   # Custom React hooks
│   ├── pages/                   # Top-level page components
│   ├── services/
│   │   └── geminiClient.ts      # Gemini API client
│   ├── utils/
│   │   └── chatActions.ts       # Action button parser
│   ├── store.ts                 # Zustand store with action handlers
│   └── types.ts                 # TypeScript types
└── CLAUDE.md                    # Detailed architecture docs
```

## Key Concepts

### Story 1: First to Insight

This prototype implements the "First to Insight" user journey where educators:

1. **Open a paper** with a similarity score (e.g., 35%)
2. **See proactive prompts** like "Explain this similarity score"
3. **Get AI analysis** identifying the primary driver (e.g., 22% from uncited NOAA source)
4. **Receive action buttons** like "[Help me draft a comment]"
5. **Take action** with AI assistance to address the issue

### AI Action System

The AI can offer interactive action buttons using this syntax in responses:
```
[ACTION:action_type|Button Label|optional_payload]
```

**Available actions:**
- `draft_comment` - AI drafts a comment about an issue
- `add_comment` - Adds a comment to the document
- `highlight_text` - Navigates to a specific match
- `show_source` - Displays source details
- `navigate` - Switches tabs

### Document Context

The AI has access to rich document context including:
- Similarity score and breakdown by source
- Match cards with citation status (cited vs. uncited)
- Academic integrity flags for problematic matches
- Top issues ranked by severity
- Current page and tab information

## Testing the Prototype

### Manual Testing Checklist

```
□ Frontend server running (Terminal 1)
□ Chat API server running (Terminal 2)
□ Gemini API key set (for real AI responses)
□ Navigate to Climate Change document (35% similarity)
□ Chat panel opens
□ Proactive prompts visible and clickable
□ Click "Explain this similarity score"
□ Message auto-sends (no manual Send click needed)
□ AI responds with analysis
□ Action buttons appear in response
□ Click "[Help me draft a comment]" → see drafted text
□ Click "[Add this comment]" → comment appears in Feedback tab
□ Click "[Show me the issue]" → document scrolls to highlight
□ No errors in browser console
```

### Sample Test Documents

- **doc-story1-test**: Climate Change paper (35% similarity)
  - 1 major uncited source (22%)
  - Several properly cited sources
  - Academic integrity issues flagged
  - Best for testing Story 1 features

- **doc-illustrious-baseball**: Baseball essay (27% similarity)
  - Multiple small matches
  - Mixed citation quality

## Configuration

### Environment Variables

```bash
# Required for real AI responses
GEMINI_API_KEY=your-api-key-here

# Optional: Specify model (defaults to auto-selected Flash model)
GEMINI_MODEL=gemini-1.5-flash-latest

# Optional: Require Flash models (default: true)
GEMINI_REQUIRE_FLASH=true
```

### Feature Flags

Enable/disable prototype features via the settings panel (⚙️ icon) or localStorage:

```javascript
// In browser console
localStorage.setItem('ithenticate-feature-flags', JSON.stringify({
  enableAutoSave: true,
  enableReusableComments: true,
  enableAdvancedRubrics: true,
}));
```

## Troubleshooting

### Chat not working
- **Check**: Both servers running? `npm run dev` and `npm run chat-api`
- **Check**: API key set? `echo $GEMINI_API_KEY`
- **Check**: Browser console for errors (F12)

### No action buttons in responses
- **Cause**: Running in mock mode (no API key)
- **Fix**: Set `GEMINI_API_KEY` and restart chat-api server

### Document won't load
- **Cause**: Validation error in document JSON
- **Fix**: Check browser console for specific error
- **Fix**: Restart dev server

### TypeScript errors
- **Note**: Some pre-existing TypeScript warnings are expected
- **Fix**: `npm run build` should complete despite warnings

## Roadmap

### Phase 1: Foundation ✅ (Current)
- Rich document context
- Proactive clickable prompts
- Action button system
- Complete action dispatch

### Phase 2: Core Interactions (Next)
- Highlight-chat bidirectional sync
- Enhanced comment drafting with AI
- Navigation between issues

### Phase 3: Analytics & Insights
- Course-wide similarity analytics
- Student intervention lists
- Pattern detection

### Phase 4: Course Design
- Collaborative rubric creation
- Assignment design assistance
- Syllabus integration

## Contributing

1. Follow existing code patterns and TypeScript conventions
2. Run tests before committing: `npm test`
3. Use meaningful commit messages
4. Update CLAUDE.md for architectural changes

## Additional Documentation

- **CLAUDE.md** - Comprehensive architecture documentation
- **DEVELOPMENT_GUIDE.md** - Development workflows and patterns
- **RUBRIC_IMPORT_GUIDE.md** - Rubric creation and import

## License

This is a prototype application for demonstration purposes.

---

**Questions or Issues?** Open an issue on GitHub or consult the CLAUDE.md file for detailed architecture information.
