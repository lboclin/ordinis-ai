import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Menu } from 'lucide-react';
import { clsx } from 'clsx';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const ChatInterface = ({ onMenuClick }) => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Olá! Sou o Ordinis AI. Como posso ajudar você a organizar sua vida hoje?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
          throw new Error("No auth token");
      }

      // Assuming backend is running on localhost:8000
      const response = await axios.post('http://localhost:8000/chat', {
        message: userMessage.content
      }, {
          headers: {
              Authorization: `Bearer ${token}`
          }
      });

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.response
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error communicating with backend:", error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Desculpe, não consegui conectar ao servidor ou você não está logado.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full relative bg-chatgpt-main">
      {/* Top Bar (Mobile Hamburger) */}
      <div className="sticky top-0 z-30 flex items-center p-4 md:hidden bg-chatgpt-main border-b border-white/10">
        <button
          onClick={onMenuClick}
          className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-white/10"
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
              className={clsx(
                "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3",
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-[#444654] text-gray-100 rounded-bl-none border border-black/10'
              )}
            >
              <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start">
             <div className="bg-[#444654] text-gray-100 rounded-2xl rounded-bl-none border border-black/10 px-4 py-3">
               <p className="animate-pulse">Digitando...</p>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-chatgpt-main border-t border-white/10">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="w-full bg-[#40414F] text-white placeholder-gray-400 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-black/10 shadow-sm disabled:opacity-50"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-md hover:bg-black/20 transition-colors"
            >
              <Mic size={20} />
            </button>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-[#19c37d] hover:bg-[#1a885d] text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
