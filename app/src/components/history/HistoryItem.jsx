import React from 'react';
import { Calendar, Tag, Clock } from 'lucide-react';
import { formatCurrency, formatTime } from '../../utils/historyHelpers';

const HistoryItem = ({ item }) => {
  const isExpense = item.type === 'expense';

  return (
    <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-white/5 rounded-xl hover:bg-[#252525] transition-colors group">
      <div className="flex items-center gap-4">
        {/* Icon Badge */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isExpense ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
        }`}>
            {isExpense ? <Tag size={18} /> : <Calendar size={18} />}
        </div>

        {/* Text Content */}
        <div className="flex flex-col">
            <span className="text-white font-medium text-sm md:text-base line-clamp-1">
                {isExpense ? item.description : item.title}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                 {isExpense && item.category && (
                     <span className="uppercase tracking-wide">{item.category}</span>
                 )}
                 {!isExpense && (
                     <span className="flex items-center gap-1">
                         <Clock size={12} />
                         {item.time || formatTime(item.date)}
                     </span>
                 )}
            </div>
        </div>
      </div>

      {/* Right Side Highlight */}
      <div className="text-right pl-4">
          {isExpense ? (
              <span className="text-red-300 font-semibold whitespace-nowrap">
                  - {formatCurrency(item.amount)}
              </span>
          ) : (
              <span className="text-blue-300 font-mono font-medium whitespace-nowrap">
                  {item.time || formatTime(item.date)}
              </span>
          )}
      </div>
    </div>
  );
};

export default HistoryItem;
