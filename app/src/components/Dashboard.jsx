import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Menu } from 'lucide-react';

const dataBar = [
  { name: 'Supermercado', valor: 400 },
  { name: 'Roupa', valor: 300 },
  { name: 'Restaurante', valor: 200 },
  { name: 'Gasolina', valor: 278 },
];

const dataPie = [
  { name: 'Supermercado', value: 400 },
  { name: 'Roupa', value: 300 },
  { name: 'Restaurante', value: 200 },
  { name: 'Gasolina', value: 278 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = ({ onMenuClick }) => {
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div className="bg-[#40414F] p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-200">Por Categoria (Barra)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={dataBar}
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
                                data={dataPie}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {dataPie.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#202123', border: 'none', color: '#fff' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
