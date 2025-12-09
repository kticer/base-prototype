import { NavLink, useLocation } from 'react-router-dom';
import { DownloadIcon } from '../document/HeaderIcons';

// Icon components for navigation
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor"/>
    </svg>
  );
}

function RerunReportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
    </svg>
  );
}

function ExpandMoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.59 8.59L12 13.17L7.41 8.59L6 10L12 16L18 10L16.59 8.59Z"/>
    </svg>
  );
}

export function InboxTabs() {
  const location = useLocation();
  const tabs = [
    { label: 'Submission list', to: '/' },
    { label: 'Insights', to: '/insights' },
  ];

  return (
    <div className="bg-white border-b border-surface-outline px-4 py-0">
      <div className="flex items-center gap-6 max-w-[1408px] mx-auto">
        {/* Left: Tabs */}
        <div className="flex gap-6 flex-1">
          {tabs.map((t) => {
            const isActive = location.pathname === t.to;
            return (
              <div key={t.to} className="flex flex-col items-center justify-center relative">
                <NavLink
                  to={t.to}
                  className="flex gap-2 items-center justify-center px-0 py-3 relative"
                >
                  <div className="flex items-center justify-center px-0 py-0.5 rounded-2xl">
                    <span className={`font-sans font-semibold text-[18px] leading-6 text-center whitespace-nowrap ${
                      isActive ? 'text-surface-on-surface' : 'text-surface-on-surface-variant-1'
                    }`}>
                      {t.label}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary rounded-t-[4px]" />
                  )}
                </NavLink>
              </div>
            );
          })}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search Icon Button */}
          <button className="flex items-center justify-center p-1 rounded-lg hover:bg-black/5 transition-colors">
            <SearchIcon className="w-6 h-6 text-surface-on-surface-variant-1" />
          </button>

          {/* Rerun Report Icon Button */}
          <button className="flex items-center justify-center p-1 bg-white border border-surface-outline-dark rounded-lg hover:bg-gray-50 transition-colors">
            <RerunReportIcon className="w-6 h-6 text-surface-on-surface-variant-1" />
          </button>

          {/* Download Button */}
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-surface-outline-dark rounded-lg hover:bg-gray-50 transition-colors">
            <DownloadIcon className="w-5 h-5 text-surface-on-surface-variant-1" />
            <span className="font-sans font-semibold text-label-medium text-surface-on-surface-variant-1">
              Download
            </span>
            <ExpandMoreIcon className="w-5 h-5 text-surface-on-surface-variant-1" />
          </button>

          {/* Resync Grades Button */}
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-surface-outline-dark rounded-lg hover:bg-gray-50 transition-colors">
            <RerunReportIcon className="w-5 h-5 text-surface-on-surface-variant-1" />
            <span className="font-sans font-semibold text-label-medium text-surface-on-surface-variant-1">
              Resync Grades
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default InboxTabs;
