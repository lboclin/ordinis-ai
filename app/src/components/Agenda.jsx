import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Menu } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const Agenda = ({ onMenuClick }) => {
  const [value, onChange] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const response = await axios.get('http://localhost:8000/agenda', {
            headers: { Authorization: `Bearer ${token}` }
        });
        setAppointments(response.data);
      } catch (error) {
        console.error("Error fetching agenda:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter appointments for the selected date
  const selectedDateAppointments = appointments.filter(app => {
      if (!app.date) return false;
      const appDate = new Date(app.date);
      return appDate.toDateString() === value.toDateString();
  });

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
        <div className="p-8 flex flex-col items-center overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Minha Agenda</h2>
            <div className="bg-[#40414F] p-4 rounded-xl shadow-lg text-black mb-8">
                <Calendar onChange={onChange} value={value} className="rounded-lg border-none" />
            </div>

            <div className="w-full max-w-md bg-[#40414F] p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-200">Compromissos para {value.toLocaleDateString()}</h3>
                {loading ? (
                    <p className="text-gray-400">Carregando...</p>
                ) : selectedDateAppointments.length === 0 ? (
                    <p className="text-gray-400">Nenhum compromisso para este dia.</p>
                ) : (
                    <ul className="space-y-3">
                        {selectedDateAppointments.map((app, index) => (
                            <li key={app.id || index} className="p-3 bg-black/20 rounded-lg">
                                <p className="font-medium text-white">{app.title}</p>
                                {app.description && <p className="text-sm text-gray-400">{app.description}</p>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    </div>
  );
};

export default Agenda;
