import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Trash2,
  Plus,
  Menu,
  User,
  Lock,
  ShieldCheck,
  Grid,
  FileSpreadsheet,
  Loader2,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

// Predefined colors for new categories
const CATEGORY_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', color: '#ef4444' }, // Red
  { name: 'Transporte', color: '#3b82f6' },  // Blue
  { name: 'Moradia', color: '#10b981' },     // Emerald
  { name: 'Saúde', color: '#8b5cf6' },       // Violet
  { name: 'Educação', color: '#f59e0b' },    // Amber
  { name: 'Lazer', color: '#ec4899' },       // Pink
];

const Settings = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [loadingLogout, setLoadingLogout] = useState(false);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  // Account State
  const email = user?.email;
  const fullName = user?.user_metadata?.full_name || 'Usuário';
  const avatarUrl = user?.user_metadata?.avatar_url;

  // Check provider (google vs email)
  const isGoogle = user?.app_metadata?.provider === 'google' ||
                   user?.identities?.some(id => id.provider === 'google');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      if (!supabase) return; // Fallback if no client
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setAddingCategory(true);
      const randomColor = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];

      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            user_id: user.id,
            name: newCategoryName.trim(),
            color: randomColor,
            is_default: false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      setNewCategoryName('');
      toast.success('Categoria adicionada!');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Erro ao adicionar categoria.');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)
        .eq('user_id', user.id); // RLS redundancy check

      if (error) throw error;

      setCategories(categories.filter(c => c.id !== category.id));
      toast.success('Categoria removida.');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao remover categoria.');
    }
  };

  const handleLoadDefaults = async () => {
    try {
      setLoadingDefaults(true);

      const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
        user_id: user.id,
        name: cat.name,
        color: cat.color,
        is_default: true
      }));

      const { data, error } = await supabase
        .from('categories')
        .insert(categoriesToInsert)
        .select();

      if (error) throw error;

      setCategories([...categories, ...data]);
      toast.success('Categorias padrão carregadas!');
    } catch (error) {
      console.error('Error loading defaults:', error);
      toast.error('Erro ao carregar categorias padrão.');
    } finally {
      setLoadingDefaults(false);
    }
  };

  const handleResetPassword = async () => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
        });
        if (error) throw error;
        toast.success(`Email de redefinição enviado para ${email}`);
    } catch (error) {
        toast.error('Erro ao solicitar redefinição.');
        console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
        setLoadingLogout(true);
        await logout();
    } catch (error) {
        console.error('Logout error:', error);
        toast.error('Erro ao sair.');
    } finally {
        setLoadingLogout(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-[#131314] text-white overflow-hidden">
      {/* Mobile Header */}
      <div className="flex items-center p-4 md:hidden bg-[#131314]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
        <button
          onClick={onMenuClick}
          className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-white/10"
        >
          <Menu size={24} />
        </button>
        <span className="ml-4 font-semibold text-white">Configurações</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold mb-6 hidden md:block">Configurações</h2>

            {/* CARD 1: CONTA */}
            <div className="bg-[#202123] rounded-xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                    <User className="text-blue-400" size={20} />
                    <h3 className="font-semibold">Conta</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full border border-white/10" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-gray-400">
                                <User size={32} />
                            </div>
                        )}
                        <div>
                            <h4 className="text-lg font-medium text-white">{fullName}</h4>
                            <p className="text-sm text-gray-400">{email}</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-black/20 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <Lock size={18} className="text-gray-400" />
                            <span className="text-gray-300 font-medium">Senha</span>
                        </div>

                        {isGoogle ? (
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-sm border border-blue-500/20">
                                <ShieldCheck size={14} />
                                <span>Conectado via Google Account</span>
                             </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <span className="text-gray-500 text-sm tracking-widest">●●●●●●●●</span>
                                <button
                                    onClick={handleResetPassword}
                                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                    Alterar Senha
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleLogout}
                            disabled={loadingLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-colors text-sm font-medium"
                        >
                            <LogOut size={16} />
                            {loadingLogout ? 'Saindo...' : 'Desconectar da conta'}
                        </button>
                    </div>
                </div>
            </div>

            {/* CARD 2: CATEGORIAS */}
            <div className="bg-[#202123] rounded-xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                    <Grid className="text-emerald-400" size={20} />
                    <h3 className="font-semibold">Categorias</h3>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-400 mb-4">Gerencie as categorias de despesas.</p>

                    {/* List */}
                    <div className="space-y-2 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {loadingCategories ? (
                            <div className="flex items-center justify-center py-8 text-gray-500">
                                <Loader2 className="animate-spin mr-2" size={16} /> Carregando...
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <p className="text-gray-500 text-sm italic mb-4">Nenhuma categoria encontrada.</p>
                                <button
                                    onClick={handleLoadDefaults}
                                    disabled={loadingDefaults}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 rounded-lg transition-colors text-sm font-medium"
                                >
                                    {loadingDefaults ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                                    Carregar Categorias Padrão
                                </button>
                            </div>
                        ) : (
                            categories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: cat.color || '#6b7280' }}
                                        />
                                        <span className="text-gray-200">{cat.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCategory(cat)}
                                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                        title="Remover"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add New */}
                    <div className="space-y-3">
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="Nova categoria..."
                                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={addingCategory || !newCategoryName.trim()}
                                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {addingCategory ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            </button>
                        </form>
                        <p className="text-xs text-yellow-500/80 bg-yellow-500/10 p-2 rounded border border-yellow-500/10">
                            <strong>Dica:</strong> Ao criar uma categoria personalizada, você precisará citar o nome dela no chat para a IA identificar. Ex: 'Gastei 100 com [NomeDaCategoria]'.
                        </p>
                    </div>
                </div>
            </div>

            {/* CARD 3: INTEGRAÇÕES */}
            <div className="bg-[#202123] rounded-xl border border-white/5 overflow-hidden opacity-75">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                    <FileSpreadsheet className="text-green-400" size={20} />
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold">Planilhas Google</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-400 uppercase tracking-wide">
                            Em Breve
                        </span>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-400 mb-4">
                        Sincronize automaticamente seus gastos e apontamentos com uma planilha do Google Sheets.
                    </p>
                    <button disabled className="px-4 py-2 bg-white/5 text-gray-500 rounded-lg text-sm font-medium border border-white/5 cursor-not-allowed w-full md:w-auto">
                        Conectar Planilha
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
