import React, { useState, useEffect } from 'react';
import { Menu, Calendar as CalendarIcon, Plus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

import WeekNavigator from './agenda/WeekNavigator';
import MonthCalendarModal from './agenda/MonthCalendarModal';
import AppointmentList from './agenda/AppointmentList';

const Agenda = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            // Using backend endpoint as requested
            let token = null;
            if (supabase) {
                const { data: { session } } = await supabase.auth.getSession();
                token = session?.access_token;
            } else if (user?.id === 'test-user') {
                // Fallback for testing/dev environment without Supabase credentials
                token = 'mock-token';
            }

            if (token) {
                // Assuming backend is running on localhost:8000
                const response = await axios.get('http://localhost:8000/appointments', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                // Ensure date strings are parsed correctly if needed,
                // though AppointmentList likely handles ISO strings or Date objects.
                // We map them to ensure date objects if needed, or keep as strings.
                // The mock data used strings or Date objects?
                // Looking at getMockAppointments (previous code), it likely returned objects with Date or string dates.
                // Let's assume the API returns ISO strings.
                setAppointments(response.data);
            } else {
                 setAppointments([]);
            }
        } catch (error) {
            console.error("Erro ao carregar agenda:", error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    if (user) {
        loadData();
    }
  }, [user]); // Reload when user changes

  // Refresh trigger listener could be added here if we had a global refresh context,
  // but for now we stick to basic fetch.

  const handleDelete = (id) => {
      if (confirm('Tem certeza que deseja excluir este compromisso?')) {
          setAppointments(prev => prev.filter(app => app.id !== id));
          // TODO: Call API to delete
      }
  };

  const handleDateSelect = (date) => {
      setSelectedDate(date);
  };

  const formattedHeaderDate = selectedDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
  });

  return (
    <div className="flex flex-1 flex-col h-full bg-[#131314] text-white relative overflow-hidden">
        {/* Header Mobile */}
        <div className="sticky top-0 z-30 flex items-center p-4 md:hidden bg-[#131314]/90 backdrop-blur-md border-b border-white/10">
            <button
            onClick={onMenuClick}
            className="text-gray-300 hover:text-white p-1 rounded-md hover:bg-white/10"
            >
            <Menu size={24} />
            </button>
            <span className="ml-4 font-semibold text-white">Agenda</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center p-4 md:p-8">
            <div className="w-full flex flex-col items-center">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between w-full mb-8 gap-4 max-w-5xl">
                    <h2 className="text-2xl font-bold hidden md:block">Minha Agenda</h2>
                </div>

                {/* Week Navigator */}
                <WeekNavigator
                    currentDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    appointments={appointments}
                />

                {/* Date Display & Calendar Toggle */}
                <div className="flex items-center gap-3 mb-8">
                    <span className="text-gray-400 font-medium capitalize border-r border-white/10 pr-4">
                        {formattedHeaderDate}
                    </span>
                    <button
                        onClick={() => setIsCalendarOpen(true)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1.5 transition-colors"
                    >
                        <CalendarIcon size={16} />
                        Abrir calendário
                    </button>
                </div>

                {/* Appointments List */}
                <div className="w-full max-w-3xl flex flex-col gap-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 text-sm">Carregando sua agenda...</p>
                        </div>
                    ) : (
                        <AppointmentList
                            date={selectedDate}
                            appointments={appointments}
                            onDelete={handleDelete}
                        />
                    )}

                    {/* New Appointment Button - Footer Position */}
                    <div className="flex justify-center mt-2 pb-8">
                        <button className="flex items-center gap-2 bg-[#202123] hover:bg-[#2A2B32] text-zinc-400 hover:text-white px-6 py-3 rounded-xl transition-all text-sm font-medium border border-transparent hover:border-zinc-600">
                            <Plus size={18} />
                            Novo Compromisso
                        </button>
                    </div>
                </div>

            </div>
        </div>

        {/* Modals */}
        <MonthCalendarModal
            isOpen={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            appointments={appointments}
        />
    </div>
  );
};

export default Agenda;
