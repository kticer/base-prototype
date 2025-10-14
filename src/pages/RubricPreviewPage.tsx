import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useStore } from "../store";
import { RubricGrid } from "../components/rubric/RubricGrid";
import { LinearRubricEditor } from "../components/rubric/LinearRubricEditor";

export default function RubricPreviewPage() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const view = (search.get('view') as 'grid' | 'list') || 'grid';
  const { currentRubric, loadRubrics, loadRubric } = useStore();

  useEffect(() => {
    loadRubrics();
  }, [loadRubrics]);

  useEffect(() => {
    if (id) loadRubric(id);
  }, [id, loadRubric]);

  if (!currentRubric) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  // Read-only preview: render without headers/toolbars
  return (
    <div className="min-h-screen bg-white p-4">
      {view === 'grid' ? (
        <RubricGrid />
      ) : (
        <LinearRubricEditor type={currentRubric.type} />
      )}
    </div>
  );
}

