import React from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '../../utils/dashboardHelpers';

const AllCategoriesModal = ({ isOpen, onClose, categories }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#202123] w-full max-w-md rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#202123]">
          <h3 className="text-lg font-bold text-white">Todas as Categorias</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {categories.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-[#2E2F38] rounded-lg border border-transparent hover:border-white/5 transition-all">
                <span className="text-sm font-medium text-white">{cat.name}</span>
                <span className="font-semibold text-white">{formatCurrency(cat.value)}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AllCategoriesModal;
