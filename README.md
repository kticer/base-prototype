# iThenticate Prototype

An educational document analysis and grading application built with React + TypeScript + Vite. This prototype demonstrates document similarity detection, AI writing analysis, feedback tools, and comprehensive grading workflows with a modern, design-system-driven UI.

## Overview

This React + TypeScript application simulates an iThenticate-like plagiarism detection system enhanced with an AI assistant powered by Google Gemini. The AI provides proactive guidance, helping educators analyze similarity scores, identify academic integrity issues, and take appropriate action—all through conversational interaction.

### Key Features

- **📊 Similarity Detection**: Document highlighting with match cards showing sources (Internet, Submitted Works, Publications)
- **🤖 AI Writing Analysis**: Detect AI-generated content with percentage-based reporting and detailed highlights
- **💬 Feedback System**: Add comments, annotations, strikethrough deletions, and point annotations
- **📝 Grading Tools**: Rubric creation, scoring, and comprehensive grading workflows
- **📈 Submission Management**: Sortable table with metrics (similarity, AI writing, flags, grades, viewed status)
- **📈 Analytics**: Course-wide insights and submission statistics
- **🎨 Design System**: Figma-integrated design tokens with typography, color, and spacing systems

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

### Step 2: Start the Development Server

```bash
npm run dev
```
This starts the React app at `http://localhost:5173`

### Step 3: Test the Application

1. **Open the app**: Navigate to `http://localhost:5173`
2. **Browse submissions**:
   - View the submission list with sortable columns
   - Check similarity percentages, AI writing scores, and flags
   - Click any submission to open the document viewer
3. **Analyze documents**:
   - Switch between Similarity, AI Writing, Flags, Feedback, and Grading tabs
   - Click highlighted text to see match cards
   - Navigate between matches using the sidebar
4. **Add feedback**:
   - Select text to open the floating action bar
   - Add comments or strikethrough deletions
   - Create point annotations
5. **Grade submissions**:
   - Switch to the Grading tab
   - Apply rubrics or assign scores
   - Add summary comments

### Expected Behavior

✅ **Working correctly:**
- Submission table displays with all metrics
- Document viewer shows highlights and match cards
- Tab navigation switches between different views
- Badges show accurate percentages from document data
- Comments and annotations persist to localStorage

❌ **Common issues:**
- **"Document not found"**: Document validation error, restart dev server
- **Highlights not showing**: Check that document JSON includes highlights array

## Development Commands

```bash
# Frontend Development
npm run dev              # Start Vite dev server (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build

# Testing & Quality
npm test                 # Run Jest tests
npm run lint             # Run ESLint
```

## Architecture

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **State**: Zustand for global state management
- **Design System**: Figma-integrated design tokens (typography, colors, spacing)
- **Storage**: LocalStorage for user data, comments, rubrics
- **Testing**: Jest, React Testing Library

### Project Structure

```
├── public/
│   └── data/
│       ├── documents/           # Document JSON files with similarity data
│       └── folder_structure.json
├── src/
│   ├── components/
│   │   ├── document/            # Document viewer (header, tabs, content, sidebar)
│   │   ├── feedback/            # Comments, annotations, floating cards
│   │   ├── inbox/               # Submission table, navbar, tabs, status badges
│   │   ├── rubric/              # Rubric creator and editor
│   │   └── settings/            # Feature flags and controls
│   ├── hooks/                   # Custom React hooks
│   ├── pages/                   # Top-level page components
│   ├── utils/
│   │   └── validation.ts        # Runtime validation helpers
│   ├── store.ts                 # Zustand store with state management
│   └── types.ts                 # TypeScript types
└── CLAUDE.md                    # Detailed architecture docs
```

## Key Concepts

### Design System Integration

The application uses a Figma-integrated design system with:

**Typography:**
- Noto Sans (body text, labels, UI elements)
- Lexend Deca (headings, titles)
- Standardized size scale (headline-small, title-large, body-large, body-medium, label-small)

**Color Tokens:**
- Surface variants (background layers)
- On-surface variants (text hierarchy)
- Outline and dividers
- Secondary (interactive elements)

**Component Patterns:**
- Status badges (grades, similarity, AI writing, flags)
- Processing states with animated spinners
- Icon system with consistent sizing
- Hover states and transitions

### Document Analysis

Documents include multiple analysis types:

**Similarity Detection:**
- Percentage-based scoring
- Match cards with source URLs and metadata
- Highlighted text with bidirectional navigation
- Exclude/include sources functionality

**AI Writing Detection:**
- Character-level coverage calculation
- Highlighted sections showing AI-generated content
- Percentage displayed in tab badges

**Flags System:**
- Academic integrity issues
- Custom flags for review items
- Count displayed in submission table

## Testing the Prototype

### Manual Testing Checklist

```
□ Frontend server running (npm run dev)
□ Submission list displays with all columns
□ Sort by student, title, submitted, grade, similarity, AI writing, flags, viewed
□ Click submission → document viewer opens
□ Tab badges show correct percentages from document data
□ Similarity tab → highlights visible, match cards in sidebar
□ AI Writing tab → AI writing highlights visible, percentage matches badge
□ Feedback tab → add comments, strikethrough text, point annotations
□ Grading tab → assign scores, apply rubrics
□ Comments persist to localStorage
□ No errors in browser console
```

### Sample Test Documents

Documents in `public/data/documents/` include:

- **doc-story1-test**: Climate Change paper (35% similarity)
  - Multiple match cards with sources
  - AI writing highlights
  - Best for testing full feature set

- **doc-illustrious-baseball**: Baseball essay (27% similarity)
  - Multiple small matches
  - Good for testing navigation

## Configuration

### Design System

The application uses Tailwind CSS with custom design tokens defined in `tailwind.config.js`:

**Typography Scale:**
- `headline-small`: 24px/32px, weight 500
- `title-large`: 20px/28px, weight 600
- `body-large`: 16px/24px, weight 600
- `body-medium`: 14px/20px, weight 400
- `label-small`: 12px/16px, weight 600

**Color Tokens:**
- `surface-variant-1`: #f9f9f9 (light background)
- `surface-variant-2`: #f5f5f5 (lighter background)
- `surface-dark`: #e5e5e5 (document background)
- `surface-on-surface`: #191919 (primary text)
- `surface-on-surface-variant-1`: #2d2d2d (secondary text)
- `surface-on-surface-variant-2`: #636363 (tertiary text)
- `secondary`: #0095ff (interactive blue)

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

### Percentages don't match
- **Cause**: Badge percentages are calculated from document data
- **Check**: Ensure document JSON has `similarity` field and `aiWritingHighlights` array
- **Fix**: Verify calculations in DocumentViewer.tsx

### Document won't load
- **Cause**: Validation error in document JSON
- **Fix**: Check browser console for specific error
- **Fix**: Restart dev server

### TypeScript errors
- **Note**: Some pre-existing TypeScript warnings are expected
- **Fix**: `npm run build` should complete despite warnings

## Recent Updates

### UI Redesign (December 2024) ✅
- Figma-integrated design system
- Complete submission list redesign
- Document viewer header and tab styling
- Status badge component library
- Typography and color token system

### Current Features ✅
- Similarity detection with match cards
- AI writing analysis and highlighting
- Feedback system with comments and annotations
- Grading tools with rubric support
- Submission management dashboard

## Contributing

1. Follow existing code patterns and TypeScript conventions
2. Run tests before committing: `npm test`
3. Use meaningful commit messages
4. Update CLAUDE.md for architectural changes

## Additional Documentation

- **CLAUDE.md** - Comprehensive architecture documentation for Claude Code

## License

This is a prototype application for demonstration purposes.

---

**Questions or Issues?** Open an issue on GitHub or consult the CLAUDE.md file for detailed architecture information.
