import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, Info } from 'lucide-react';

const InsightsCard = ({ insights, onRefresh }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = async () => {
      if (onRefresh) {
          setIsRefreshing(true);
          await onRefresh();
          setIsRefreshing(false);
      }
  };

  if (!insights || insights.length === 0 || !isVisible) {
    return null;
  }

  const currentInsight = insights[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % insights.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  const getIcon = (type) => {
    if (type === 'success') return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    if (type === 'info') return <Info className="w-5 h-5 text-blue-400" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
  };

  const getBgColor = (type) => {
    if (type === 'success') return 'bg-green-500/10 border-green-500/20';
    if (type === 'info') return 'bg-blue-500/10 border-blue-500/20';
    return 'bg-yellow-500/10 border-yellow-500/20';
  };

  return (
    <div className={`mt-6 mb-2 p-4 rounded-xl border ${getBgColor(currentInsight.type)} relative transition-all duration-300 animate-in fade-in slide-in-from-top-4 group`}>
      <div className="absolute top-2 right-2 flex items-center gap-1">
          {onRefresh && (
            <button
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className={`text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-white/5 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                title="Atualizar Insights"
            >
                <RefreshCw size={14} />
            </button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
      </div>

      <div className="flex items-start space-x-3 pr-12">
        <div className="mt-1 flex-shrink-0">
            {getIcon(currentInsight.type)}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-200">
            {currentInsight.message}
          </p>
          {insights.length > 1 && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex gap-1">
                {insights.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-gray-400' : 'w-1.5 bg-gray-700'}`}
                  />
                ))}
              </div>
              <div className="flex gap-2 ml-auto">
                 <button onClick={handlePrev} className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white">
                    <ChevronLeft size={16} />
                 </button>
                 <button onClick={handleNext} className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white">
                    <ChevronRight size={16} />
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsCard;
