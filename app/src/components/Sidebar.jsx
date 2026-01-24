import React from 'react';
import { LayoutDashboard, User, Settings, History, X, LogOut } from 'lucide-react';
import { clsx } from 'clsx';

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '#' },
    { icon: History, label: 'Histórico', href: '#' },
    { icon: User, label: 'Perfil', href: '#' },
    { icon: Settings, label: 'Configurações', href: '#' },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-gray-900 border-r border-gray-800 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold text-white">Ordinis AI</h1>
            <button
              onClick={onClose}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer (Optional User Info or Logout) */}
          <div className="p-4 border-t border-gray-800">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
