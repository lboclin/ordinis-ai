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
  Download,
  Bell,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { subscribeToPushNotifications } from '../utils/pushNotifications';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

  // Notification State
  const [notifSettings, setNotifSettings] = useState({
    enabled: true,
    reminder_time_minutes: 60,
    day_before_alert_enabled: true,
    day_before_alert_time: '20:00',
    morning_threshold: '11:00'
  });
  const [originalNotifSettings, setOriginalNotifSettings] = useState(null);
  const [loadingNotif, setLoadingNotif] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Account State
  const email = user?.email;
  const fullName = user?.user_metadata?.full_name || 'Usuário';
  const avatarUrl = user?.user_metadata?.avatar_url;

  // Check provider (google vs email)
  const isGoogle = user?.app_metadata?.provider === 'google' ||
                   user?.identities?.some(id => id.provider === 'google');

  // Check modification status
  const isNotifModified = originalNotifSettings
      ? JSON.stringify(notifSettings) !== JSON.stringify(originalNotifSettings)
      : false;

  useEffect(() => {
    fetchCategories();
    fetchNotificationSettings();
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

  const fetchNotificationSettings = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const response = await axios.get(`${API_URL}/settings/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Convert time formats if needed (HH:MM:SS -> HH:MM)
        const d = response.data;
        const normalized = {
            ...d,
            day_before_alert_time: d.day_before_alert_time.slice(0, 5),
            morning_threshold: d.morning_threshold.slice(0, 5)
        };
        setNotifSettings(normalized);
        setOriginalNotifSettings(normalized);
    } catch (error) {
        console.error('Error fetching notif settings:', error);
    } finally {
        setLoadingNotif(false);
    }
  };

  const handleSaveNotification = async () => {
    try {
        setSavingNotif(true);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        // 1. If enabling, try to subscribe push
        if (notifSettings.enabled) {
           await subscribeToPushNotifications();
        }

        // 2. Save settings to backend
        await axios.put(`${API_URL}/settings/notifications`, notifSettings, {
            headers: { Authorization: `Bearer ${token}` }
        });

        setOriginalNotifSettings(notifSettings); // Update baseline
        toast.success('Configurações de notificação salvas!');
    } catch (error) {
        console.error('Error saving notifications:', error);
        toast.error('Erro ao salvar configurações.');
        alert("Erro ao salvar: " + (error.response?.data?.detail || error.message));
    } finally {
        setSavingNotif(false);
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

  const handleUpdatePassword = async () => {
      if (newPassword !== confirmNewPassword) {
          toast.error("A nova senha e a confirmação não coincidem.");
          return;
      }
      if (newPassword.length < 8) {
          toast.error("A nova senha deve ter pelo menos 8 caracteres.");
          return;
      }

      setUpdatingPassword(true);
      try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          toast.success("Senha atualizada com sucesso!");
          setIsChangingPassword(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmNewPassword('');
      } catch (error) {
          console.error("Error updating password:", error);
          toast.error("Erro ao atualizar senha: " + error.message);
      } finally {
          setUpdatingPassword(false);
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
        <span className="ml-4 font-bold text-xl text-white">Configurações</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold mb-6 hidden md:block">Configurações</h2>

            {/* CARD 1: CONTA (Reordered as Requested) */}
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

                    <div className="flex flex-col gap-4 p-4 bg-black/20 rounded-lg border border-white/5">
                        {isGoogle ? (
                             <div className="space-y-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <Lock size={18} className="text-gray-400" />
                                    <span className="text-gray-300 font-medium">Senha</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-3 bg-[#131314] border border-white/10 rounded-lg text-blue-400 text-sm">
                                    <ShieldCheck size={16} />
                                    <span>Conectado via Google Account</span>
                                </div>
                             </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Lock size={18} className="text-gray-400" />
                                    <span className="text-gray-300 font-medium">Senha</span>
                                </div>
                                {!isChangingPassword && (
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-500 text-sm tracking-widest">●●●●●●●●</span>
                                        <button
                                            onClick={() => setIsChangingPassword(true)}
                                            className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                                        >
                                            Mudar senha
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {isChangingPassword && !isGoogle && (
                            <div className="mt-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Current Password */}
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">Senha Atual</label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full bg-[#131314] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 pr-8"
                                            />
                                            <button
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                            >
                                                {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    {/* New Password */}
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">Nova Senha</label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-[#131314] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 pr-8"
                                            />
                                            <button
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                            >
                                                {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Confirm New Password */}
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">Confirmar Nova Senha</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmNewPassword ? "text" : "password"}
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                className="w-full bg-[#131314] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 pr-8"
                                            />
                                            <button
                                                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                            >
                                                {showConfirmNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setCurrentPassword('');
                                            setNewPassword('');
                                            setConfirmNewPassword('');
                                        }}
                                        className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleUpdatePassword}
                                        disabled={updatingPassword}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {updatingPassword ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Atualizar Senha
                                    </button>
                                </div>
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

            {/* CARD 2: NOTIFICAÇÕES (Reordered) */}
            <div className="bg-[#202123] rounded-xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bell className="text-yellow-400" size={20} />
                        <h3 className="font-semibold">Notificações</h3>
                    </div>
                    {/* Botão de Salvar Inteligente */}
                    <button
                        onClick={handleSaveNotification}
                        disabled={!isNotifModified || savingNotif || loadingNotif}
                        className={`text-xs px-3 py-1 rounded transition-colors font-medium
                            ${isNotifModified
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                                : 'bg-white/5 text-gray-500 cursor-not-allowed'}
                        `}
                    >
                        {savingNotif ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>

                {loadingNotif ? (
                     <div className="p-8 flex justify-center text-gray-500">
                        <Loader2 className="animate-spin" size={24}/>
                     </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Toggle Global */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-gray-200">Receber Notificações</h4>
                                <p className="text-sm text-gray-500">Ativa lembretes via Push no dispositivo.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={notifSettings.enabled}
                                    onChange={(e) => setNotifSettings({...notifSettings, enabled: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                        </div>

                        {notifSettings.enabled && (
                            <>
                                <hr className="border-white/5" />

                                {/* Antecedência */}
                                <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        <Clock className="text-gray-400" size={18} />
                                        <span className="text-gray-300">Avisar com antecedência de:</span>
                                     </div>
                                     <select
                                        value={notifSettings.reminder_time_minutes}
                                        onChange={(e) => setNotifSettings({...notifSettings, reminder_time_minutes: parseInt(e.target.value)})}
                                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                                     >
                                         <option value={15}>15 minutos</option>
                                         <option value={30}>30 minutos</option>
                                         <option value={60}>1 hora</option>
                                         <option value={120}>2 horas</option>
                                     </select>
                                </div>

                                <hr className="border-white/5" />

                                {/* Resumo Dia Anterior */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="text-gray-400" size={18} />
                                            <div>
                                                <span className="text-gray-300 block">Resumo do dia seguinte</span>
                                                <span className="text-xs text-gray-500">Avisar na noite anterior se houver compromisso cedo.</span>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={notifSettings.day_before_alert_enabled}
                                                onChange={(e) => setNotifSettings({...notifSettings, day_before_alert_enabled: e.target.checked})}
                                            />
                                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {notifSettings.day_before_alert_enabled && (
                                        <div className="flex items-center gap-4 pl-8">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-500">Horário do aviso</label>
                                                <input
                                                    type="time"
                                                    value={notifSettings.day_before_alert_time}
                                                    onChange={(e) => setNotifSettings({...notifSettings, day_before_alert_time: e.target.value})}
                                                    className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-500">Considerar "Manhã" até</label>
                                                <input
                                                    type="time"
                                                    value={notifSettings.morning_threshold}
                                                    onChange={(e) => setNotifSettings({...notifSettings, morning_threshold: e.target.value})}
                                                    className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* CARD 3: CATEGORIAS */}
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

            {/* CARD 4: INTEGRAÇÕES */}
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
