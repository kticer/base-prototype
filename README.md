# iThenticate Prototype

A plagiarism detection application built with React, TypeScript, and Vite that simulates document similarity analysis with real-time highlighting and matching features.

## Features

- **Document Similarity Analysis**: Upload and analyze documents for potential plagiarism
- **Interactive Highlighting**: Click on highlighted text to view corresponding matches
- **Match Cards**: Display similarity information from Internet, Submitted Works, and Publications
- **Bidirectional Synchronization**: Highlights and match cards are synchronized in real-time
- **Color-Coded Sources**: Each match source gets a unique color for visual distinction
- **Hierarchical Document Management**: Organize documents in folders within an inbox interface

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Architecture

### Core Technologies
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Zustand** for global state management
- **Jest** + React Testing Library for testing

### Application Structure

```
src/
├── components/          # React components
│   ├── layout/         # Navigation and page layout
│   ├── interactive/    # Match cards, highlights, tables
│   └── ui/            # Reusable UI components
├── hooks/              # Custom React hooks
├── pages/              # Page components and routing
├── store.ts           # Zustand global state
├── test-utils/        # Testing utilities
└── types/             # TypeScript type definitions

public/
└── data/
    └── documents/     # Document JSON files
```

### Key Pages

- **`/`** - Inbox dashboard with document folders and similarity reports
- **`/insights`** - Insights dashboard with submission metrics
- **`/settings`** - Assignment settings (prototype-only, local storage)
- **`/data/documents/:id`** - Document viewer with highlights and match analysis
- **`/mock-data-builder`** - Tool for creating test documents
- **`/mock-url/:encodedUrl`** - URL-based document viewer

### Chatbot (Prototype)

- Access the Chatbot via the "Chat" primary tab in the Document Viewer.
- The chatbot uses a mock Gemini adapter (`src/services/geminiClient.ts`) that crafts responses from document context (title, author, word count, similarity, top sources).
- Replace the mock adapter with a real Gemini API call as needed.

### State Management

Uses Zustand for centralized state management including:
- Selected matches and highlights
- Excluded sources
- Navigation state (source IDs, match indices)
- UI element references

### Document Data Structure

Documents are stored as JSON files with:
- Basic metadata (id, title, author, pages)
- **Highlights**: Text selections with associated match cards
- **Match Cards**: Similarity sources with match instances and metadata

### Custom Hooks

- **`useMatchNavigation`** - Centralized navigation between matches and highlights
- **`useHighlightSync`** - Synchronizes highlight selection with match cards
- **`useMatchInteraction`** - Handles match card interactions and color assignments
- **`usePageTitle`** - Dynamic page title management

## Data Flow

1. User selects a highlight in the document
2. `useHighlightSync` triggers navigation state update
3. `useMatchNavigation` coordinates the state change
4. Corresponding match card scrolls into view
5. Color coding and selection states update across all components
6. Navigation source tracking prevents infinite update loops

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Quality Assurance
npm test            # Run Jest tests
npm run lint        # Run ESLint
```

## Testing

The application uses Jest and React Testing Library with a focus on:
- Highlight synchronization behavior
- Component interaction patterns
- Mock utilities for document rendering

## Contributing

1. Follow the existing code style and patterns
2. Run tests before submitting changes
3. Use the mock data builder for creating test documents
4. Ensure highlight-match card synchronization works correctly

## License

This is a prototype application for demonstration purposes.
