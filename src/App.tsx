import { useEffect } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import InboxPage from "./pages/InboxPage";
import DocumentViewer from "./pages/DocumentViewer";
import MockDataBuilder from "./pages/MockDataBuilder";
import MockUrlPage from "./pages/MockUrlPage";
import RubricListPage from "./pages/RubricListPage";
import RubricCreatorPage from "./pages/RubricCreatorPage";
import RubricPreviewPage from "./pages/RubricPreviewPage";
import InsightsPage from "./pages/InsightsPage";
import SettingsPage from "./pages/SettingsPage";
import { useStore } from './store';
import { useAssignColors } from './hooks/useMatchInteraction';
import ErrorBoundary from './components/error/ErrorBoundary';
import { DocumentErrorFallback } from './components/error/DocumentErrorFallback';

function App() {
  const matchCards = useStore((s) => s.matchCards);
  const assignColors = useAssignColors();

  useEffect(() => {
    if (matchCards.length > 0) {
      assignColors(matchCards.map((c) => c.id));
    }
  }, [matchCards, assignColors]);

  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('Global error boundary caught:', error, errorInfo);
      // In a real app, you'd send this to an error reporting service
    }}>
      <Router basename="/base-prototype">
        <Routes>
          <Route path="/" element={<InboxPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/data/documents/:id" element={
            <ErrorBoundary 
              fallback={DocumentErrorFallback}
              onError={(error, errorInfo) => {
                console.error('Document viewer error:', error, errorInfo);
              }}
            >
              <DocumentViewer />
            </ErrorBoundary>
          } />
          <Route path="/mock-data-builder" element={<MockDataBuilder />} />
          <Route path="/mock-url/:encodedUrl" element={<MockUrlPage />} />
          <Route path="/rubrics" element={<RubricListPage />} />
          <Route path="/rubrics/create" element={<RubricCreatorPage />} />
          <Route path="/rubrics/edit/:id" element={<RubricCreatorPage />} />
          <Route path="/rubrics/preview/:id" element={<RubricPreviewPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
