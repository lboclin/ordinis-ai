import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Menu } from 'lucide-react';

const Agenda = ({ onMenuClick }) => {
  const [value, onChange] = useState(new Date());

  return (
    <div className="flex flex-1 flex-col h-full bg-chatgpt-main text-white relative">
        <div className="sticky top-0 z-30 flex items-center p-4 md:hidden bg-chatgpt-main border-b border-white/10">
            <button
            onClick={onMenuClick}
            className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-white/10"
            >
            <Menu size={24} />
            </button>
            <span className="ml-4 font-semibold text-white">Agenda</span>
        </div>
        <div className="p-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6">Minha Agenda</h2>
            <div className="bg-[#40414F] p-4 rounded-xl shadow-lg text-black">
                <Calendar onChange={onChange} value={value} className="rounded-lg border-none" />
            </div>
            <div className="mt-6 text-gray-300">
                <p>Data selecionada: {value.toLocaleDateString()}</p>
            </div>
        </div>
    </div>
  );
};

export default Agenda;
