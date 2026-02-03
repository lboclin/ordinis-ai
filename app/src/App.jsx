import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Agenda from './components/Agenda';
import Dashboard from './components/Dashboard';
import Login from './pages/Login';
import History from './pages/History';
import Settings from './pages/Settings';
import { registerServiceWorker, subscribeToPushNotifications } from './utils/pushNotifications';

const AuthenticatedApp = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('chat');

  useEffect(() => {
    if (user) {
        // Init Push Notifications
        const initPush = async () => {
            await registerServiceWorker();
            // Try to subscribe (will request permission if needed, as per requirements)
            await subscribeToPushNotifications();
        };
        initPush();

        // Redirect new users to dashboard
        if (user.created_at) {
          const isNewUser = new Date(user.created_at).getTime() > Date.now() - 60000;
          if (isNewUser) {
            setCurrentView('dashboard');
          }
        }
    }
  }, [user]);

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
    <div className="flex h-full w-full overflow-hidden bg-[#131314] text-gray-100 font-sans antialiased selection:bg-blue-500/30">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={setCurrentView}
        currentView={currentView}
      />

      <main className="flex-1 h-full relative flex flex-col min-w-0 w-full overflow-x-hidden ml-0 pt-safe">
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
