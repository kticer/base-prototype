import { useState } from 'react';

export type Submission = {
  id: string;
  title: string;
  author: string;
  similarity: number | number[] | null;
  aiWriting?: number | number[] | null;
  flags?: number; // 0, 1, or 2
  viewedAt?: string | null; // ISO string or null
  grade?: string | number | null; // if present, show grade; else show pencil
  submittedAt: string;
};

type SubmissionTableProps = {
  items: Submission[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  areAllSelected: boolean;
  onOpen: (id: string) => void;
  onOpenGrading: (id: string) => void;
  sortKey: 'student' | 'title' | 'submitted' | 'grade' | 'similarity' | 'aiWriting' | 'flags' | 'viewed';
  sortDir: 'asc' | 'desc';
  onSortChange: (key: SubmissionTableProps['sortKey']) => void;
};

export default function SubmissionTable({
  items,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  areAllSelected,
  onOpen,
  onOpenGrading,
  sortKey,
  sortDir,
  onSortChange,
}: SubmissionTableProps) {
  const SortIndicator = ({ active }: { active: boolean }) => (
    <span className={`ml-1 text-xs ${active ? 'text-gray-700' : 'text-gray-300'}`}>
      {active ? (sortDir === 'asc' ? '▲' : '▼') : '▲'}
    </span>
  );

  const thBtn = 'inline-flex items-center select-none hover:text-gray-900';

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-visible w-full">
      <table className="min-w-full text-sm table-fixed">
        <thead className="bg-gray-100 text-gray-800 text-sm font-medium">
          <tr>
            <th className="w-10 px-4">
              <input type="checkbox" checked={areAllSelected} onChange={onToggleSelectAll} />
            </th>
            <th className="text-left py-2.5 px-4 font-semibold w-2/5">
              <button className={thBtn} onClick={() => onSortChange('student')}>
                Student / Title <SortIndicator active={sortKey === 'student'} />
              </button>
            </th>
            <th className="text-left py-2.5 px-4 font-semibold">
              <button className={thBtn} onClick={() => onSortChange('submitted')}>
                Submitted <SortIndicator active={sortKey === 'submitted'} />
              </button>
            </th>
            <th className="text-left py-2.5 px-4 font-semibold">
              <button className={thBtn} onClick={() => onSortChange('grade')}>
                Grade <SortIndicator active={sortKey === 'grade'} />
              </button>
            </th>
            <th className="text-left py-2.5 px-4 font-semibold">
              <button className={thBtn} onClick={() => onSortChange('similarity')}>
                Similarity <SortIndicator active={sortKey === 'similarity'} />
              </button>
            </th>
            <th className="text-left py-2.5 px-4 font-semibold">
              <button className={thBtn} onClick={() => onSortChange('aiWriting')}>
                AI Writing <SortIndicator active={sortKey === 'aiWriting'} />
              </button>
            </th>
            <th className="text-left py-2.5 px-4 font-semibold">
              <button className={thBtn} onClick={() => onSortChange('flags')}>
                Flags <SortIndicator active={sortKey === 'flags'} />
              </button>
            </th>
            <th className="text-left py-2.5 px-4 font-semibold">
              <button className={thBtn} onClick={() => onSortChange('viewed')}>
                Viewed <SortIndicator active={sortKey === 'viewed'} />
              </button>
            </th>
            <th className="w-12 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <SubmissionRow
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onOpen={() => onOpen(item.id)}
              onOpenGrading={() => onOpenGrading(item.id)}
              onToggleSelect={() => onToggleSelect(item.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubmissionRow({
  item,
  selected,
  onOpen,
  onOpenGrading,
  onToggleSelect,
}: {
  item: Submission;
  selected: boolean;
  onOpen: () => void;
  onOpenGrading: () => void;
  onToggleSelect: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getPercentBadges = (value: number | number[] | null, fallbackLabel = '—') => {
    if (value === null || typeof value === 'undefined') {
      return <span className="text-gray-400">—</span>;
    }
    const vals = Array.isArray(value) ? value : [value];
    return (
      <div className="flex flex-wrap gap-1">
        {vals.map((v, idx) => {
          const n = Number(v);
          const invalid = Number.isNaN(n);
          let color = 'bg-blue-500';
          if (!invalid) {
            if (n >= 41) color = 'bg-red-500';
            else if (n >= 21) color = 'bg-yellow-700';
          }
          return (
            <span key={idx} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${color}`}>
              {invalid ? fallbackLabel : `${n}%`}
            </span>
          );
        })}
      </div>
    );
  };

  const formatSubmitted = (iso?: string) => {
    if (!iso) return <span className="text-gray-400">—</span>;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return <span className="text-gray-400">—</span>;
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const dateStr = `${month}, ${day}, ${year}`;
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return (
      <div className="leading-tight">
        <div>{dateStr}</div>
        <div className="text-gray-500 text-xs">{timeStr}</div>
      </div>
    );
  };

  const formatViewed = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const dateStr = `${month}, ${day}, ${year}`;
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return (
      <div className="leading-tight text-gray-700">
        <div>{dateStr}</div>
        <div className="text-gray-500 text-xs">{timeStr}</div>
      </div>
    );
  };

  return (
    <tr className="hover:bg-gray-100 border-b last:border-0">
      <td className="py-3 px-4 text-gray-800 text-sm">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
        />
      </td>
      <td className="py-3 px-4 text-gray-800 text-sm">
        <div className="font-medium text-gray-900 truncate" title={item.author}>{item.author}</div>
        <button
          className="text-blue-600 hover:underline truncate"
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          title={item.title}
        >
          {item.title}
        </button>
      </td>
      <td className="py-3 px-4 text-gray-800 text-sm">{formatSubmitted(item.submittedAt)}</td>
      <td className="py-3 px-4 text-gray-800 text-sm">
        {item.grade === undefined || item.grade === null ? (
          <button
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
            onClick={(e) => { e.stopPropagation(); onOpenGrading(); }}
            title="Open in Grading"
          >
            <span role="img" aria-label="edit">✏️</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 font-medium text-gray-900">{String(item.grade)}</span>
        )}
      </td>
      <td className="py-3 px-4 text-gray-800 text-sm">{getPercentBadges(item.similarity)}</td>
      <td className="py-3 px-4 text-gray-800 text-sm">{getPercentBadges(item.aiWriting ?? null)}</td>
      <td className="py-3 px-4 text-gray-800 text-sm">
        <span className="inline-flex items-center gap-1 text-gray-700">
          <span role="img" aria-label="flag">🚩</span> {item.flags ?? 0}
        </span>
      </td>
      <td className="py-3 px-4 text-gray-800 text-sm">{formatViewed(item.viewedAt)}</td>
      <td className="relative py-3 px-4 text-gray-800 text-sm flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500"
        >
          ⋯
        </button>
        {menuOpen && (
          <div
            className="absolute right-4 top-full mt-2 w-32 bg-white border border-gray-200 shadow-md rounded z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { onOpen(); setMenuOpen(false); }}>
              📄 Open report
            </button>
            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              📋 Copy Submission
            </button>
            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              🔄 Resubmit file
            </button>
            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              🗓️ Grant extension
            </button>
            <div className="my-1 border-t border-gray-200" />
            <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              🗑️ Request deletion
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
