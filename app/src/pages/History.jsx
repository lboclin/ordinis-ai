import React, { useState, useEffect, useMemo } from 'react';
import { Menu, History as HistoryIcon } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
    getMockHistoryData,
    normalizeData,
    groupHistoryByDate
} from '../utils/historyHelpers';

import HistoryGroup from '../components/history/HistoryGroup';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const History = ({ onMenuClick }) => {
  const { lastDataUpdate } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Safe check if supabase is initialized
        if (!supabase) {
            console.warn("Supabase client not initialized. Using mock data.");
            await new Promise(r => setTimeout(r, 600));
            const mockData = getMockHistoryData();
            const expenses = mockData.filter(i => i.type === 'expense');
            const appointments = mockData.filter(i => i.type === 'appointment');
            setItems(normalizeData(expenses, appointments));
            setLoading(false);
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
            // Development fallback
            await new Promise(r => setTimeout(r, 600)); // Mock delay
            const mockData = getMockHistoryData();
            const expenses = mockData.filter(i => i.type === 'expense');
            const appointments = mockData.filter(i => i.type === 'appointment');

            setItems(normalizeData(expenses, appointments));
            setLoading(false);
            return;
        }

        // Parallel Fetch
        const [expensesRes, appointmentsRes] = await Promise.all([
            axios.get(`${API_URL}/expenses`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { include_cancelled: true }
            }).catch(() => ({ data: [] })),
            axios.get(`${API_URL}/appointments`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { include_cancelled: true }
            }).catch(() => ({ data: [] }))
        ]);

        const normalized = normalizeData(expensesRes.data, appointmentsRes.data);
        setItems(normalized);

      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lastDataUpdate]);

  const groupedItems = useMemo(() => groupHistoryByDate(items), [items]);
  const groupKeys = Object.keys(groupedItems);

  return (
    <div className="flex flex-1 flex-col h-full bg-[#131314] text-white relative overflow-hidden">
        {/* Header Mobile */}
        <div className="sticky top-0 z-30 flex items-center p-4 md:hidden bg-[#131314]/90 backdrop-blur-md border-b border-white/10">
            <button
            onClick={onMenuClick}
            className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-white/10"
            >
            <Menu size={24} />
            </button>
            <span className="ml-4 font-semibold text-white">Histórico</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center p-4 md:p-8">
            <div className="w-full max-w-2xl flex flex-col">

                <h2 className="text-3xl font-bold mb-8 hidden md:block">Histórico de Atividades</h2>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 text-sm">Carregando histórico...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                         <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <HistoryIcon size={32} />
                         </div>
                         <p className="text-lg font-medium">Nenhum registro encontrado</p>
                         <p className="text-sm text-gray-400 mt-2">Fale com a IA para adicionar novos gastos ou compromissos.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 pb-10">
                        {groupKeys.map((label) => (
                            <HistoryGroup
                                key={label}
                                label={label}
                                items={groupedItems[label]}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default History;
