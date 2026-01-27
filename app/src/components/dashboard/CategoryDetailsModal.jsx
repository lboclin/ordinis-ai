import React from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '../../utils/dashboardHelpers';

const CategoryDetailsModal = ({ isOpen, onClose, category, expenses }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#202123] w-full max-w-md rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#202123]">
          <h3 className="text-lg font-bold text-white">{category}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {expenses.length === 0 ? (
            <p className="text-gray-400 text-center">Nenhum registro encontrado.</p>
          ) : (
            expenses.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-[#2E2F38] rounded-lg border border-transparent hover:border-white/5 transition-all">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{item.description || 'Sem descrição'}</span>
                    <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                </div>
                <span className="font-semibold text-white">{formatCurrency(item.amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailsModal;
