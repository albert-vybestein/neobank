export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function projectSavings(weeklyContribution: number, years: number, annualRate: number) {
  const weeklyRate = annualRate / 100 / 52;
  const periods = years * 52;

  if (weeklyRate === 0) {
    return weeklyContribution * periods;
  }

  return weeklyContribution * ((Math.pow(1 + weeklyRate, periods) - 1) / weeklyRate);
}
