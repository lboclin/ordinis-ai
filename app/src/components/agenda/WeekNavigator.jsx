import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeekWindow, formatDayName, formatDayNumber, isSameDay, getAppointmentsForDate } from '../../utils/agendaHelpers';

const WeekNavigator = ({ currentDate, onDateSelect, appointments }) => {
  const weekDates = useMemo(() => getWeekWindow(currentDate), [currentDate]);

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    onDateSelect(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    onDateSelect(newDate);
  };

  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto mb-6">
      <button
        onClick={handlePrevDay}
        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="flex gap-2 md:gap-4 overflow-hidden px-2 w-full justify-center">
        {weekDates.map((date, idx) => {
          const isSelected = isSameDay(date, currentDate);
          const isToday = isSameDay(date, new Date());
          const dayApps = getAppointmentsForDate(appointments, date);

          return (
            <button
              key={idx}
              onClick={() => onDateSelect(date)}
              className={`
                flex flex-col items-center justify-center min-w-[50px] md:min-w-[60px] py-3 rounded-xl transition-all duration-200
                ${isSelected
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-[#202123] text-gray-400 hover:bg-[#2A2B32] hover:text-gray-200'}
                ${isToday && !isSelected ? 'border border-blue-500/30' : 'border border-transparent'}
              `}
            >
              <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider opacity-80">
                {formatDayName(date)}
              </span>
              <span className={`text-lg md:text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                {formatDayNumber(date)}
              </span>

              {/* Dots Indicator */}
              <div className="flex gap-0.5 mt-1 h-1.5">
                  {dayApps.length > 0 && dayApps.slice(0, 3).map((app, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: app.categoryColor || '#fff' }}
                      />
                  ))}
                  {dayApps.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                  )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNextDay}
        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
};

export default WeekNavigator;
