import React from 'react';
import { Clock, Tag, Trash2, CalendarCheck } from 'lucide-react';
import { getAppointmentsForDate } from '../../utils/agendaHelpers';

const AppointmentList = ({ date, appointments, onDelete }) => {
  const dayApps = getAppointmentsForDate(appointments, date);

  if (dayApps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <CalendarCheck size={32} className="text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-white">Dia livre!</h3>
        <p className="text-gray-400 mt-1 max-w-xs">Nenhum compromisso agendado para este dia. Aproveite para descansar ou adiantar tarefas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto pb-8">
      {dayApps.map((app) => (
        <div
          key={app.id}
          className="group relative bg-[#1a1a1a] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all flex items-start gap-4 shadow-sm"
        >
          {/* Time Column */}
          <div className="flex flex-col items-center min-w-[60px] pt-1">
             <span className="text-lg font-bold text-white font-mono">{app.time}</span>
             <div className="h-full w-0.5 bg-white/5 mt-2 rounded-full group-last:hidden"></div>
          </div>

          {/* Content */}
          <div className="flex-1">
             <div className="flex items-start justify-between">
                <h4 className="text-lg font-semibold text-white leading-tight">{app.title}</h4>
                {onDelete && (
                    <button
                        onClick={() => onDelete(app.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        aria-label="Deletar compromisso"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
             </div>

             {app.category && (
                 <div className="flex items-center gap-2 mt-2">
                     <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: app.categoryColor || '#3b82f6' }}
                     />
                     <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {app.category}
                     </span>
                 </div>
             )}

             {app.description && (
                 <p className="text-sm text-gray-400 mt-2 leading-relaxed border-t border-white/5 pt-2">
                     {app.description}
                 </p>
             )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AppointmentList;
