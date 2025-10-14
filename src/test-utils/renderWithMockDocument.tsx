import { render } from "@testing-library/react";
import DocumentViewer from "../pages/DocumentViewer";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useStore } from "../store";

export function renderWithMockDocument(mockId: string) {
  useStore.setState({}); // clear existing state if needed

  return render(
    <MemoryRouter initialEntries={[`/data/documents/${mockId}`]}>
      <Routes>
        <Route path="/data/documents/:id" element={<DocumentViewer />} />
      </Routes>
    </MemoryRouter>
  );
}