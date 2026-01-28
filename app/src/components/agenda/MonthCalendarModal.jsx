import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { X } from 'lucide-react';
import { isSameDay } from '../../utils/agendaHelpers';
import '../../App.css'; // Ensure we have access to global styles if needed, though we'll inject custom styles here.

const MonthCalendarModal = ({ isOpen, onClose, onDateSelect, selectedDate, appointments }) => {
  if (!isOpen) return null;

  const handleDateChange = (date) => {
    onDateSelect(date);
    onClose();
  };

  const tileContent = ({ date, view }) => {
      if (view === 'month') {
          // Check if date has appointments
          const hasApp = appointments.some(app => {
              if (!app.date) return false;
              const appDate = new Date(app.date);
              return isSameDay(appDate, date);
          });

          if (hasApp) {
              return (
                  <div className="flex justify-center mt-0.5">
                      <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                  </div>
              );
          }
      }
      return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#202123] w-full max-w-md rounded-xl border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#202123]">
          <h3 className="text-lg font-bold text-white">Selecionar Data</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-[#202123] flex justify-center custom-calendar-wrapper">
             <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                tileContent={tileContent}
                className="bg-transparent text-white border-none w-full"
                tileClassName={({ date, view }) => {
                    // Custom styling for tiles
                    if (view === 'month') {
                         const isSelected = isSameDay(date, selectedDate);
                         if (isSelected) return 'bg-blue-600! text-white rounded-lg';
                         return 'text-gray-300 hover:bg-white/10 rounded-lg';
                    }
                }}
                navigationLabel={({ date }) => (
                    <span className="text-white font-semibold capitalize">
                        {date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                )}
                prevLabel={<span className="text-white">‹</span>}
                nextLabel={<span className="text-white">›</span>}
                prev2Label={null}
                next2Label={null}
            />
        </div>

        <style>{`
            .custom-calendar-wrapper .react-calendar {
                background: transparent;
                border: none;
                width: 100%;
                font-family: inherit;
            }
            .custom-calendar-wrapper .react-calendar__navigation button {
                color: white;
                min-width: 44px;
                background: none;
                font-size: 16px;
            }
            .custom-calendar-wrapper .react-calendar__navigation button:enabled:hover,
            .custom-calendar-wrapper .react-calendar__navigation button:enabled:focus {
                background-color: rgba(255,255,255,0.1);
                border-radius: 8px;
            }
            .custom-calendar-wrapper .react-calendar__month-view__weekdays {
                text-transform: uppercase;
                font-size: 0.75em;
                font-weight: bold;
                color: #6b7280;
            }
            .custom-calendar-wrapper .react-calendar__month-view__days__day--weekend {
                color: #ef4444;
            }
            .custom-calendar-wrapper .react-calendar__tile:enabled:hover,
            .custom-calendar-wrapper .react-calendar__tile:enabled:focus {
                background-color: rgba(255,255,255,0.1);
                border-radius: 8px;
            }
            .custom-calendar-wrapper .react-calendar__tile--now {
                background: rgba(59, 130, 246, 0.2);
                border-radius: 8px;
            }
            .custom-calendar-wrapper .react-calendar__tile--now:enabled:hover,
            .custom-calendar-wrapper .react-calendar__tile--now:enabled:focus {
                background: rgba(59, 130, 246, 0.3);
            }
            .custom-calendar-wrapper .react-calendar__tile--active {
                background: #2563eb !important;
                color: white !important;
                border-radius: 8px;
            }
        `}</style>
      </div>
    </div>
  );
};

export default MonthCalendarModal;
