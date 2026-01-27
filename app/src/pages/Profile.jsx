import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { User, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      toast.error('Erro ao carregar perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const updates = {
        id: user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      toast.success('Perfil atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-chatgpt-main text-gray-100 overflow-y-auto">
      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-white/10 flex items-center gap-4">
        <button onClick={onMenuClick} className="text-gray-300">
          <User size={24} />
        </button>
        <h1 className="text-xl font-bold">Perfil</h1>
      </div>

      <div className="p-6 md:p-12 max-w-2xl mx-auto w-full">
        <h2 className="text-3xl font-bold mb-8 hidden md:block">Meu Perfil</h2>

        <div className="bg-[#444654] p-8 rounded-xl border border-white/10 shadow-lg">
          <form onSubmit={updateProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="text"
                value={user?.email}
                disabled
                className="w-full bg-[#343541] border border-white/10 rounded-lg p-3 text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#343541] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Avatar URL
              </label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-[#343541] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="https://exemplo.com/foto.jpg"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#19c37d] hover:bg-[#1a885d] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Salvar Alterações
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
