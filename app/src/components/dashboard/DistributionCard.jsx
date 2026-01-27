import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/dashboardHelpers';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const DistributionCard = ({ data, onCategoryClick }) => {
  const topCategory = data.length > 0 ? data[0] : null;
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const topCategoryPercent = topCategory && total > 0
      ? Math.round((topCategory.value / total) * 100)
      : 0;

  if (data.length === 0) {
      return (
        <div className="bg-[#202123] rounded-xl p-6 border border-white/5 shadow-lg flex flex-col h-full min-h-[300px] justify-center items-center">
            <p className="text-gray-500">Sem dados para exibir.</p>
        </div>
      );
  }

  return (
    <div className="bg-[#202123] rounded-xl p-6 border border-white/5 shadow-lg flex flex-col h-full transition-all hover:border-white/10">
      <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-6">Distribuição Percentual</h3>

      <div className="flex flex-col md:flex-row items-center justify-between h-full gap-6">
        <div className="relative w-48 h-48 flex-shrink-0">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        onClick={(data) => onCategoryClick(data.name)}
                        cursor="pointer"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#131314', border: '1px solid #333', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value) => formatCurrency(value)}
                    />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white">{topCategoryPercent}%</span>
                <span className="text-xs text-gray-500 max-w-[80px] text-center truncate px-1">{topCategory ? topCategory.name : ''}</span>
             </div>
        </div>

        <div className="flex-1 w-full overflow-y-auto max-h-[220px] custom-scrollbar pr-2">
            <div className="flex flex-col gap-2">
                {data.map((entry, index) => {
                    const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
                    return (
                        <div
                            key={`legend-${index}`}
                            className="flex items-center justify-between text-sm group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
                            onClick={() => onCategoryClick(entry.name)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                    style={{ backgroundColor: COLORS[index % COLORS.length], boxShadow: `0 0 5px ${COLORS[index % COLORS.length]}50` }}
                                />
                                <span className="text-gray-300 truncate group-hover:text-white transition-colors">{entry.name}</span>
                            </div>
                            <span className="font-mono text-gray-500 group-hover:text-gray-300 text-xs">{percent}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionCard;
