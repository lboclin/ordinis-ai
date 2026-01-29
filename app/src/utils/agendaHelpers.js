// Helper to get a window of dates around a center date
export const getWeekWindow = (centerDate) => {
  const dates = [];
  // -3 to +3 days
  for (let i = -3; i <= 3; i++) {
    const d = new Date(centerDate);
    d.setDate(centerDate.getDate() + i);
    dates.push(d);
  }
  return dates;
};

// Formatting helpers
export const formatDayName = (date) => {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
};

export const formatDayNumber = (date) => {
  return date.getDate();
};

export const isSameDay = (d1, d2) => {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

// Mock Data
export const getMockAppointments = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return [
    {
      id: '1',
      date: today.toISOString(),
      time: '09:00',
      title: 'Reunião Daily',
      category: 'Trabalho',
      categoryColor: '#3b82f6', // blue
    },
    {
      id: '2',
      date: today.toISOString(),
      time: '14:30',
      title: 'Dentista',
      category: 'Saúde',
      categoryColor: '#10b981', // green
    },
    {
      id: '3',
      date: tomorrow.toISOString(),
      time: '10:00',
      title: 'Apresentação de Projeto',
      category: 'Trabalho',
      categoryColor: '#3b82f6',
    },
    {
      id: '4',
      date: tomorrow.toISOString(),
      time: '18:00',
      title: 'Academia',
      category: 'Saúde',
      categoryColor: '#10b981',
    },
     {
      id: '5',
      date: yesterday.toISOString(),
      time: '20:00',
      title: 'Jantar com amigos',
      category: 'Lazer',
      categoryColor: '#f59e0b', // yellow
    },
  ];
};

export const getAppointmentsForDate = (appointments, date) => {
  return appointments
    .filter(app => {
        if (!app.date) return false;
        const appDate = new Date(app.date);
        return isSameDay(appDate, date);
    })
    .map(app => {
        if (!app.time && app.date) {
            const d = new Date(app.date);
            const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return { ...app, time: timeStr };
        }
        return app;
    })
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
};
