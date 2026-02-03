import React, { useState, useEffect } from 'react';
import { Menu, Calendar as CalendarIcon, Plus, X, Save, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

import WeekNavigator from './agenda/WeekNavigator';
import MonthCalendarModal from './agenda/MonthCalendarModal';
import AppointmentList from './agenda/AppointmentList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Simple Modal for New Appointment
const NewAppointmentModal = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Default to today/now
            const now = new Date();
            setTitle('');
            setDate(now.toISOString().split('T')[0]);
            setTime(now.toTimeString().slice(0, 5));
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !date || !time) {
            toast.error("Preencha todos os campos.");
            return;
        }

        setSaving(true);
        try {
            await onSave({ title, date, time });
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#202123] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-white mb-6">Novo Compromisso</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#131314] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Ex: Consulta Médica"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Data</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-[#131314] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Hora</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full bg-[#131314] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition-colors disabled:opacity-50"
                    >
                        {saving ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <Save size={18} />}
                        {saving ? 'Salvando...' : 'Salvar Compromisso'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const Agenda = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
      setLoading(true);
      try {
          // Using backend endpoint as requested
          let token = null;
          if (supabase) {
              const { data: { session } } = await supabase.auth.getSession();
              token = session?.access_token;
          }

          if (token) {
              // Using dynamic API_URL
              const response = await axios.get(`${API_URL}/appointments`, {
                  headers: {
                      Authorization: `Bearer ${token}`
                  }
              });
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

  useEffect(() => {
    if (user) {
        loadData();
    }
  }, [user]);

  const handleDelete = async (id) => {
      if (confirm('Tem certeza que deseja excluir este compromisso?')) {
          try {
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;

              if (token) {
                  await axios.delete(`${API_URL}/appointments/${id}`, {
                      headers: {
                          Authorization: `Bearer ${token}`
                      }
                  });
                  setAppointments(prev => prev.filter(app => app.id !== id));
                  toast.success("Compromisso removido.");
              }
          } catch (error) {
              console.error("Erro ao excluir compromisso:", error);
              toast.error("Erro ao excluir compromisso.");
          }
      }
  };

  const handleAddAppointment = async (data) => {
      // Use Supabase directly to insert new appointment
      // This bypasses the need for a new dedicated backend endpoint and leverages RLS
      if (supabase && user) {
          const { error } = await supabase.from('appointments').insert({
              user_id: user.id,
              title: data.title,
              date: `${data.date}T${data.time}:00`,
              description: "Agendamento manual"
          });

          if (error) throw error;

          toast.success("Compromisso agendado!");
          loadData(); // Refresh list
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
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-[#202123] hover:bg-[#2A2B32] text-zinc-400 hover:text-white px-6 py-3 rounded-xl transition-all text-sm font-medium border border-transparent hover:border-zinc-600"
                        >
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

        <NewAppointmentModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleAddAppointment}
        />
    </div>
  );
};

export default Agenda;
