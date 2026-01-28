import React from 'react';
import HistoryItem from './HistoryItem';

const HistoryGroup = ({ label, items }) => {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1 sticky top-0 bg-[#0f0f0f]/95 backdrop-blur py-2 z-10 w-full">
        {label}
      </h3>
      <div className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <HistoryItem key={item.id || idx} item={item} />
        ))}
      </div>
    </div>
  );
};

export default HistoryGroup;
