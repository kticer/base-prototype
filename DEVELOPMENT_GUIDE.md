# Development Guide

This guide outlines best practices, patterns, and workflows for developing new features in the iThenticate prototype application.

## Table of Contents

- [Development Workflow](#development-workflow)
- [Architecture Patterns](#architecture-patterns)
- [Feature Development Process](#feature-development-process)
- [State Management](#state-management)
- [Component Development](#component-development)
- [Custom Hooks](#custom-hooks)
- [Data Handling](#data-handling)
- [Testing Strategy](#testing-strategy)
- [Code Style Guidelines](#code-style-guidelines)
- [Performance Considerations](#performance-considerations)

## Development Workflow

### 1. Setup and Environment

```bash
# Clone and setup
git clone <repository-url>
cd ithenticate-prototype
npm install

# Start development
npm run dev

# Run tests in watch mode
npm test -- --watch
```

### 2. Branch Strategy

- Create feature branches from `main`
- Use descriptive branch names: `feature/highlight-search`, `fix/match-card-sync`
- Keep branches focused on single features or fixes

### 3. Development Cycle

1. **Plan**: Review requirements and identify affected components
2. **Design**: Consider state management and component architecture
3. **Implement**: Follow established patterns and conventions
4. **Test**: Write unit tests and manual testing
5. **Review**: Run linting and type checking
6. **Deploy**: Merge after approval

## Architecture Patterns

### Component Architecture

The application follows a hierarchical component structure:

```
Pages (Route handlers)
├── Layout Components (Navigation, containers)
├── Feature Components (Match cards, highlights)
└── UI Components (Buttons, inputs, modals)
```

### State Flow Pattern

```
User Interaction → Custom Hook → Zustand Store → Component Re-render
```

### Naming Conventions

- **Components**: PascalCase (`MatchCard`, `DocumentViewer`)
- **Hooks**: camelCase with `use` prefix (`useMatchNavigation`)
- **Files**: kebab-case for non-components (`match-utils.ts`)
- **Types**: PascalCase with descriptive names (`MatchCardData`)

## Feature Development Process

### 1. Requirements Analysis

Before starting any feature:
- Identify user needs and acceptance criteria
- Determine which components will be affected
- Consider impact on existing state management
- Plan for backwards compatibility

### 2. Design Phase

```typescript
// Example: Planning a new search feature
interface SearchFeatureDesign {
  components: ['SearchBar', 'SearchResults', 'SearchFilters'];
  state: {
    searchQuery: string;
    searchResults: SearchResult[];
    isSearching: boolean;
  };
  hooks: ['useSearch', 'useSearchFilters'];
  integration: ['DocumentViewer', 'MatchCard'];
}
```

### 3. Implementation Order

1. **Types**: Define TypeScript interfaces first
2. **State**: Add to Zustand store if needed
3. **Hooks**: Create custom hooks for logic
4. **Components**: Build UI components
5. **Integration**: Connect to existing features
6. **Tests**: Write comprehensive tests

## State Management

### Zustand Store Structure

```typescript
// store.ts pattern
interface AppState {
  // Feature-specific state
  search: SearchState;
  highlights: HighlightState;
  matches: MatchState;
  
  // Actions grouped by feature
  searchActions: SearchActions;
  highlightActions: HighlightActions;
  matchActions: MatchActions;
}
```

### State Management Guidelines

1. **Centralize Related State**: Group related state together
2. **Immutable Updates**: Always create new objects/arrays
3. **Selective Subscriptions**: Use selectors to prevent unnecessary re-renders
4. **Action Grouping**: Group related actions together

```typescript
// Good: Selective subscription
const selectedMatch = useStore(state => state.matches.selectedMatch);

// Bad: Full state subscription
const state = useStore();
const selectedMatch = state.matches.selectedMatch;
```

### When to Use Local vs Global State

- **Local State**: Component-specific UI state, temporary values
- **Global State**: Cross-component data, persistent user preferences, navigation state

## Component Development

### Component Structure Template

```typescript
// ComponentName.tsx
import React from 'react';
import { useStore } from '../store';
import { ComponentProps } from '../types';

interface ComponentNameProps {
  // Props interface
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  // Props destructuring
}) => {
  // 1. Hooks (state, effects, custom hooks)
  const { data, actions } = useStore(selector);
  
  // 2. Event handlers
  const handleClick = () => {
    // Handle events
  };
  
  // 3. Computed values
  const isActive = data.status === 'active';
  
  // 4. Render
  return (
    <div className="component-name">
      {/* JSX */}
    </div>
  );
};
```

### Component Guidelines

1. **Single Responsibility**: Each component should have one clear purpose
2. **Prop Validation**: Use TypeScript interfaces for all props
3. **Accessibility**: Include proper ARIA attributes and keyboard navigation
4. **Performance**: Use React.memo for expensive components
5. **Error Boundaries**: Wrap components that might fail

### Styling Conventions

- Use CSS modules or styled-components for component-specific styles
- Follow BEM methodology for class names
- Use CSS custom properties for theming
- Responsive design with mobile-first approach

## Custom Hooks

### Hook Development Pattern

```typescript
// useFeatureName.ts
import { useCallback, useEffect, useMemo } from 'react';
import { useStore } from '../store';

export const useFeatureName = (options?: FeatureOptions) => {
  // 1. State subscriptions
  const { data, actions } = useStore(selector);
  
  // 2. Memoized values
  const processedData = useMemo(() => {
    return processData(data);
  }, [data]);
  
  // 3. Callback functions
  const handleAction = useCallback((param: string) => {
    actions.doSomething(param);
  }, [actions]);
  
  // 4. Effects
  useEffect(() => {
    // Setup/cleanup
  }, []);
  
  // 5. Return interface
  return {
    data: processedData,
    isLoading: data.isLoading,
    handleAction,
  };
};
```

### Hook Guidelines

1. **Return Object**: Always return an object with named properties
2. **Memoization**: Use useMemo and useCallback to prevent unnecessary re-renders
3. **Cleanup**: Always cleanup subscriptions and timers
4. **Error Handling**: Include error states and handling
5. **TypeScript**: Provide full type safety

## Data Handling

### Document Data Structure

```typescript
// Types for document data
interface Document {
  id: string;
  title: string;
  author: string;
  pages: Page[];
  highlights: Highlight[];
  matchCards: MatchCard[];
  metadata: DocumentMetadata;
}

interface Highlight {
  id: string;
  text: string;
  pageId: string;
  position: TextPosition;
  matchCardIds: string[];
  color: string;
}
```

### Data Loading Patterns

```typescript
// useDocumentData.ts
export const useDocumentData = (documentId: string) => {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true);
        const data = await fetch(`/data/documents/${documentId}.json`);
        const document = await data.json();
        setDocument(document);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDocument();
  }, [documentId]);
  
  return { document, isLoading, error };
};
```

### Data Validation

- Validate data structure on load
- Handle missing or malformed data gracefully
- Provide fallback values for optional fields
- Log validation errors for debugging

## Testing Strategy

### Test Structure

```typescript
// ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';
import { createMockStore } from '../test-utils';

describe('ComponentName', () => {
  it('should render correctly', () => {
    const mockStore = createMockStore();
    render(<ComponentName />, { wrapper: mockStore });
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('should handle user interactions', () => {
    const mockStore = createMockStore();
    const mockAction = jest.fn();
    
    render(<ComponentName onAction={mockAction} />, { wrapper: mockStore });
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockAction).toHaveBeenCalled();
  });
});
```

### Testing Guidelines

1. **Test Behavior**: Focus on what the component does, not how it does it
2. **User Perspective**: Write tests from the user's perspective
3. **Mock External Dependencies**: Mock API calls, stores, and complex dependencies
4. **Edge Cases**: Test error states, empty data, and boundary conditions
5. **Integration Tests**: Test component interactions and data flow

### Test Coverage Areas

- **Unit Tests**: Individual components and hooks
- **Integration Tests**: Component interactions and data flow
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Rendering performance and memory usage

## Code Style Guidelines

### TypeScript Best Practices

```typescript
// Use strict types
interface StrictProps {
  id: string;
  count: number;
  isActive: boolean;
  onUpdate: (id: string, data: UpdateData) => void;
}

// Avoid any, use unknown instead
const processData = (data: unknown) => {
  if (typeof data === 'object' && data !== null) {
    // Type guard logic
  }
};

// Use enums for constants
enum MatchType {
  INTERNET = 'internet',
  SUBMITTED_WORKS = 'submitted_works',
  PUBLICATIONS = 'publications'
}
```

### Code Organization

- Import order: React, third-party, local modules, types
- Export components as named exports
- Use barrel exports for related modules
- Keep files under 200 lines when possible

### Performance Optimization

```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callback functions
const handleClick = useCallback((id: string) => {
  onUpdate(id, newData);
}, [onUpdate, newData]);

// Use React.memo for pure components
export const PureComponent = React.memo(({ data }: Props) => {
  return <div>{data.name}</div>;
});
```

## Performance Considerations

### Optimization Strategies

1. **Bundle Splitting**: Use dynamic imports for route-based code splitting
2. **Image Optimization**: Use appropriate formats and lazy loading
3. **State Updates**: Batch updates and avoid unnecessary re-renders
4. **Memory Management**: Clean up subscriptions and remove event listeners

### Monitoring Performance

- Use React DevTools Profiler
- Monitor bundle size with webpack-bundle-analyzer
- Track render performance in development
- Set up performance budgets for CI/CD

## Common Patterns

### Highlight-Match Synchronization

```typescript
// Pattern for bidirectional sync
export const useHighlightSync = () => {
  const { selectedMatch, selectedHighlight } = useStore(state => ({
    selectedMatch: state.matches.selectedMatch,
    selectedHighlight: state.highlights.selectedHighlight
  }));
  
  const syncHighlightToMatch = useCallback((highlightId: string) => {
    const matchIds = getMatchIdsForHighlight(highlightId);
    if (matchIds.length > 0) {
      updateSelectedMatch(matchIds[0]);
    }
  }, []);
  
  return { syncHighlightToMatch };
};
```

### Color Management

```typescript
// Consistent color assignment
export const useColorAssignment = () => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
  
  const getColorForSource = useCallback((sourceId: string) => {
    const index = sourceId.charCodeAt(0) % colors.length;
    return colors[index];
  }, [colors]);
  
  return { getColorForSource };
};
```

## Debugging Guidelines

### Common Issues

1. **Infinite Loops**: Check useEffect dependencies
2. **State Not Updating**: Verify immutable updates
3. **Performance Issues**: Profile with React DevTools
4. **Type Errors**: Use type guards and proper interfaces

### Debugging Tools

- React DevTools for component inspection
- Zustand DevTools for state management
- Browser DevTools for network and performance
- TypeScript compiler for type checking

## Release Checklist

Before merging new features:

- [ ] All tests pass
- [ ] TypeScript compilation successful
- [ ] ESLint checks pass
- [ ] Manual testing completed
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Accessibility verified
- [ ] Cross-browser testing done

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Testing Library Docs](https://testing-library.com/docs/)
- [Vite Documentation](https://vitejs.dev/)

---

This guide should be updated as the application evolves and new patterns emerge. Always prioritize code quality, maintainability, and user experience when developing new features.