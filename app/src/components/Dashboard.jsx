import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Menu } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard = ({ onMenuClick }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const response = await axios.get('http://localhost:8000/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setExpenses(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Process data for charts
  const categoryMap = {};
  expenses.forEach(item => {
      const cat = item.category || 'Outros';
      const val = parseFloat(item.amount) || 0;
      categoryMap[cat] = (categoryMap[cat] || 0) + val;
  });

  const chartData = Object.keys(categoryMap).map(key => ({
      name: key,
      value: categoryMap[key],
      valor: categoryMap[key] // For BarChart consistency with previous mock
  }));

  return (
    <div className="flex flex-1 flex-col h-full bg-chatgpt-main text-white overflow-y-auto">
      <div className="sticky top-0 z-30 flex items-center p-4 md:hidden bg-chatgpt-main border-b border-white/10">
        <button
          onClick={onMenuClick}
          className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-white/10"
        >
          <Menu size={24} />
        </button>
        <span className="ml-4 font-semibold text-white">Dashboard</span>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        <h2 className="text-2xl font-bold">Gastos do Mês</h2>

        {loading ? (
            <p>Carregando...</p>
        ) : chartData.length === 0 ? (
            <p className="text-gray-400">Nenhum gasto registrado ainda.</p>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="bg-[#40414F] p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-gray-200">Por Categoria (Barra)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                            <XAxis dataKey="name" stroke="#ccc" />
                            <YAxis stroke="#ccc" />
                            <Tooltip contentStyle={{ backgroundColor: '#202123', border: 'none', color: '#fff' }} />
                            <Legend />
                            <Bar dataKey="valor" fill="#8884d8" />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-[#40414F] p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-gray-200">Por Categoria (Pizza)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#202123', border: 'none', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
