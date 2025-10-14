
interface SidebarToggleButtonProps {
  sidebarVisible: boolean;
  onToggle: () => void;
}

export function SidebarToggleButton({ sidebarVisible, onToggle }: SidebarToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`fixed z-50 p-2 bg-white text-gray-600 rounded-full shadow-lg hover:bg-gray-50 hover:text-gray-800 transition-all duration-300 border border-gray-200 ${
        sidebarVisible ? 'right-[calc(384px+8px)] lg:right-[calc(320px+8px)] xl:right-[calc(384px+8px)]' : 'right-4'
      }`}
      style={{
        top: 'calc(64px + 44px + 4px + 24px)', // Header height + tabs height + 4px padding + 24px down
      }}
      title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {sidebarVisible ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        )}
      </svg>
    </button>
  );
}