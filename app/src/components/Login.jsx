import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center bg-[#343541] text-gray-100">
      <div className="w-full max-w-md p-8 bg-[#202123] rounded-xl shadow-2xl text-center">
        <h1 className="text-3xl font-bold mb-2">Ordinis AI</h1>
        <p className="text-gray-400 mb-8">Seu assistente pessoal inteligente</p>

        <button
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <LogIn size={20} />
          Entrar com Google
        </button>
      </div>
    </div>
  );
};

export default Login;
