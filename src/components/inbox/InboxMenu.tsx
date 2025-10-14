import React from "react";
import {
  DocumentIcon,
  UsersIcon,
  TrashIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  ChevronDoubleLeftIcon,
} from "@heroicons/react/24/outline";

const menuItems = [
  { icon: <DocumentIcon className="h-5 w-5" />, label: "My Files" },
  { icon: <UsersIcon className="h-5 w-5" />, label: "Shared With Me" },
  { icon: <TrashIcon className="h-5 w-5" />, label: "Trash" },
  { icon: <Cog6ToothIcon className="h-5 w-5" />, label: "Settings" },
];

export default function InboxMenu() {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('inboxMenuCollapsed');
    if (saved !== null) setCollapsed(saved === 'true');
  }, []);

  React.useEffect(() => {
    localStorage.setItem('inboxMenuCollapsed', String(collapsed));
  }, [collapsed]);

  return (
    <div
      className={`flex flex-col justify-between h-screen bg-gray-50 border-r text-sm transition-[width] duration-300 ${collapsed ? 'w-[72px]' : 'w-56'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <span className={`text-xl font-semibold text-[#006D81] transition-opacity duration-150 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>iThenticate</span>
        <Squares2X2Icon className="h-5 w-5 text-gray-500" />
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 flex flex-col gap-1">
        {menuItems.map((item, index) => (
          <div
            key={item.label}
            className={`flex items-center h-10 ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded cursor-pointer transition-all duration-300 ${
              index === 0 ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-100"
            }`}
            title={item.label}
          >
            <span className="text-base">{item.icon}</span>
            <div className="relative flex-1 h-5">
              <span className={`absolute left-0 top-0 transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">KT</div>
          <span className={`text-gray-800 text-sm transition-all duration-300 ${collapsed ? 'opacity-0 max-w-0 overflow-hidden' : 'opacity-100 max-w-full'}`}>KeVon Ticer</span>
        </div>
        <button onClick={() => setCollapsed(!collapsed)}>
          <ChevronDoubleLeftIcon className={`h-5 w-5 text-[#006D81] transform transition-transform duration-300 ${collapsed ? 'rotate-180 translate-x-1' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
  );
}