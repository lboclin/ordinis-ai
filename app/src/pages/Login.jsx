import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, ArrowRight, Chrome } from 'lucide-react';

const Login = () => {
  const { loginWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Check if session was established (auto-confirm disabled) or check email needed
        // For this task, we assume the flow will continue via AuthContext updates
        if (!error) {
           // Optional: Show check email message if session is null
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f0f0f] p-4">
      <div className="w-full max-w-md bg-[#202123] border border-gray-800 rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-300">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
             <div className="w-6 h-6 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Ordinis AI</h1>
          <p className="text-gray-400 text-sm">
            {isSignUp ? 'Crie sua conta para começar' : 'Bem-vindo de volta'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error === 'Invalid login credentials' ? 'Email ou senha incorretos' : error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#131314] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 ml-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#131314] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
            {!isSignUp && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Esqueci minha senha
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isSignUp ? 'Criar Conta' : 'Entrar'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#202123] px-2 text-gray-500">Ou continue com</span>
          </div>
        </div>

        {/* Social Login */}
        <button
          onClick={loginWithGoogle}
          className="w-full bg-[#131314] hover:bg-[#2A2B32] border border-gray-700 text-gray-200 font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3"
        >
          <Chrome size={20} />
          Google
        </button>

        {/* Toggle Mode */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors focus:outline-none"
            >
              {isSignUp ? 'Entrar' : 'Criar agora'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
