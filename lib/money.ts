/**
 * Conversión entre lo que escribe el usuario (formato español: "1.234,56")
 * y la unidad mínima de la moneda que se guarda en la base de datos
 * (céntimos, entero) — ver db/schema.ts.
 */

export function parseAmountInput(raw: string): number {
  const normalized = raw.trim().replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function formatCents(cents: number, currency = 'EUR'): string {
  const value = cents / 100;
  const formatted = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  const symbol = currency === 'EUR' ? '€' : currency;
  return `${formatted} ${symbol}`;
}
