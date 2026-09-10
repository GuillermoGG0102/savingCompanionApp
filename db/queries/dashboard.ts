import { eq, like } from 'drizzle-orm';
import { Platform } from 'react-native';

import { db } from '@/db/client';
import { category, expense, fixedExpense, monthClose, subcategory } from '@/db/schema';
import {
  mockCategoryBreakdown,
  mockCurrentNetWorth,
  mockDailyAverageCurve,
  mockDailyThisMonthCurve,
  mockNetWorthHistory,
} from '@/db/webMockData';
import { listAssetsWithLatestValue } from './assets';

const HISTORY_DAYS = 28;

export async function getCurrentNetWorth(): Promise<number> {
  if (Platform.OS === 'web') return mockCurrentNetWorth;
  const assets = await listAssetsWithLatestValue();
  return assets.reduce((sum, a) => sum + a.latestValue, 0);
}

export async function getNetWorthHistory(limit = 12): Promise<{ monthKey: string; netWorth: number }[]> {
  if (Platform.OS === 'web') return mockNetWorthHistory;

  const rows = await db.select().from(monthClose);
  return rows
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .slice(-limit)
    .map((r) => ({ monthKey: r.monthKey, netWorth: r.netWorth }));
}

export type CategorySlice = { categoryId: number; name: string; color: string; amount: number };

/** Gasto fijo + variable del mes, agrupado por categoría. */
export async function getCategoryBreakdown(monthKey: string): Promise<CategorySlice[]> {
  if (Platform.OS === 'web') return mockCategoryBreakdown;

  const [categories, activeFixed, monthExpenses] = await Promise.all([
    db.select().from(category),
    db.select().from(fixedExpense).where(eq(fixedExpense.active, true)),
    db
      .select({ amount: expense.amount, categoryId: subcategory.categoryId })
      .from(expense)
      .innerJoin(subcategory, eq(expense.subcategoryId, subcategory.id))
      .where(like(expense.date, `${monthKey}%`)),
  ]);

  const totals = new Map<number, number>();
  for (const f of activeFixed) totals.set(f.categoryId, (totals.get(f.categoryId) ?? 0) + f.amount);
  for (const e of monthExpenses) totals.set(e.categoryId, (totals.get(e.categoryId) ?? 0) + e.amount);

  return categories
    .filter((c) => totals.has(c.id))
    .map((c) => ({ categoryId: c.id, name: c.name, color: c.color, amount: totals.get(c.id) ?? 0 }))
    .sort((a, b) => b.amount - a.amount);
}

/** Gasto variable acumulado día a día de un mes, hasta HISTORY_DAYS días. */
export async function getDailyAccumulatedSpend(monthKey: string): Promise<number[]> {
  const rows = await db.select().from(expense).where(like(expense.date, `${monthKey}%`));

  const perDay = new Array(HISTORY_DAYS).fill(0);
  for (const row of rows) {
    const day = Number(row.date.slice(8, 10));
    if (day >= 1 && day <= HISTORY_DAYS) perDay[day - 1] += row.amount;
  }

  const cumulative: number[] = [];
  let running = 0;
  for (const value of perDay) {
    running += value;
    cumulative.push(running);
  }
  return cumulative;
}

/** Media del acumulado día a día de los últimos `monthsBack` meses ya cerrados. */
export async function getHistoricalDailyAverage(currentMonthKey: string, monthsBack = 6): Promise<number[]> {
  if (Platform.OS === 'web') return mockDailyAverageCurve;

  const closes = await db.select().from(monthClose);
  const pastMonthKeys = closes
    .map((c) => c.monthKey)
    .filter((k) => k < currentMonthKey)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, monthsBack);

  if (pastMonthKeys.length === 0) return new Array(HISTORY_DAYS).fill(0);

  const curves = await Promise.all(pastMonthKeys.map((k) => getDailyAccumulatedSpend(k)));
  return new Array(HISTORY_DAYS).fill(0).map((_, day) => {
    const sum = curves.reduce((acc, curve) => acc + curve[day], 0);
    return Math.round(sum / curves.length);
  });
}

export async function getThisMonthDailyAccumulated(monthKey: string): Promise<number[]> {
  if (Platform.OS === 'web') return mockDailyThisMonthCurve;
  return getDailyAccumulatedSpend(monthKey);
}
