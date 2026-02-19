import React from 'react';
import { LayoutDashboard, User, Settings, History, X, LogOut, Calendar, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose, onNavigate, currentView }) => {
  const { logout } = useAuth();

  const menuItems = [
    { icon: MessageSquare, label: 'Chat', id: 'chat' },
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Calendar, label: 'Agenda', id: 'agenda' },
    { icon: History, label: 'Histórico', id: 'history' },
    { icon: Settings, label: 'Configurações', id: 'settings' },
  ];

  const handleNavigate = (id) => {
    onNavigate(id);
    // On mobile, close sidebar after selection
    if (window.innerWidth < 768) {
        onClose();
    }
  };

  const handleLogout = async () => {
    try {
        await logout();
        // AuthContext will update state, redirecting to login
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

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
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-[#202123] border-r border-black/10 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }} // Fix for iOS Status Bar overlap
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h1 className="text-2xl font-bold text-white">Ordinis AI</h1>
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
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigate(item.id)}
                    className={clsx(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-gray-300 transition-colors",
                        currentView === item.id
                            ? "bg-white/10 text-white"
                            : "hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer (Optional User Info or Logout) */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
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
