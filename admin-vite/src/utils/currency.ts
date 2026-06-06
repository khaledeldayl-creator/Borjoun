export const formatCurrency = (coins: number, currency: "SAR" = "SAR") => {
  const usd = coins / 1000;
  return `${(usd * 3.75).toFixed(3)} ر.س`;
};

export const getCurrencySymbol = (currency: "SAR" = "SAR") => {
  return "ر.س";
};
