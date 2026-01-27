import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, LogOut, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState('');

  useEffect(() => {
    if (user) {
      getSettings();
    }
  }, [user]);

  const getSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('monthly_budget')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setMonthlyBudget(data.monthly_budget || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Silent error or minimal toast
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const updates = {
        id: user.id,
        monthly_budget: parseFloat(monthlyBudget) || 0,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
      toast.success('Configurações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
      try {
          await logout();
          toast.success("Saiu com sucesso");
      } catch (error) {
          console.error("Logout failed", error);
      }
  }

  return (
    <div className="flex flex-1 flex-col h-full bg-chatgpt-main text-gray-100 overflow-y-auto">
      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-white/10 flex items-center gap-4">
        <button onClick={onMenuClick} className="text-gray-300">
          <SettingsIcon size={24} />
        </button>
        <h1 className="text-xl font-bold">Configurações</h1>
      </div>

      <div className="p-6 md:p-12 max-w-2xl mx-auto w-full">
        <h2 className="text-3xl font-bold mb-8 hidden md:block">Configurações</h2>

        <div className="bg-[#444654] p-8 rounded-xl border border-white/10 shadow-lg space-y-8">

          <form onSubmit={updateSettings} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Meta de Gastos Mensal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full bg-[#343541] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ex: 2000.00"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#19c37d] hover:bg-[#1a885d] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Salvar Meta
            </button>
          </form>

          <hr className="border-white/10" />

          <div>
            <h3 className="text-lg font-medium text-red-400 mb-4">Zona de Perigo</h3>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 font-medium py-3 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              Sair da Conta
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
