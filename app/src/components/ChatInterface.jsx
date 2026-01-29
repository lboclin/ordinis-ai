import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Menu } from 'lucide-react';
import { clsx } from 'clsx';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const ChatInterface = ({ onMenuClick }) => {
  const { triggerDataUpdate } = useAuth();
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Olá! Sou o Ordinis AI. Como posso ajudar você a organizar sua vida hoje?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Only scroll to bottom when messages change. No API calls here.
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();

    // Explicit Debug Log
    console.log(" [CHAT DEBUG] Botão clicado. Iniciando envio...");

    // Anti-spam & Cooldown protection
    if (isLoading) {
        console.warn(" [CHAT DEBUG] Bloqueado: Já existe um envio em andamento.");
        return;
    }
    if (isCooldown) {
        console.warn(" [CHAT DEBUG] Bloqueado: Em cooldown.");
        toast.error("IA em pausa. Aguarde alguns instantes.");
        return;
    }
    if (!input.trim()) return;

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

      // Strict Error Handling Check
      if (response.status !== 200) {
          throw new Error("Request failed with status " + response.status);
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.response
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (response.data.saved) {
          triggerDataUpdate();
      }

    } catch (error) {
      console.error("Error communicating with backend:", error);

      if (error.response?.status === 429) {
          toast.error("IA em pausa. Tente novamente mais tarde.");
          setIsCooldown(true);
          // Set cooldown timer for 60 seconds
          setTimeout(() => setIsCooldown(false), 60000);

          setIsLoading(false);
          return;
      } else if (error.response?.status === 401) {
          toast.error("Sessão expirada. Faça login novamente.");
      } else {
          const errorMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: 'Desculpe, não consegui conectar ao servidor ou você não está logado.'
          };
          setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full relative bg-[#131314]">
      <Toaster position="top-center" />
      {/* Top Bar (Mobile Hamburger) */}
      <div className="sticky top-0 z-30 flex items-center p-4 md:hidden bg-[#131314] border-b border-white/10">
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
                  : 'bg-[#202123] text-gray-100 rounded-bl-none border border-white/5'
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
             <div className="bg-[#202123] text-gray-100 rounded-2xl rounded-bl-none border border-white/5 px-4 py-3">
               <p className="animate-pulse">Digitando...</p>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#131314] border-t border-white/10">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isCooldown ? "Aguarde um momento..." : "Digite uma mensagem..."}
              className={clsx(
                  "w-full bg-[#202123] text-white placeholder-gray-400 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-white/5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
                  isCooldown && "border-red-500/50 text-red-200"
              )}
              disabled={isLoading || isCooldown}
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
            disabled={!input.trim() || isLoading || isCooldown}
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
