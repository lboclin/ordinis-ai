// Mock Data Generation
export const getMockHistoryData = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(today.getDate() - 2);

    return [
      {
        id: 'e1',
        type: 'expense',
        date: today.toISOString(),
        description: 'Uber para o trabalho',
        category: 'Transporte',
        amount: 24.90,
      },
      {
        id: 'a1',
        type: 'appointment',
        date: today.toISOString(),
        title: 'Reunião de Planejamento',
        time: '10:00',
      },
      {
          id: 'e2',
          type: 'expense',
          date: today.toISOString(),
          description: 'Almoço no Restaurante X',
          category: 'Alimentação',
          amount: 45.00,
      },
      {
        id: 'a2',
        type: 'appointment',
        date: yesterday.toISOString(),
        title: 'Dentista',
        time: '14:30',
      },
      {
        id: 'e3',
        type: 'expense',
        date: yesterday.toISOString(),
        description: 'Assinatura Spotify',
        category: 'Lazer',
        amount: 21.90,
      },
      {
        id: 'e4',
        type: 'expense',
        date: dayBefore.toISOString(),
        description: 'Compra Supermercado',
        category: 'Alimentação',
        amount: 350.00,
      }
    ];
  };

  // Normalization
  export const normalizeData = (expenses = [], appointments = []) => {
      const normExpenses = expenses.map(e => ({
          ...e,
          type: 'expense',
          // Ensure we have a valid date object or string consistent for sorting
          dateObj: new Date(e.date),
      }));

      const normAppointments = appointments.map(a => ({
          ...a,
          type: 'appointment',
          dateObj: new Date(a.date),
          // Ensure structure compatibility if needed (e.g. description vs title)
          description: a.title,
      }));

      return [...normExpenses, ...normAppointments].sort((a, b) => b.dateObj - a.dateObj);
  };

  // Grouping
  export const groupHistoryByDate = (items) => {
      const groups = {};
      const today = new Date().toDateString();
      const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toDateString();

      items.forEach(item => {
          const itemDateStr = item.dateObj.toDateString();
          let label = item.dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });

          if (itemDateStr === today) {
              label = "HOJE";
          } else if (itemDateStr === yesterday) {
              label = "ONTEM";
          } else {
             label = label.toUpperCase();
          }

          if (!groups[label]) {
              groups[label] = [];
          }
          groups[label].push(item);
      });

      return groups;
  };

  // Formatters
  export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  export const formatTime = (dateStr) => {
      if (!dateStr) return '';
      // Try to parse if it's a full ISO string, or just use it if it's already HH:MM
      if (dateStr.includes('T')) {
           return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return dateStr; // Assuming '14:00' format from some mocks
  };
