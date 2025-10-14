import { useState, Fragment } from "react";
import { useStore } from "../../store";

type ViewType = 'weighted' | 'qualitative' | 'custom' | 'grading-form';

interface LinearRubricEditorProps {
  type: ViewType;
}

export function LinearRubricEditor({ type }: LinearRubricEditorProps) {
  const {
    currentRubric,
    updateCriterion,
    moveCriterion,
    updateCriterionDescription,
    addCriterion,
    removeCriterion,
  } = useStore();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [openScales, setOpenScales] = useState<Set<string>>(new Set());
  const [openDescriptions, setOpenDescriptions] = useState<Record<string, Set<number>>>({});

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleScales = (id: string) => {
    setOpenScales((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleDescription = (criterionId: string, idx: number) => {
    setOpenDescriptions((prev) => {
      const current = new Set(prev[criterionId] || []);
      if (current.has(idx)) current.delete(idx); else current.add(idx);
      return { ...prev, [criterionId]: current };
    });
  };

  const criteria = currentRubric?.criteria || [];
  const isWeighted = type === 'weighted';

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isBefore = e.clientY < rect.top + rect.height / 2;
    setDropIndex(isBefore ? index : index + 1);
  };
  const handleDropAnywhere = () => {
    if (dragIndex === null || dropIndex === null) {
      setDragIndex(null);
      setDropIndex(null);
      return;
    }
    // Adjust target index for the removal shift
    const adjusted = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
    if (adjusted !== dragIndex) {
      moveCriterion(dragIndex, adjusted);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  if (!currentRubric) return null;

  return (
    <div className="w-full space-y-4" aria-label="Linear rubric editor">
      {/* Top drop indicator */}
      {dragIndex !== null && dropIndex === 0 && (
        <div className="h-0.5 bg-teal-600 rounded-full my-2" aria-hidden="true" />
      )}

      {criteria.map((c, ci) => {
        const descriptions = c.descriptions || [];
        const titles = c.scaleTitles || [];
        const scaleCount = descriptions.length;
        const isOpen = expanded.has(c.id);

        return (
          <Fragment key={c.id}>
          <div
            className="bg-white border border-gray-200 rounded-lg p-4 max-w-[860px] mx-auto"
            draggable
            onDragStart={() => handleDragStart(ci)}
            onDragOver={(e) => handleDragOverItem(e, ci)}
            onDrop={handleDropAnywhere}
          >
            {/* Row header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isOpen ? (
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600">Criterion Title</label>
                    <input
                      value={c.title}
                      onChange={(e) => updateCriterion(ci, { title: e.target.value })}
                      className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{c.title || 'Untitled criterion'}</div>
                    <button
                      className="mt-1 inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
                      onClick={() => toggleScales(c.id)}
                      aria-expanded={openScales.has(c.id)}
                      aria-controls={`criterion-${c.id}-scales`}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transform origin-center transition-transform ${openScales.has(c.id) ? 'rotate-0' : '-rotate-90'}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M6 6l4 4 4-4" clipRule="evenodd" />
                      </svg>
                      {scaleCount} {scaleCount === 1 ? 'scale' : 'scales'}
                    </button>
                    {scaleCount > 0 && openScales.has(c.id) && (
                      <ul id={`criterion-${c.id}-scales`} className="mt-2 space-y-2">
                        {descriptions.map((d, si) => {
                          const title = titles[si] ?? (currentRubric.scales[si]?.title || `Scale ${si + 1}`);
                          return (
                            <li key={si} className="text-sm text-gray-700">
                              <div className="font-medium text-gray-900">{title || `Scale ${si + 1}`}</div>
                              <div className="text-gray-700 line-clamp-2">
                                {d ? d : <span className="text-gray-400 italic">(no description)</span>}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <div className="ml-3 flex items-center gap-2">
                <button
                  className="px-2 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  onClick={() => ci > 0 && moveCriterion(ci, ci - 1)}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  className="px-2 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  onClick={() => ci < criteria.length - 1 && moveCriterion(ci, ci + 1)}
                  aria-label="Move down"
                >
                  ↓
                </button>
                {!isOpen && (
                  <button
                    className="px-2 py-1 text-sm text-teal-700 border border-teal-300 rounded hover:bg-teal-50"
                    onClick={() => toggleExpanded(c.id)}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Editing panel */}
            {isOpen && (
              <div id={`criterion-${c.id}-panel`} className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    className="text-teal-600 hover:text-teal-700 text-xs px-2 py-1 border border-teal-300 rounded hover:bg-teal-50"
                    onClick={() => addCriterion(ci)}
                    disabled={criteria.length >= 10}
                  >
                    + Add criterion here
                  </button>
                  <button
                    className="text-red-600 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                    onClick={() => removeCriterion(ci)}
                    disabled={criteria.length <= 1}
                  >
                    Delete
                  </button>
                </div>

                {/* Scale editor for this criterion */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">Scales ({scaleCount})</div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-teal-600 hover:text-teal-700 text-sm px-3 py-1 border border-teal-300 rounded hover:bg-teal-50"
                        onClick={() => {
                          const next = Math.min(7, scaleCount + 1);
                          const arr = [...descriptions];
                          const tarr = [...titles];
                          if (next > arr.length) {
                            arr.push('');
                            tarr.push(currentRubric.scales[arr.length - 1]?.title || `Scale ${arr.length}`);
                          }
                          updateCriterion(ci, { descriptions: arr, scaleTitles: tarr });
                        }}
                        disabled={scaleCount >= 7}
                      >
                        Add Scale
                      </button>
                      {ci > 0 && (
                        <button
                          className="text-gray-600 hover:text-gray-700 text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                          onClick={() => {
                            const prevCount = criteria[ci - 1]?.descriptions?.length || 0;
                            const next = Math.min(7, prevCount);
                            const arr = new Array(next).fill('');
                            const prevTitles = criteria[ci - 1]?.scaleTitles || [];
                            const tarr = new Array(next).fill(0).map((_, idx) => prevTitles[idx] ?? (currentRubric.scales[idx]?.title || `Scale ${idx + 1}`));
                            updateCriterion(ci, { descriptions: arr, scaleTitles: tarr });
                          }}
                        >
                          Use previous scales
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {descriptions.map((d, si) => (
                      <div key={si} className="border border-gray-200 rounded p-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600">Scale Title</label>
                            <input
                              type="text"
                              value={titles[si] ?? ''}
                              onChange={(e) => {
                                const tarr = [...titles];
                                tarr[si] = e.target.value;
                                updateCriterion(ci, { scaleTitles: tarr });
                              }}
                              className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder={`Scale ${si + 1}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">Description (max 500 chars)</label>
                            <textarea
                              value={d}
                              onChange={(e) => {
                                const value = (e.target.value || '').slice(0, 500);
                                updateCriterionDescription(ci, si, value);
                              }}
                              className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                              rows={3}
                            />
                            <div className="text-xs text-gray-500 mt-1">{Math.min(500, d?.length || 0)}/500</div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-end">
                          <button
                            className="text-red-600 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                            onClick={() => {
                              const arr = [...descriptions];
                              const tarr = [...titles];
                              arr.splice(si, 1);
                              if (tarr.length > si) tarr.splice(si, 1);
                              updateCriterion(ci, { descriptions: arr, scaleTitles: tarr });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {descriptions.length === 0 && (
                      <div className="text-xs text-gray-500">No scales yet. Click "Add Scale" to start.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Drop indicator after this item */}
          {dragIndex !== null && dropIndex === ci + 1 && (
            <div className="h-0.5 bg-teal-600 rounded-full my-2" aria-hidden="true" />
          )}
          </Fragment>
        );
      })}
      <div className="pt-2">
        <button
          className="text-teal-600 hover:text-teal-700 text-sm px-3 py-1 border border-teal-300 rounded hover:bg-teal-50"
          onClick={() => addCriterion(criteria.length - 1)}
          disabled={criteria.length >= 10}
        >
          + Add criterion to end
        </button>
        {criteria.length >= 10 && (
          <span className="ml-3 text-xs text-gray-500">Maximum 10 criteria reached</span>
        )}
      </div>
      {/* Handle drop at list end */}
      <div
        className="mt-2"
        onDragOver={(e) => { e.preventDefault(); setDropIndex(criteria.length); }}
        onDrop={handleDropAnywhere}
      />
    </div>
  );
}
