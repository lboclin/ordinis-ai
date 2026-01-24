import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Menu } from 'lucide-react';

const ChatInterface = ({ onMenuClick }) => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Olá! Sou o Ordinis AI. Como posso ajudar você a organizar sua vida hoje?' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Entendi. Estou processando sua solicitação...'
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <div className="flex flex-1 flex-col h-full relative bg-gray-900">
      {/* Top Bar (Mobile Hamburger) */}
      <div className="sticky top-0 z-30 flex items-center p-4 md:hidden bg-gray-900 border-b border-gray-800">
        <button
          onClick={onMenuClick}
          className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-gray-800"
        >
          <Menu size={24} />
        </button>
        <span className="ml-4 font-semibold text-white">Ordinis AI</span>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-800 text-gray-100 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-gray-700"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            >
              <Mic size={20} />
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500">Ordinis AI pode cometer erros.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
