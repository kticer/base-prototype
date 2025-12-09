# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build and Development:**
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (runs TypeScript check + Vite build)
- `npm run preview` - Preview production build locally

**Testing and Quality:**
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint on all files

## Architecture Overview

This is an iThenticate prototype - an educational document analysis and grading application built with React + TypeScript + Vite. The application simulates document similarity analysis and includes comprehensive feedback and grading tools for educators.

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
- Percentage displayed in tab badges and submission table

#### 2. **AI Writing Analysis**
- Character-level coverage calculation
- Highlighted sections showing AI-generated content
- Percentage calculation: `(AI chars / total chars) * 100`
- Displayed in tab badges and submission table
- Dedicated AI Writing tab with detailed report
- Margin comments hidden on AI Writing tab

#### 3. **Feedback System**
- Text selection with floating action bar
- Comment creation with reusable comment suggestions
- QuickMark annotations
- Strikethrough deletion with confirmation popup
- Point annotations with locator dots and connector lines
- Floating comment cards (hidden on AI Writing tab)
- Auto-save functionality

#### 4. **Grading & Rubrics**
- Rubric creator with multiple types (weighted, qualitative, custom, grading-form)
- Grid-based rubric editing
- Criterion and scale management
- Drag-and-drop reordering
- Import/export rubrics as JSON
- Ranged scoring and equal weights options

#### 5. **Submission Management**
- Sortable table with 8 columns (Student/Title, Submitted, Grade, Similarity, AI Writing, Flags, Viewed, More)
- Processing states with animated spinners
- Status badges for all metrics
- Extension labels for deadline extensions
- Click-to-open document viewer
- Column-specific sort functionality

#### 6. **Design System**
- Figma-integrated design tokens
- Typography scale (Noto Sans, Lexend Deca)
- Color tokens (surface variants, on-surface hierarchy, secondary)
- Consistent spacing and sizing
- Hover states and transitions
- Icon system with standardized sizing

#### 7. **Responsive Layout**
- Dynamic sidebar toggle
- Fixed column widths in submission table (1408px max-width)
- Mobile-friendly breakpoints

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
- `DocumentHeader` - Logo, submission navigation (prev/next), action buttons (download, settings, details, help)
- `HeaderIcons` - Centralized icon components (DownloadIcon, SettingsIcon, HelpIcon, NavigationIcons, etc.)
- `PrimaryTabNavigation` - Tab switcher with dynamic percentage badges (Similarity %, AI Writing %, Flags count)
- `DocumentContent` - Page rendering with zoom controls and surface-dark background
- `DocumentSidebar` - Match cards, feedback panel, grading panel, AI writing report
- `SidebarToggleButton` - Collapse/expand sidebar

**Inbox/Submission List Components:**
- `InboxNavBar` - Header with logo, title/subtitle dropdown, and action buttons (Edit Settings, Tools, Help)
- `InboxTabs` - Navigation tabs (Submission list, Insights) with action buttons (Search, Rerun Report, Download, Resync Grades)
- `SubmissionTableNew` - Redesigned table with exact column widths (Student/Title, Submitted, Grade, Similarity, AI Writing, Flags, Viewed, More)
- `StatusBadges` - Reusable badge components:
  - `GradeBadge` - Blue rounded badge for scores
  - `NotGraded` - Placeholder dash for ungraded
  - `Processing` - Animated spinner with "Processing" text
  - `NotSubmitted` - Placeholder for missing data
  - `SimilarityBadge` - Percentage badge
  - `AIWritingBadge` - Percentage with info icon
  - `FlagsBadge` - Count with flag icon
  - `ViewedCheck` - Green checkmark
  - `ExtensionLabel` - Orange text for extensions
  - `IntegrityBadge` - Red warning badge
  - `MoreMenu` - Three-dot menu button

**Feedback Components:**
- `CommentCard` - Individual comment display and editing
- `FloatingCommentCards` - Positioned comment cards in document (hidden on AI Writing tab)
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
- `ithenticate-reusable-comments` - Comment suggestion bank

**Import/Export:**
- User state can be exported as JSON for backup
- Rubrics can be imported/exported for sharing
- Reset to default functionality for documents

### Design System

The application uses a Figma-integrated design system defined in `tailwind.config.js`:

**Typography:**
- Font families: Noto Sans (body), Lexend Deca (headings)
- Size scale: headline-small (24px), title-large (20px), body-large (16px), body-medium (14px), label-small (12px)
- Line heights and font weights defined per size

**Colors:**
- `surface`: Base white (#ffffff)
- `surface-variant-1`: Light background (#f9f9f9)
- `surface-variant-2`: Lighter background (#f5f5f5)
- `surface-dark`: Document background (#e5e5e5)
- `surface-on-surface`: Primary text (#191919)
- `surface-on-surface-variant-1`: Secondary text (#2d2d2d)
- `surface-on-surface-variant-2`: Tertiary text (#636363)
- `surface-outline`: Dividers and borders (#cdcdcd)
- `surface-outline-dark`: Darker borders (#b0b0b0)
- `secondary`: Interactive blue (#0095ff)

**Component Patterns:**
- Status badges use consistent padding (px-2 py-1), border-radius (rounded), and font styling
- Icons sized at w-5 h-5 (20px) or w-6 h-6 (24px)
- Hover states use bg-gray-50 or bg-black/5
- Transitions use transition-colors
- Active states use border bottom indicator with secondary color

### AI Writing Percentage Calculation

The AI Writing percentage is calculated dynamically from document data:

```typescript
// In DocumentViewer.tsx
const aiWritingPercentage = useMemo(() => {
  if (!doc || !doc.aiWritingHighlights || doc.aiWritingHighlights.length === 0) {
    return 0;
  }
  let totalChars = 0;
  doc.pages.forEach((page) => {
    totalChars += page.content.length;
  });
  let aiChars = 0;
  doc.aiWritingHighlights.forEach((hl) => {
    aiChars += (hl.endOffset - hl.startOffset);
  });
  return totalChars > 0 ? Math.round((aiChars / totalChars) * 100) : 0;
}, [doc]);
```

This ensures tab badges, sidebar reports, and submission table all show accurate percentages.