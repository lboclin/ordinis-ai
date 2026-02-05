import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

const Login = () => {
  const { loginWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });

        if (error) throw error;
        setSuccessMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');

    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem.');
        }
        if (password.length < 8) {
            throw new Error('A senha deve ter pelo menos 8 caracteres.');
        }

        // Check if user already exists (Try/Catch to handle RLS)
        try {
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (existingUser) {
                throw new Error('Este email já está cadastrado. Tente fazer login.');
            }
        } catch (checkErr) {
            // Only throw if it's our specific error, otherwise ignore RLS/Network errors
            if (checkErr.message === 'Este email já está cadastrado. Tente fazer login.') {
                throw checkErr;
            }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
              emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;

        // Supabase security: if identities is empty, user exists but is hidden
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            throw new Error('Este email já está cadastrado. Tente fazer login.');
        }

        // SUCCESS FLOW
        setSuccessMessage('Conta criada com sucesso! Fazendo login...');

        // Attempt Auto Login
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError) {
             // If auto-login fails (e.g., email confirmation required)
             setSuccessMessage('Conta criada! Por favor, faça login.');
             setTimeout(() => {
                setIsSignUp(false);
                setPassword('');
                setConfirmPassword('');
                setSuccessMessage(null);
             }, 2000);
        }
        // If success, AuthContext/App.jsx will handle the state change and redirect

      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      // Handle Supabase "User already registered" errors explicitly
      if (err.message && (err.message.includes('User already registered') || err.message.includes('already registered'))) {
          setError('Este email já está cadastrado. Tente fazer login.');
      } else {
          setError(err.message);
      }
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
            {isResetPassword
                ? 'Recuperar sua senha'
                : (isSignUp ? 'Crie sua conta para começar' : 'Bem-vindo de volta')}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error === 'Invalid login credentials' ? 'Email ou senha incorretos' : error}
          </div>
        )}
        {successMessage && (
            <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                {successMessage}
            </div>
        )}

        {/* Form */}
        <form onSubmit={isResetPassword ? handlePasswordReset : handleAuth} className="space-y-4">
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

          {!isResetPassword && (
              <>
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
                  </div>

                  {isSignUp && (
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-400 ml-1">Confirmar Senha</label>
                        <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full bg-[#131314] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                            placeholder="••••••••"
                        />
                        </div>
                    </div>
                  )}

                    {!isSignUp && (
                      <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                setIsResetPassword(true);
                                setError(null);
                                setSuccessMessage(null);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Esqueci minha senha
                        </button>
                      </div>
                    )}
              </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isResetPassword ? 'Enviar Link' : (isSignUp ? 'Criar Conta' : 'Entrar')}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Back Button for Reset Password */}
        {isResetPassword && (
             <div className="mt-6 text-center">
                 <button
                    onClick={() => {
                        setIsResetPassword(false);
                        setError(null);
                        setSuccessMessage(null);
                    }}
                    className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mx-auto"
                 >
                     <ArrowLeft size={16} />
                     Voltar para login
                 </button>
             </div>
        )}

        {!isResetPassword && (
            <>
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
                className="w-full bg-[#131314] hover:bg-[#2A2B32] border border-gray-700 text-gray-200 font-medium py-3 px-4 rounded-full transition-all flex items-center justify-center gap-3 relative"
                >
                {/* Google Logo SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Entrar com Google
                </button>

                {/* Toggle Mode */}
                <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">
                    {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                    <button
                    onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError(null);
                        setSuccessMessage(null);
                    }}
                    className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors focus:outline-none"
                    >
                    {isSignUp ? 'Entrar' : 'Criar agora'}
                    </button>
                </p>
                </div>
            </>
        )}

      </div>
    </div>
  );
};

export default Login;
