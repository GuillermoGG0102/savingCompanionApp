/**
 * Funciones de cálculo financiero. Todos los importes se reciben y devuelven
 * en la unidad mínima de la moneda (céntimos) para evitar errores de
 * redondeo; ver db/schema.ts.
 */

export function calculateSavings(income: number, fixedTotal: number, variableTotal: number): number {
  return income - (fixedTotal + variableTotal);
}

export function calculateNetWorth(snapshots: { value: number }[]): number {
  return snapshots.reduce((sum, snapshot) => sum + snapshot.value, 0);
}

export function calculateNetWorthDelta(currentNetWorth: number, previousNetWorth: number): number {
  return currentNetWorth - previousNetWorth;
}

/** Ratio (no porcentaje). 0 si no hay ingresos, para no dividir entre cero. */
export function calculateSavingsRate(savings: number, income: number): number {
  if (income === 0) return 0;
  return savings / income;
}

/**
 * Diferencia entre lo que de verdad varió el patrimonio y lo que el ahorro
 * del mes hacía esperar. Negativo = el patrimonio ha ido peor de lo previsto
 * (por ejemplo, una inversión ha perdido valor pese a haber ahorrado).
 */
export function calculateDeviation(netWorthDelta: number, theoreticalSavings: number): number {
  return netWorthDelta - theoreticalSavings;
}
