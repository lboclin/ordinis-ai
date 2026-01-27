import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/dashboardHelpers';

const SummaryCard = ({ totalAmount, topCategories, onViewMore }) => {
  return (
    <div className="bg-[#202123] rounded-xl p-6 border border-white/5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:border-white/10">
      <div className="flex flex-col gap-2">
        <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Gasto Total do Mês</h3>
        <span className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          {formatCurrency(totalAmount)}
        </span>
      </div>

      <div className="flex flex-col w-full md:w-auto min-w-[240px] gap-3 bg-[#2E2F38]/30 p-4 rounded-lg border border-white/5">
        {topCategories.length === 0 && <span className="text-gray-500 text-sm">Sem dados.</span>}
        {topCategories.slice(0, 4).map((cat, idx) => (
           <div key={idx} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
             <span className="text-gray-300 font-medium truncate max-w-[120px]">{cat.name}</span>
             <span className="font-semibold text-white">{formatCurrency(cat.value)}</span>
           </div>
        ))}
        {topCategories.length > 0 && (
            <button
            onClick={onViewMore}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-end mt-1 gap-1 font-medium"
            >
            Ver mais <ChevronRight size={14} />
            </button>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
