import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Agenda from './components/Agenda';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import History from './pages/History';
import Settings from './pages/Settings';

const AuthenticatedApp = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('chat');

  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return <ChatInterface onMenuClick={() => setSidebarOpen(true)} />;
      case 'agenda':
        return <Agenda onMenuClick={() => setSidebarOpen(true)} />;
      case 'dashboard':
        return <Dashboard onMenuClick={() => setSidebarOpen(true)} />;
      case 'history':
        return <History onMenuClick={() => setSidebarOpen(true)} />;
      case 'settings':
        return <Settings onMenuClick={() => setSidebarOpen(true)} />;
      default:
        return (
          <div className="flex flex-1 flex-col h-full bg-chatgpt-main text-white items-center justify-center">
            <h2 className="text-2xl font-bold">Em breve</h2>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0f0f0f] text-gray-100 font-sans antialiased selection:bg-blue-500/30">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={setCurrentView}
        currentView={currentView}
      />

      <main className="flex-1 h-full relative flex flex-col min-w-0 w-full overflow-x-hidden ml-0">
        {renderView()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
