import { and, eq, like } from 'drizzle-orm';
import { Platform } from 'react-native';

import { db } from '@/db/client';
import { expense, monthClose, subcategory } from '@/db/schema';
import {
  mockCategoryAnomalies,
  mockCategoryByDayOfWeek,
  mockCategoryHistory,
  mockHeatmapAhorro,
  mockHeatmapGasto,
  mockReconciliation,
  mockSavingsRateSeries,
  mockSubcategoryBreakdown,
  mockYoyComparison,
} from '@/db/webMockData';
import { getPreviousMonthKey } from '@/lib/month';
import { getAssetValuesAsOf, getTransfersInMonth, listAssetsWithLatestValue, type AssetType } from './assets';
import { getCategoryBreakdown } from './dashboard';
import { computeAdditionalIncomeForMonth } from './income';
import { computeFixedTotal, computeVariableTotal } from './monthClose';
import { getProfile } from './profile';

function savingsPct(income: number, fixedTotal: number, variableTotal: number): number {
  return income ? ((income - fixedTotal - variableTotal) / income) * 100 : 0;
}

/** Tasa de ahorro mes a mes (histórico cerrado + el mes actual en curso), en %. */
export async function getSavingsRateSeries(currentMonthKey: string, limit = 12): Promise<{ monthKey: string; pct: number }[]> {
  if (Platform.OS === 'web') return mockSavingsRateSeries;

  const [closes, profile, fixedTotal, variableTotal, additionalIncome] = await Promise.all([
    db.select().from(monthClose),
    getProfile(),
    computeFixedTotal(),
    computeVariableTotal(currentMonthKey),
    computeAdditionalIncomeForMonth(currentMonthKey),
  ]);

  const series = closes
    .filter((c) => c.monthKey !== currentMonthKey)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((c) => ({ monthKey: c.monthKey, pct: savingsPct(c.income, c.fixedTotal, c.variableTotal) }));

  if (profile) {
    series.push({ monthKey: currentMonthKey, pct: savingsPct(profile.monthlyNetPay + additionalIncome, fixedTotal, variableTotal) });
  }

  return series.slice(-limit);
}

const CLASE_BY_TYPE: Record<AssetType, 'Líquido' | 'Inversión' | 'Cripto'> = {
  cash: 'Líquido',
  bank: 'Líquido',
  other: 'Líquido',
  investment: 'Inversión',
  crypto: 'Cripto',
};

export type PatrimonioComposicion = { clase: 'Líquido' | 'Inversión' | 'Cripto'; amount: number }[];

/** Agrupa los activos actuales por clase (Líquido / Inversión / Cripto) según su tipo. */
export async function getPatrimonioComposicion(): Promise<PatrimonioComposicion> {
  const assets = await listAssetsWithLatestValue();
  const grouped = { Líquido: 0, Inversión: 0, Cripto: 0 };
  for (const a of assets) grouped[CLASE_BY_TYPE[a.type as AssetType]] += a.latestValue;
  return (['Líquido', 'Inversión', 'Cripto'] as const).map((clase) => ({ clase, amount: grouped[clase] }));
}

/** Meses de gasto mensual cubiertos con los activos líquidos actuales. */
export async function getSafetyRunway(currentMonthKey: string): Promise<{ meses: number; liquido: number; iliquido: number }> {
  const [composicion, fixedTotal, variableTotal] = await Promise.all([
    getPatrimonioComposicion(),
    computeFixedTotal(),
    computeVariableTotal(currentMonthKey),
  ]);

  const liquido = composicion.find((c) => c.clase === 'Líquido')?.amount ?? 0;
  const iliquido = composicion.reduce((sum, c) => sum + c.amount, 0) - liquido;
  const burnMensual = fixedTotal + variableTotal;

  return { meses: burnMensual ? liquido / burnMensual : 0, liquido, iliquido };
}

export type Reconciliation = {
  prevMonthKey: string;
  patrimonioInicial: number;
  ahorro: number;
  rendimiento: number;
  sinExplicar: number;
  patrimonioFinal: number;
};

/**
 * Flujo vs. patrimonio: cuánto ha cambiado el patrimonio este mes y por qué
 * (ahorro + rendimiento de las inversiones ± lo que no cuadra). Necesita al
 * menos un mes ya cerrado para tener un punto de partida.
 */
export async function getReconciliation(currentMonthKey: string): Promise<Reconciliation | null> {
  if (Platform.OS === 'web') return mockReconciliation;

  const closes = await db.select().from(monthClose);
  if (closes.length === 0) return null;
  const prevMonthKey = closes.map((c) => c.monthKey).sort().reverse()[0];

  const [valuesStart, valuesEnd, transfers, fixedTotal, variableTotal, profile, additionalIncome] = await Promise.all([
    getAssetValuesAsOf(prevMonthKey),
    listAssetsWithLatestValue(),
    getTransfersInMonth(currentMonthKey),
    computeFixedTotal(),
    computeVariableTotal(currentMonthKey),
    getProfile(),
    computeAdditionalIncomeForMonth(currentMonthKey),
  ]);

  const startById = new Map(valuesStart.map((a) => [a.id, a.value]));
  const patrimonioInicial = valuesStart.reduce((sum, a) => sum + a.value, 0);
  const patrimonioFinal = valuesEnd.reduce((sum, a) => sum + a.latestValue, 0);
  const ahorro = profile ? profile.monthlyNetPay + additionalIncome - fixedTotal - variableTotal : 0;

  let rendimiento = 0;
  for (const a of valuesEnd) {
    if (a.type !== 'investment' && a.type !== 'crypto') continue;
    const start = startById.get(a.id) ?? 0;
    const netIn = transfers.filter((t) => t.toAssetId === a.id).reduce((sum, t) => sum + t.amount, 0);
    const netOut = transfers.filter((t) => t.fromAssetId === a.id).reduce((sum, t) => sum + t.amount, 0);
    rendimiento += a.latestValue - start - netIn + netOut;
  }

  const sinExplicar = patrimonioFinal - patrimonioInicial - ahorro - rendimiento;

  return { prevMonthKey, patrimonioInicial, ahorro, rendimiento, sinExplicar, patrimonioFinal };
}

export type CategoryAnomaly = {
  categoryId: number;
  name: string;
  color: string;
  amount: number;
  pct: number;
  meanPos: number;
  isAnomaly: boolean;
  z: number;
};

/**
 * Compara el gasto de cada categoría este mes con la media de tus últimos
 * meses ya cerrados, y marca las que se salen más de 1.5 desviaciones típicas.
 * Necesita al menos 2 meses cerrados para tener una media con sentido.
 */
export async function getCategoryAnomalies(currentMonthKey: string): Promise<CategoryAnomaly[]> {
  if (Platform.OS === 'web') return mockCategoryAnomalies;

  const closes = await db.select().from(monthClose);
  const pastMonthKeys = closes
    .map((c) => c.monthKey)
    .filter((k) => k < currentMonthKey)
    .sort()
    .slice(-6);
  if (pastMonthKeys.length < 2) return [];

  const [current, history] = await Promise.all([
    getCategoryBreakdown(currentMonthKey),
    Promise.all(pastMonthKeys.map((k) => getCategoryBreakdown(k))),
  ]);

  const valuesByCategory = new Map<number, number[]>();
  for (const monthBreakdown of history) {
    for (const c of monthBreakdown) {
      const arr = valuesByCategory.get(c.categoryId) ?? [];
      arr.push(c.amount);
      valuesByCategory.set(c.categoryId, arr);
    }
  }

  const maxTotal = Math.max(...current.map((c) => c.amount), 1);

  return current
    .map((c) => {
      const values = valuesByCategory.get(c.categoryId) ?? [];
      const mean = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : c.amount;
      const variance = values.length ? values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length : 0;
      const std = Math.sqrt(variance);
      const z = std ? (c.amount - mean) / std : 0;
      return {
        categoryId: c.categoryId,
        name: c.name,
        color: c.color,
        amount: c.amount,
        pct: c.amount / maxTotal,
        meanPos: mean / maxTotal,
        isAnomaly: Math.abs(z) > 1.5,
        z: Math.abs(z),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

/** Total de una categoría mes a mes, para el detalle de categoría. */
export async function getCategoryHistory(categoryId: number, currentMonthKey: string, months = 6) {
  if (Platform.OS === 'web') return mockCategoryHistory;

  const monthKeys: string[] = [currentMonthKey];
  let cursor = currentMonthKey;
  for (let i = 1; i < months; i++) {
    cursor = getPreviousMonthKey(cursor);
    monthKeys.unshift(cursor);
  }

  const breakdowns = await Promise.all(monthKeys.map((mk) => getCategoryBreakdown(mk)));
  return monthKeys.map((monthKey, i) => ({
    monthKey,
    amount: breakdowns[i].find((c) => c.categoryId === categoryId)?.amount ?? 0,
  }));
}

/** Desglose por subcategoría de una categoría, para el detalle de categoría. */
export async function getSubcategoryBreakdown(categoryId: number, monthKey: string) {
  if (Platform.OS === 'web') return mockSubcategoryBreakdown;

  const rows = await db
    .select({ subcategoryId: expense.subcategoryId, name: subcategory.name, amount: expense.amount })
    .from(expense)
    .innerJoin(subcategory, eq(expense.subcategoryId, subcategory.id))
    .where(and(eq(subcategory.categoryId, categoryId), like(expense.date, `${monthKey}%`)));

  const totals = new Map<number, { name: string; amount: number }>();
  for (const row of rows) {
    const current = totals.get(row.subcategoryId) ?? { name: row.name, amount: 0 };
    current.amount += row.amount;
    totals.set(row.subcategoryId, current);
  }

  return Array.from(totals.entries())
    .map(([subcategoryId, v]) => ({ subcategoryId, ...v }))
    .sort((a, b) => b.amount - a.amount);
}

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Gasto de una categoría agrupado por día de la semana (lunes primero), para el detalle de categoría. */
export async function getCategoryByDayOfWeek(categoryId: number, monthKey: string) {
  if (Platform.OS === 'web') return mockCategoryByDayOfWeek;

  const rows = await db
    .select({ amount: expense.amount, date: expense.date })
    .from(expense)
    .innerJoin(subcategory, eq(expense.subcategoryId, subcategory.id))
    .where(and(eq(subcategory.categoryId, categoryId), like(expense.date, `${monthKey}%`)));

  const totals = new Array(7).fill(0);
  for (const row of rows) {
    const mondayFirst = (new Date(row.date).getDay() + 6) % 7;
    totals[mondayFirst] += row.amount;
  }

  return DAY_LABELS.map((label, i) => ({ label, amount: totals[i] }));
}

function shiftYear(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-');
  return `${Number(y) + delta}-${m}`;
}

export type YoyMetric = { name: string; prev: number; now: number };
export type YoyComparison = { mes: YoyMetric[]; ytdNow: number[]; ytdPrev: number[]; locked: boolean; mesesFaltan: number };

/**
 * Compara ingresos/fijos/variables/ahorro de este mes con el mismo mes del
 * año pasado, y el acumulado del año en curso (YTD) frente al año anterior.
 * Se desbloquea a partir de tu segundo año de uso (12 meses de histórico).
 */
export async function getYoyComparison(currentMonthKey: string): Promise<YoyComparison> {
  if (Platform.OS === 'web') return mockYoyComparison;

  const [closes, profile, fixedTotal, variableTotal, additionalIncome] = await Promise.all([
    db.select().from(monthClose),
    getProfile(),
    computeFixedTotal(),
    computeVariableTotal(currentMonthKey),
    computeAdditionalIncomeForMonth(currentMonthKey),
  ]);

  const totalMonths = closes.length + 1;
  if (totalMonths < 12) {
    return { mes: [], ytdNow: [], ytdPrev: [], locked: true, mesesFaltan: Math.max(0, 12 - totalMonths) };
  }

  const closeByKey = new Map(closes.map((c) => [c.monthKey, c]));
  const nowIngresos = (profile?.monthlyNetPay ?? 0) + additionalIncome;
  const nowAhorro = nowIngresos - fixedTotal - variableTotal;

  const prevClose = closeByKey.get(shiftYear(currentMonthKey, -1));
  const prevIngresos = prevClose?.income ?? 0;
  const prevFijos = prevClose?.fixedTotal ?? 0;
  const prevVariables = prevClose?.variableTotal ?? 0;

  const mes: YoyMetric[] = [
    { name: 'Ingresos', prev: prevIngresos, now: nowIngresos },
    { name: 'Fijos', prev: prevFijos, now: fixedTotal },
    { name: 'Variables', prev: prevVariables, now: variableTotal },
    { name: 'Ahorro', prev: prevIngresos - prevFijos - prevVariables, now: nowAhorro },
  ];

  const [year, month] = currentMonthKey.split('-').map(Number);
  let cumNow = 0;
  let cumPrev = 0;
  const ytdNow: number[] = [];
  const ytdPrev: number[] = [];
  for (let m = 1; m <= month; m++) {
    const mk = `${year}-${String(m).padStart(2, '0')}`;
    const mkPrev = `${year - 1}-${String(m).padStart(2, '0')}`;
    const c = mk === currentMonthKey ? undefined : closeByKey.get(mk);
    const ahorroThis = mk === currentMonthKey ? nowAhorro : c ? c.income - c.fixedTotal - c.variableTotal : 0;
    const cPrev = closeByKey.get(mkPrev);
    const ahorroPrev = cPrev ? cPrev.income - cPrev.fixedTotal - cPrev.variableTotal : 0;
    cumNow += ahorroThis;
    cumPrev += ahorroPrev;
    ytdNow.push(cumNow);
    ytdPrev.push(cumPrev);
  }

  return { mes, ytdNow, ytdPrev, locked: false, mesesFaltan: 0 };
}

export type SeasonalityRow = { year: string; cells: (number | null)[] };

/** Mapa de calor mes a mes por año: gasto variable o tasa de ahorro, según `mode`. */
export async function getSeasonalityHeatmap(currentMonthKey: string, mode: 'gasto' | 'ahorro'): Promise<SeasonalityRow[]> {
  if (Platform.OS === 'web') return mode === 'gasto' ? mockHeatmapGasto : mockHeatmapAhorro;

  const [closes, profile, fixedTotal, variableTotal, additionalIncome] = await Promise.all([
    db.select().from(monthClose),
    getProfile(),
    computeFixedTotal(),
    computeVariableTotal(currentMonthKey),
    computeAdditionalIncomeForMonth(currentMonthKey),
  ]);

  const byYear = new Map<string, (number | null)[]>();
  function ensureYear(y: string) {
    if (!byYear.has(y)) byYear.set(y, new Array(12).fill(null));
    return byYear.get(y)!;
  }

  for (const c of closes) {
    const [y, m] = c.monthKey.split('-');
    ensureYear(y)[Number(m) - 1] = mode === 'gasto' ? c.variableTotal : savingsPct(c.income, c.fixedTotal, c.variableTotal);
  }

  const [curYear, curMonth] = currentMonthKey.split('-');
  const nowIncome = (profile?.monthlyNetPay ?? 0) + additionalIncome;
  ensureYear(curYear)[Number(curMonth) - 1] = mode === 'gasto' ? variableTotal : savingsPct(nowIncome, fixedTotal, variableTotal);

  return Array.from(byYear.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, cells]) => ({ year, cells }));
}
