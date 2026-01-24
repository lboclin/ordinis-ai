import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Agenda from './components/Agenda';
import Dashboard from './components/Dashboard';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('chat');

  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return <ChatInterface onMenuClick={() => setSidebarOpen(true)} />;
      case 'agenda':
        return <Agenda onMenuClick={() => setSidebarOpen(true)} />;
      case 'dashboard':
        return <Dashboard onMenuClick={() => setSidebarOpen(true)} />;
      default:
        // For now, other views also fall back to chat or placeholders.
        // Or render a simple placeholder:
        return (
          <div className="flex flex-1 flex-col h-full bg-chatgpt-main text-white items-center justify-center">
            <h2 className="text-2xl font-bold">Em breve</h2>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-chatgpt-main text-gray-100 font-sans antialiased selection:bg-blue-500/30">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={setCurrentView}
        currentView={currentView}
      />

      <main className="flex-1 h-full relative flex flex-col min-w-0">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
