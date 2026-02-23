import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Menu, Square } from 'lucide-react';
import { clsx } from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ChatInterface = ({ onMenuClick }) => {
  const { triggerDataUpdate } = useAuth();
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Olá! Sou o Ordinis AI. Como posso ajudar você a organizar sua vida hoje?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Only scroll to bottom when messages change. No API calls here.
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Audio Recording Logic
  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          const chunks = [];

          mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunks.push(e.data);
          };

          mediaRecorder.onstop = async () => {
              const audioBlob = new Blob(chunks, { type: 'audio/webm' }); // Use webm for compatibility
              handleTranscribe(audioBlob);

              // Clean up stream
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingTime(0);

          timerIntervalRef.current = setInterval(() => {
              setRecordingTime(prev => {
                  if (prev >= 6) { // Stop at 7s (0-6 passed, next tick is 7)
                      stopRecording();
                      return 7;
                  }
                  return prev + 1;
              });
          }, 1000);

      } catch (err) {
          console.error("Error accessing microphone:", err);
          toast.error("Erro ao acessar microfone.");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          setRecordingTime(0);
          clearInterval(timerIntervalRef.current);
      }
  };

  const handleTranscribe = async (audioBlob) => {
      setIsTranscribing(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          if (!token) throw new Error("No auth token");

          const formData = new FormData();
          formData.append('file', audioBlob, 'voice_message.webm');

          const response = await axios.post(`${API_URL}/transcribe`, formData, {
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data'
              }
          });

          if (response.data.text) {
              setInput(response.data.text);
              await sendMessageInternal(response.data.text);
          }
      } catch (error) {
          console.error("Transcription error:", error);
          toast.error("Erro ao transcrever áudio.");
      } finally {
          setIsTranscribing(false);
      }
  };

  const sendMessageInternal = async (msgContent) => {
      if (!msgContent.trim()) return;
      if (isLoading || isCooldown) return;

      const userMessage = { id: Date.now(), role: 'user', content: msgContent };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error("No auth token");

        const response = await axios.post(`${API_URL}/chat`, {
          message: userMessage.content
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status !== 200) throw new Error("Request failed");

        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.response
        };
        setMessages((prev) => [...prev, aiMessage]);

        if (response.data.saved) triggerDataUpdate();

      } catch (error) {
          console.error("Error communicating with backend:", error);
          if (error.response?.status === 429) {
              toast.error("IA em pausa. Tente novamente mais tarde.");
              setIsCooldown(true);
              setTimeout(() => setIsCooldown(false), 60000);
          } else if (error.response?.status === 401) {
              toast.error("Sessão expirada. Faça login novamente.");
          } else {
              setMessages((prev) => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: 'Desculpe, não consegui conectar ao servidor.'
              }]);
          }
      } finally {
          setIsLoading(false);
      }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (isRecording) {
        stopRecording();
        return;
    }

    // Explicit Debug Log
    console.log(" [CHAT DEBUG] Botão clicado. Iniciando envio...");

    // Anti-spam & Cooldown protection
    if (isLoading || isTranscribing) {
        console.warn(" [CHAT DEBUG] Bloqueado: Já existe um envio em andamento.");
        return;
    }
    if (isCooldown) {
        console.warn(" [CHAT DEBUG] Bloqueado: Em cooldown.");
        toast.error("IA em pausa. Aguarde alguns instantes.");
        return;
    }

    await sendMessageInternal(input);
  };

  return (
    <div className="flex flex-1 flex-col h-full relative bg-[#131314]">
      {/* Top Bar (Mobile Hamburger) */}
      <div className="sticky top-0 z-30 flex items-center p-4 md:hidden bg-[#131314] border-b border-white/10">
        <button
          onClick={onMenuClick}
          className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-white/10"
        >
          <Menu size={24} />
        </button>
        <span className="ml-4 font-bold text-xl text-white">Ordinis AI</span>
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
              placeholder={
                  isCooldown ? "Aguarde um momento..." :
                  isTranscribing ? "🎧 Processando áudio..." :
                  isRecording ? "Gravando áudio..." :
                  "Digite uma mensagem..."
              }
              className={clsx(
                  "w-full bg-[#202123] text-white placeholder-gray-400 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-white/5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed",
                  isCooldown && "border-red-500/50 text-red-200",
                  isTranscribing && "animate-pulse"
              )}
              disabled={isLoading || isCooldown || isTranscribing || isRecording}
            />
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading || isCooldown || isTranscribing}
              className={clsx(
                  "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all",
                  isRecording
                      ? "text-red-500 bg-red-500/10 animate-pulse hover:bg-red-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              {isRecording ? (
                  <div className="flex items-center gap-1 font-mono text-xs font-bold px-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      {7 - recordingTime}s
                  </div>
              ) : (
                  <Mic size={20} />
              )}
            </button>
          </div>
          <button
            type="submit"
            disabled={(!input.trim() && !isRecording) || isLoading || isCooldown || isTranscribing}
            className={clsx(
                "p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-[#19c37d] hover:bg-[#1a885d] text-white"
            )}
          >
            {isRecording ? <Square size={20} fill="currentColor" /> : <Send size={20} />}
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
