import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { filterExpensesByMonth, groupExpensesByCategory, calculateTotal, getMockPreviousMonthData } from '../utils/dashboardHelpers';

import SummaryCard from './dashboard/SummaryCard';
import DistributionCard from './dashboard/DistributionCard';
import InsightsCard from './dashboard/InsightsCard';
import CategoryDetailsModal from './dashboard/CategoryDetailsModal';
import AllCategoriesModal from './dashboard/AllCategoriesModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Dashboard = ({ onMenuClick }) => {
  const { lastDataUpdate } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Modal States
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isAllCategoriesOpen, setIsAllCategoriesOpen] = useState(false);

  const refreshInsights = useCallback(async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const response = await axios.get(`${API_URL}/insights`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setInsights(response.data);
    } catch (error) {
        console.error("Error refreshing insights:", error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
           // Mock data for development/preview when no backend/auth
           setExpenses([
               { id: 1, category: 'Moradia', amount: 2000, date: new Date().toISOString(), description: 'Aluguel' },
               { id: 2, category: 'Alimentação', amount: 800, date: new Date().toISOString(), description: 'Mercado' },
               { id: 3, category: 'Transporte', amount: 400, date: new Date().toISOString(), description: 'Uber' },
               { id: 4, category: 'Lazer', amount: 300, date: new Date().toISOString(), description: 'Cinema' },
               { id: 5, category: 'Saúde', amount: 150, date: new Date().toISOString(), description: 'Farmácia' },
               { id: 6, category: 'Educação', amount: 500, date: new Date().toISOString(), description: 'Curso' },
           ]);
           setInsights([
               { type: 'warning', message: 'Atenção: Nesse ritmo, você gastará R$ 1200 em Alimentação, 20% a mais que mês passado.', category: 'Alimentação', value: 1200 },
               { type: 'success', message: 'Parabéns! Você está economizando em Lazer. Previsão de fechar o mês com R$ 100 a menos.', category: 'Lazer', value: 100 }
           ]);
           setLoading(false);
           return;
        }

        const [expensesRes, insightsRes] = await Promise.all([
            axios.get(`${API_URL}/expenses`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/insights`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setExpenses(expensesRes.data);
        setInsights(insightsRes.data);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Fallback to mock on error too
         setExpenses([
               { id: 1, category: 'Moradia', amount: 2000, date: new Date().toISOString(), description: 'Aluguel' },
               { id: 2, category: 'Alimentação', amount: 800, date: new Date().toISOString(), description: 'Mercado' },
               { id: 3, category: 'Transporte', amount: 400, date: new Date().toISOString(), description: 'Uber' },
               { id: 4, category: 'Lazer', amount: 300, date: new Date().toISOString(), description: 'Cinema' },
               { id: 5, category: 'Saúde', amount: 150, date: new Date().toISOString(), description: 'Farmácia' },
               { id: 6, category: 'Educação', amount: 500, date: new Date().toISOString(), description: 'Curso' },
           ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [lastDataUpdate]);

  // Derived Data
  const currentMonthExpenses = useMemo(() =>
      filterExpensesByMonth(expenses, selectedMonth),
      [expenses, selectedMonth]
  );

  const categories = useMemo(() =>
      groupExpensesByCategory(currentMonthExpenses),
      [currentMonthExpenses]
  );

  const totalAmount = useMemo(() =>
      calculateTotal(currentMonthExpenses),
      [currentMonthExpenses]
  );

  const previousMonthData = useMemo(() =>
      getMockPreviousMonthData(categories),
      [categories]
  );

  // Filtered expenses for the specific category modal
  const categoryExpenses = useMemo(() => {
      if (!selectedCategory) return [];
      return currentMonthExpenses.filter(item => (item.category || 'Outros') === selectedCategory);
  }, [currentMonthExpenses, selectedCategory]);


  const handlePrevMonth = () => {
      setSelectedMonth(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(prev.getMonth() - 1);
          return newDate;
      });
  };

  const handleNextMonth = () => {
      setSelectedMonth(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(prev.getMonth() + 1);
          return newDate;
      });
  };

  const formattedMonth = selectedMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-1 flex-col h-full bg-[#131314] text-white overflow-y-auto custom-scrollbar">
      {/* Header Mobile */}
      <div className="sticky top-0 z-30 flex items-center p-4 md:hidden bg-[#131314]/90 backdrop-blur-md border-b border-white/10">
        <button
          onClick={onMenuClick}
          className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
        >
          <Menu size={24} />
        </button>
        <span className="ml-4 font-bold text-xl text-white">Dashboard</span>
      </div>

      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Desktop + Month Selector */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
             <h2 className="text-3xl font-bold hidden md:block">Visão Geral</h2>

             <div className="flex items-center gap-4 bg-[#202123] px-4 py-2 rounded-full border border-white/5 shadow-sm">
                 <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                     <ChevronLeft size={18} />
                 </button>
                 <span className="capitalize font-medium min-w-[140px] text-center text-sm">{formattedMonth}</span>
                 <button onClick={handleNextMonth} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                     <ChevronRight size={18} />
                 </button>
             </div>
        </div>

        {loading ? (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : (
            <>
                {/* Top Row: Summary Card */}
                <SummaryCard
                    totalAmount={totalAmount}
                    topCategories={categories}
                    onViewMore={() => setIsAllCategoriesOpen(true)}
                    onCategoryClick={(cat) => setSelectedCategory(cat)}
                />

                {/* Insights Card (New) */}
                <InsightsCard insights={insights} onRefresh={refreshInsights} />

                {/* Second Row: Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3 h-full">
                        <DistributionCard
                            data={categories}
                            onCategoryClick={(cat) => setSelectedCategory(cat)}
                        />
                    </div>
                </div>
            </>
        )}
      </div>

      {/* Modals */}
      <CategoryDetailsModal
          isOpen={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          category={selectedCategory}
          expenses={categoryExpenses}
      />

      <AllCategoriesModal
          isOpen={isAllCategoriesOpen}
          onClose={() => setIsAllCategoriesOpen(false)}
          categories={categories}
          onCategoryClick={(cat) => setSelectedCategory(cat)}
      />
    </div>
  );
};

export default Dashboard;
