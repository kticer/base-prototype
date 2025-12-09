// Status badge components for submission table

// Grade badge - blue rounded badge
export function GradeBadge({ score }: { score: string | number }) {
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-100 text-blue-800 rounded font-sans font-semibold text-sm">
      {score}
    </span>
  );
}

// Not graded placeholder
export function NotGraded() {
  return (
    <span className="text-gray-400 font-sans text-sm">—</span>
  );
}

// Processing indicator
export function Processing() {
  return (
    <div className="flex items-center gap-2 text-gray-400">
      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
      <span className="text-sm font-sans">Processing</span>
    </div>
  );
}

// Not submitted placeholder
export function NotSubmitted() {
  return (
    <span className="text-gray-400 font-sans text-sm">—</span>
  );
}

// Similarity badge - percentage
export function SimilarityBadge({ percent }: { percent: number }) {
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-800 rounded font-sans font-semibold text-sm">
      {percent}%
    </span>
  );
}

// AI Writing badge with info icon
export function AIWritingBadge({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-blue-500" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 13.3333V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 6.66675H10.0083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-800 rounded font-sans font-semibold text-sm">
        {percent}%
      </span>
    </div>
  );
}

// Flags badge with flag icon
export function FlagsBadge({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.33331 17.5V3.33333C3.33331 3.11232 3.42111 2.90036 3.57739 2.74408C3.73367 2.5878 3.94563 2.5 4.16665 2.5H15C15 2.5 16.6666 3.75 16.6666 5.83333C16.6666 7.91667 15 9.16667 15 9.16667H5.83331V17.5H3.33331Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-800 rounded font-sans font-semibold text-sm">
        {count}
      </span>
    </div>
  );
}

// Viewed checkmark
export function ViewedCheck() {
  return (
    <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.6666 5L7.49998 14.1667L3.33331 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Extension label - orange text
export function ExtensionLabel({ days }: { days: number }) {
  return (
    <span className="text-orange-600 font-sans font-semibold text-sm">
      {days} Day extension
    </span>
  );
}

// Integrity badge - red warning badge
export function IntegrityBadge({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 6.66675V10.0001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 13.3333H10.0083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="inline-flex items-center justify-center px-2 py-1 bg-red-100 text-red-800 rounded font-sans font-semibold text-sm">
        {score}%
      </span>
    </div>
  );
}

// More menu button
export function MoreMenu() {
  return (
    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 6C10.5523 6 11 5.55228 11 5C11 4.44772 10.5523 4 10 4C9.44772 4 9 4.44772 9 5C9 5.55228 9.44772 6 10 6Z"/>
        <path d="M10 11C10.5523 11 11 10.5523 11 10C11 9.44772 10.5523 9 10 9C9.44772 9 9 9.44772 9 10C9 10.5523 9.44772 11 10 11Z"/>
        <path d="M10 16C10.5523 16 11 15.5523 11 15C11 14.4477 10.5523 14 10 14C9.44772 14 9 14.4477 9 15C9 15.5523 9.44772 16 10 16Z"/>
      </svg>
    </button>
  );
}
