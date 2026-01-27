import React from 'react';
import { CheckCircle, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';

const InsightsCard = ({ currentMonthData, previousMonthData }) => {
  // Compare current vs previous
  // We need to match categories
  const insights = [];

  // Create a map for quick lookup
  const prevMap = new Map(previousMonthData.map(c => [c.name, c.value]));

  currentMonthData.forEach(curr => {
      const prevVal = prevMap.get(curr.name);
      if (prevVal) {
          const diff = curr.value - prevVal;
          const percentChange = (diff / prevVal) * 100;

          if (percentChange > 10 && curr.value > 50) { // Only significant amounts
             insights.push({
                 type: 'warning',
                 category: curr.name,
                 percent: Math.round(percentChange),
                 message: `Gastos com ${curr.name} subiram ${Math.round(percentChange)}%.`
             });
          } else if (percentChange < -10 && curr.value > 50) {
              insights.push({
                 type: 'success',
                 category: curr.name,
                 percent: Math.round(Math.abs(percentChange)),
                 message: `Ótimo! Você economizou ${Math.round(Math.abs(percentChange))}% em ${curr.name}.`
             });
          }
      }
  });

  // Sort insights: warnings first, then by magnitude
  insights.sort((a, b) => {
      if (a.type === 'warning' && b.type !== 'warning') return -1;
      if (b.type === 'warning' && a.type !== 'warning') return 1;
      return b.percent - a.percent;
  });

  const displayInsights = insights.slice(0, 2); // Show top 2

  if (displayInsights.length === 0) {
      return (
        <div className="bg-[#202123] rounded-xl p-6 border border-white/5 shadow-lg h-full flex flex-col justify-center items-center text-center transition-all hover:border-white/10">
             <div className="bg-white/5 p-3 rounded-full mb-3">
                <CheckCircle className="text-gray-400" size={24} />
             </div>
             <p className="text-gray-400 text-sm">Seus gastos estão consistentes com o mês passado.</p>
        </div>
      );
  }

  return (
    <div className="bg-[#202123] rounded-xl p-6 border border-white/5 shadow-lg h-full flex flex-col gap-4 transition-all hover:border-white/10">
       <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-yellow-500" />
            <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Insights</h3>
       </div>
       <div className="flex flex-col gap-3 h-full justify-center">
           {displayInsights.map((insight, idx) => (
               <div
                key={idx}
                className={`p-4 rounded-lg border flex items-start gap-3 transition-colors ${
                    insight.type === 'warning'
                        ? 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10'
                        : 'bg-green-500/5 border-green-500/10 hover:bg-green-500/10'
                }`}
               >
                   <div className={`mt-0.5 ${insight.type === 'warning' ? 'text-red-400' : 'text-green-400'}`}>
                       {insight.type === 'warning' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                   </div>
                   <div>
                       <p className={`text-sm font-semibold ${insight.type === 'warning' ? 'text-red-200' : 'text-green-200'}`}>
                           {insight.type === 'warning' ? 'Atenção' : 'Economia'}
                       </p>
                       <p className="text-sm text-gray-400 leading-tight mt-1">
                           {insight.message}
                       </p>
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
};

export default InsightsCard;
