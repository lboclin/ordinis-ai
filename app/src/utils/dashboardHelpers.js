export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const filterExpensesByMonth = (expenses, date) => {
  if (!expenses || !date) return [];
  return expenses.filter((item) => {
    if (!item.date) return false;
    const itemDate = new Date(item.date);
    return (
      itemDate.getMonth() === date.getMonth() &&
      itemDate.getFullYear() === date.getFullYear()
    );
  });
};

export const calculateTotal = (expenses) => {
  return expenses.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
};

export const groupExpensesByCategory = (expenses) => {
  const map = {};
  expenses.forEach((item) => {
    const cat = item.category || 'Outros';
    const val = parseFloat(item.amount) || 0;
    if (!map[cat]) {
      map[cat] = { name: cat, value: 0, count: 0 };
    }
    map[cat].value += val;
    map[cat].count += 1;
  });

  return Object.values(map).sort((a, b) => b.value - a.value);
};

export const getMockPreviousMonthData = (currentMonthCategories) => {
  // Deterministic mock based on category name length to be stable across renders
  return currentMonthCategories.map(cat => {
      const seed = cat.name.length;
      // Even length -> Increase by 15% (Alert), Odd length -> Decrease by 15% (Success)
      const isIncrease = seed % 2 === 0;
      const factor = isIncrease ? 1.15 : 0.85;
      return {
          ...cat,
          value: cat.value * factor
      };
  });
};
