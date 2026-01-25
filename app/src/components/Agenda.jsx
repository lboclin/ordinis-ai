import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Menu } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const Agenda = ({ onMenuClick }) => {
  const { lastDataUpdate } = useAuth();
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
  }, [lastDataUpdate]);

  // Filter appointments for the selected date
  const selectedDateAppointments = appointments.filter(app => {
      if (!app.date) return false;
      const appDate = new Date(app.date);
      return appDate.toDateString() === value.toDateString();
  });

  // Function to determine if a date has appointments
  const tileContent = ({ date, view }) => {
      if (view === 'month') {
          const hasAppointment = appointments.some(app => {
              if (!app.date) return false;
              const appDate = new Date(app.date);
              return appDate.toDateString() === date.toDateString();
          });

          if (hasAppointment) {
              return (
                  <div className="flex justify-center mt-1">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  </div>
              );
          }
      }
      return null;
  };

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
                <Calendar
                    onChange={onChange}
                    value={value}
                    className="rounded-lg border-none"
                    tileContent={tileContent}
                />
            </div>

            <div className="w-full max-w-md bg-[#40414F] p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-200">Compromissos para {value.toLocaleDateString()}</h3>
                {loading ? (
                    <p className="text-gray-400">Carregando...</p>
                ) : selectedDateAppointments.length === 0 ? (
                    <p className="text-gray-400">Nenhum compromisso para este dia.</p>
                ) : (
                    <ul className="space-y-3">
                        {selectedDateAppointments.map((app, index) => {
                             const appDate = new Date(app.date);
                             const timeStr = appDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                             return (
                                <li key={app.id || index} className="p-3 bg-black/20 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <p className="font-medium text-white">{app.title}</p>
                                        <span className="text-sm text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded">{timeStr}</span>
                                    </div>
                                    {app.description && <p className="text-sm text-gray-400 mt-1">{app.description}</p>}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    </div>
  );
};

export default Agenda;
