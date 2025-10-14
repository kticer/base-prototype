import { NavLink, useLocation } from 'react-router-dom';

export function InboxTabs() {
  const location = useLocation();
  const tabs = [
    { label: 'Submissions', to: '/' },
    { label: 'Insights', to: '/insights' },
    { label: 'Settings', to: '/settings' },
  ];

  return (
    <div className="bg-white border-b px-6 py-2 flex gap-6 text-sm">
      {tabs.map((t) => {
        const isActive = location.pathname === t.to;
        return (
          <NavLink
            key={t.to}
            to={t.to}
            className={
              isActive
                ? 'font-semibold border-b-2 border-blue-500 text-gray-900 pb-1'
                : 'text-gray-400 hover:text-gray-600 pb-1'
            }
          >
            {t.label}
          </NavLink>
        );
      })}
    </div>
  );
}

export default InboxTabs;
