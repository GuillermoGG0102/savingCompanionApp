/**
 * Simulación de aportaciones mensuales + rendimiento compuesto hasta
 * alcanzar un objetivo de patrimonio. Usado por la pantalla de Análisis
 * (resumen) y por /proyeccion (con distintos escenarios).
 */

export type ProjectionResult = { points: number[]; months: number };

const MAX_MONTHS = 240;
const CHART_POINTS = 48;

export function simulateProjection(
  startCents: number,
  goalCents: number,
  monthlyContributionCents: number,
  annualReturnPct: number
): ProjectionResult {
  const points: number[] = [];
  let total = startCents;
  let months = 0;
  const monthlyRate = annualReturnPct / 100 / 12;

  while (total < goalCents && months < MAX_MONTHS) {
    total += monthlyContributionCents + total * monthlyRate;
    months++;
    if (months <= CHART_POINTS) points.push(total);
  }
  while (points.length < CHART_POINTS) points.push(total);

  return { points, months };
}

export function formatMonths(months: number): string {
  if (months >= MAX_MONTHS) return '+20 años';
  if (months < 12) return `${months} meses`;
  return `${(months / 12).toFixed(1)} años`;
}
