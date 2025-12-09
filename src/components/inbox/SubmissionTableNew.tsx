import { useState } from 'react';
import {
  GradeBadge,
  NotGraded,
  Processing,
  NotSubmitted,
  SimilarityBadge,
  AIWritingBadge,
  FlagsBadge,
  ViewedCheck,
  ExtensionLabel,
  MoreMenu,
} from './StatusBadges';

export type Submission = {
  id: string;
  title: string;
  author: string;
  similarity: number | null;
  aiWriting?: number | null;
  flags?: number;
  viewedAt?: string | null;
  grade?: string | number | null;
  submittedAt: string | null;
  status?: 'submitted' | 'processing' | 'not-submitted';
  extension?: number; // days
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

export default function SubmissionTableNew({
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
    <span className={`ml-1 ${active ? 'text-gray-900' : 'text-gray-400'}`}>
      {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const thBtn = 'inline-flex items-center select-none hover:text-gray-900 cursor-pointer';

  return (
    <div className="bg-white w-full">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr className="h-12">
            {/* Student / Title - 530px */}
            <th className="text-left px-4 py-3 font-sans font-semibold text-sm text-gray-700" style={{ width: '530px' }}>
              <button className={thBtn} onClick={() => onSortChange('student')}>
                Student / Title
                <SortIndicator active={sortKey === 'student'} />
              </button>
            </th>
            {/* Submitted - 160px */}
            <th className="text-left px-4 py-3 font-sans font-semibold text-sm text-gray-700" style={{ width: '160px' }}>
              <button className={thBtn} onClick={() => onSortChange('submitted')}>
                Submitted
                <SortIndicator active={sortKey === 'submitted'} />
              </button>
            </th>
            {/* Grade - 120px */}
            <th className="text-left px-4 py-3 font-sans font-semibold text-sm text-gray-700" style={{ width: '120px' }}>
              <button className={thBtn} onClick={() => onSortChange('grade')}>
                Grade
                <SortIndicator active={sortKey === 'grade'} />
              </button>
            </th>
            {/* Similarity - 160px */}
            <th className="text-left px-4 py-3 font-sans font-semibold text-sm text-gray-700" style={{ width: '160px' }}>
              <button className={thBtn} onClick={() => onSortChange('similarity')}>
                Similarity
                <SortIndicator active={sortKey === 'similarity'} />
              </button>
            </th>
            {/* AI Writing - 140px */}
            <th className="text-left px-4 py-3 font-sans font-semibold text-sm text-gray-700" style={{ width: '140px' }}>
              <button className={thBtn} onClick={() => onSortChange('aiWriting')}>
                AI Writing
                <SortIndicator active={sortKey === 'aiWriting'} />
              </button>
            </th>
            {/* Flags - 140px */}
            <th className="text-left px-4 py-3 font-sans font-semibold text-sm text-gray-700" style={{ width: '140px' }}>
              <button className={thBtn} onClick={() => onSortChange('flags')}>
                Flags
                <SortIndicator active={sortKey === 'flags'} />
              </button>
            </th>
            {/* Viewed - 90px */}
            <th className="text-left px-4 py-3 font-sans font-semibold text-sm text-gray-700" style={{ width: '90px' }}>
              <button className={thBtn} onClick={() => onSortChange('viewed')}>
                Viewed
                <SortIndicator active={sortKey === 'viewed'} />
              </button>
            </th>
            {/* More - 68px */}
            <th className="text-left px-4 py-3 font-sans font-semibold text-sm text-gray-700" style={{ width: '68px' }}>
              More
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <SubmissionRow
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              onOpen={() => onOpen(item.id)}
              onOpenGrading={() => onOpenGrading(item.id)}
              onToggleSelect={() => onToggleSelect(item.id)}
              isLast={idx === items.length - 1}
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
  isLast,
}: {
  item: Submission;
  selected: boolean;
  onOpen: () => void;
  onOpenGrading: () => void;
  onToggleSelect: () => void;
  isLast: boolean;
}) {
  const formatSubmitted = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return (
      <div className="text-sm">
        <div className="text-gray-900">{dateStr}</div>
        <div className="text-gray-500">{timeStr}</div>
      </div>
    );
  };

  const status = item.status || 'submitted';
  const isProcessing = status === 'processing';
  const isNotSubmitted = status === 'not-submitted';

  return (
    <tr
      className={`h-14 hover:bg-gray-50 cursor-pointer transition-colors ${!isLast ? 'border-b border-gray-200' : ''}`}
      onClick={onOpen}
    >
      {/* Student / Title */}
      <td className="px-4 py-3" style={{ width: '530px' }}>
        <div>
          <div className="font-sans font-semibold text-sm text-gray-900">{item.author}</div>
          <div className="font-sans text-sm text-gray-600 truncate">{item.title}</div>
        </div>
      </td>

      {/* Submitted */}
      <td className="px-4 py-3" style={{ width: '160px' }}>
        {isNotSubmitted ? (
          <NotSubmitted />
        ) : item.extension ? (
          <ExtensionLabel days={item.extension} />
        ) : (
          formatSubmitted(item.submittedAt)
        )}
      </td>

      {/* Grade */}
      <td className="px-4 py-3" style={{ width: '120px' }}>
        {isNotSubmitted ? (
          <NotSubmitted />
        ) : isProcessing ? (
          <NotGraded />
        ) : item.grade ? (
          <GradeBadge score={item.grade} />
        ) : (
          <NotGraded />
        )}
      </td>

      {/* Similarity */}
      <td className="px-4 py-3" style={{ width: '160px' }}>
        {isNotSubmitted ? (
          <NotSubmitted />
        ) : isProcessing ? (
          <Processing />
        ) : item.similarity !== null && item.similarity !== undefined ? (
          <SimilarityBadge percent={item.similarity} />
        ) : (
          <NotSubmitted />
        )}
      </td>

      {/* AI Writing */}
      <td className="px-4 py-3" style={{ width: '140px' }}>
        {isNotSubmitted ? (
          <NotSubmitted />
        ) : isProcessing ? (
          <Processing />
        ) : item.aiWriting !== null && item.aiWriting !== undefined ? (
          <AIWritingBadge percent={item.aiWriting} />
        ) : (
          <NotSubmitted />
        )}
      </td>

      {/* Flags */}
      <td className="px-4 py-3" style={{ width: '140px' }}>
        {isNotSubmitted ? (
          <NotSubmitted />
        ) : isProcessing ? (
          <Processing />
        ) : item.flags ? (
          <FlagsBadge count={item.flags} />
        ) : (
          <NotSubmitted />
        )}
      </td>

      {/* Viewed */}
      <td className="px-4 py-3 text-center" style={{ width: '90px' }}>
        {item.viewedAt ? <ViewedCheck /> : null}
      </td>

      {/* More */}
      <td className="px-4 py-3" style={{ width: '68px' }}>
        <MoreMenu />
      </td>
    </tr>
  );
}
