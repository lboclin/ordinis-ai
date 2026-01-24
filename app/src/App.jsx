import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-900 text-gray-100 font-sans antialiased selection:bg-blue-500/30">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 h-full relative flex flex-col min-w-0">
        <ChatInterface
          onMenuClick={() => setSidebarOpen(true)}
        />
      </main>
    </div>
  );
}

export default App;
