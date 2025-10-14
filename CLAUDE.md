# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build and Development:**
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (runs TypeScript check + Vite build)
- `npm run preview` - Preview production build locally
- `npm run chat-api` - Start Express server for Gemini API proxy (for chat features)

**Testing and Quality:**
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint on all files

## Architecture Overview

This is an iThenticate prototype - an educational document analysis and grading application built with React + TypeScript + Vite. The application simulates document similarity analysis, provides AI-powered chat assistance, and includes comprehensive feedback and grading tools for educators.

### Core Pages & Routes

**Main Pages:**
- `/` - InboxPage: Submissions dashboard with sortable table, metrics, and insights
- `/insights` - InsightsPage: Detailed analytics and submission insights
- `/settings` - SettingsPage: Application settings and prototype controls
- `/data/documents/:id` - DocumentViewer: Full document view with multi-tab interface
- `/rubrics` - RubricListPage: Browse and manage grading rubrics
- `/rubrics/create` - RubricCreatorPage: Create/edit rubrics
- `/rubrics/preview/:id` - RubricPreviewPage: Preview rubric layout

**Developer Tools:**
- `/mock-data-builder` - MockDataBuilder: Tool for creating test documents
- `/mock-url/:encodedUrl` - MockUrlPage: URL-based document viewer

### State Management (Zustand)

The application uses Zustand (`src/store.ts`) for centralized state management with these key domains:

**Navigation State:**
- Selected source IDs and match indices for similarity navigation
- Highlight selection and navigation source tracking
- Primary and secondary tab state

**Document Analysis:**
- Match cards with similarity sources and percentages
- Highlight colors and excluded source IDs
- Custom highlights created by users

**Feedback & Grading:**
- Comments with position, page, and text references
- Point annotations with locator dots and text
- Rubric scores and grading criteria
- Summary comments

**Rubrics:**
- Rubric library with weighted, qualitative, and custom types
- Current rubric being edited
- Cell selection and editing state

**Chat System:**
- Per-screen conversation history (inbox, document-viewer, settings, insights)
- Display modes (overlay vs. shrink)
- Panel width and open/close state
- Artifact generation state

**Feature Flags:**
- Toggle experimental features on/off
- Reusable comments bank
- Auto-save functionality

**User Data Persistence:**
- Layered data model (base document + user state)
- LocalStorage integration for comments, grades, and annotations
- Import/export functionality for user state

### Key Features

#### 1. **Similarity Detection**
- Highlight system showing potential matches
- Match cards with source information (Internet, Submitted Works, Publications)
- Bidirectional sync between highlights and match cards
- Color coding for visual distinction
- Show/hide similarity highlights toggle

#### 2. **AI Chat Assistant**
- Global chat panel available on all pages
- Context-aware responses based on current screen
- Screen-specific conversation history
- Integration with Google Gemini API (with mock fallback)
- Express proxy server for API security (`server/index.js`)
- Automatic model selection (prefers Flash models)
- Streaming support with fallback handling

#### 3. **Feedback System**
- Text selection with floating action bar
- Comment creation with reusable comment suggestions
- QuickMark annotations
- Strikethrough deletion with confirmation popup
- Point annotations with locator dots and connector lines
- Floating comment cards
- Auto-save functionality

#### 4. **Grading & Rubrics**
- Rubric creator with multiple types (weighted, qualitative, custom, grading-form)
- Grid-based rubric editing
- Criterion and scale management
- Drag-and-drop reordering
- Import/export rubrics as JSON
- Ranged scoring and equal weights options

#### 5. **Responsive Layout**
- Dynamic sidebar toggle
- Chat panel with overlay and shrink modes
- Resizable chat panel (300-800px)
- Mobile-friendly submission table

### Document Data Structure

Documents are stored as JSON files in `public/data/documents/` with:
- `id`, `title`, `author`, `similarity`, `pages[]`
- `highlights[]` - text selections with match card associations
- `matchCards[]` - similarity sources with match instances and metadata

User-generated content (comments, grades, annotations) is stored separately in localStorage and merged at runtime.

### Custom Hooks

**Navigation & Sync:**
- `useNavigation` - Centralized navigation between matches and highlights
- `useMatchInteraction` - Handles match card interactions and color assignments
- `useCommentHighlights` - Manages comment highlight rendering

**User Interaction:**
- `useTextSelection` - Text selection handling for feedback
- `useStrikethroughDeletion` - Strikethrough deletion workflow
- `useAutoSave` - Auto-save user state with debouncing

**UI Utilities:**
- `usePageTitle` - Dynamic page title management
- `useToast` - Toast notification system
- `useResponsiveLayout` - Responsive layout calculations
- `useFeatureFlag` - Check if experimental features are enabled

### Component Architecture

**Document Viewer Components:**
- `DocumentHeader` - Title, author, and toolbar
- `PrimaryTabNavigation` - Tab switcher (Similarity, AI Writing, Flags, Feedback, Grading)
- `DocumentContent` - Page rendering with zoom controls
- `DocumentSidebar` - Match cards, feedback panel, grading panel
- `SidebarToggleButton` - Collapse/expand sidebar

**Chat Components:**
- `GlobalChatPanel` - Universal chat interface with screen context
- `ChatButton` - Toggle chat panel (deprecated in favor of global panel)
- `ChatbotPanel` - Legacy chat implementation

**Feedback Components:**
- `CommentCard` - Individual comment display and editing
- `FloatingCommentCards` - Positioned comment cards in document
- `FloatingActionBar` - Action menu for selected text
- `StrikethroughDeletePopup` - Confirmation dialog for deletions
- `FeedbackPanel` - Sidebar panel for managing comments

**Annotation Components:**
- `AnnotationSystem` - Orchestrates point annotations
- `LocatorDot` - Visual marker for point annotations
- `ConnectorLine` - Line connecting dot to annotation text
- `TextAnnotation` - Text content of annotation
- `TextControls` - Annotation editing controls

**Rubric Components:**
- `RubricGrid` - Grid layout for criterion × scale matrix
- `RubricCell` - Individual cell with description editing
- `RubricControls` - Add/remove rows and columns
- `RubricToolbar` - Save, reset, import/export actions
- `RubricTypeSelector` - Choose rubric type
- `LinearRubricEditor` - Alternative single-column rubric layout

**Settings Components:**
- `FeatureFlagsModal` - Toggle experimental features
- `PrototypeControls` - Debug panel with feature flags and data management
- `DataManagementModal` - Import/export user data

### Testing

- Jest + React Testing Library
- Tests for highlight synchronization, navigation, and store actions
- Mock utilities in `src/test-utils/` for document rendering
- Focus on critical user interactions and state management

### Data Flow Examples

**Similarity Navigation:**
1. User clicks highlight → `AnnotationSpan` updates navigation state
2. `useNavigation` coordinates state change
3. Match card scrolls into view via DOM ref
4. Color coding updates across components

**Comment Creation:**
1. User selects text → `useTextSelection` captures range and position
2. User clicks "Add Comment" → `FloatingActionBar` triggers action
3. Comment created in store with position data
4. `useCommentHighlights` renders highlight in document
5. `FloatingCommentCards` positions comment card
6. `useAutoSave` persists to localStorage

**Chat Interaction:**
1. User opens chat → `GlobalChatPanel` loads screen context
2. User sends message → POST to Express proxy at `/api/chat`
3. Proxy forwards to Gemini API with auto-selected model
4. Streaming response rendered in chat panel
5. Conversation saved to localStorage per screen

### Backend (Express Proxy)

The `server/index.js` file provides:
- Gemini API proxy to keep API keys secure
- Automatic model selection via ListModels (prefers Flash 2.5 > 2.0 > 1.5)
- Streaming support with fallback to non-streaming
- Mock mode when GEMINI_API_KEY is not set
- Structured logging with request IDs

### Validation & Type Safety

The application includes comprehensive validation:
- `src/utils/validation.ts` - Runtime validation helpers
- TypeScript for compile-time type checking
- Validated inputs for document IDs, folder structure, and user data
- Safe JSON parsing with type guards

### Persistence & Data Management

**LocalStorage Keys:**
- `ithenticate-user-state-{documentId}` - Per-document user state
- `ithenticate-rubrics` - All saved rubrics
- `ithenticate-feature-flags` - Feature flag settings
- `ithenticate-chat-history` - Chat conversations per screen
- `ithenticate-reusable-comments` - Comment suggestion bank

**Import/Export:**
- User state can be exported as JSON for backup
- Rubrics can be imported/exported for sharing
- Reset to default functionality for documents