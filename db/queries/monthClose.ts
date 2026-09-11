import { eq, like } from 'drizzle-orm';
import { Platform } from 'react-native';

import { db } from '@/db/client';
import { expense, fixedExpense, monthClose } from '@/db/schema';
import { mockFixedTotal, mockMonthCloses, mockVariableTotal } from '@/db/webMockData';

export type NewMonthClose = {
  monthKey: string;
  income: number;
  fixedTotal: number;
  variableTotal: number;
  netWorth: number;
  savingsRate: number;
};

export async function getMonthClose(monthKey: string) {
  if (Platform.OS === 'web') return mockMonthCloses.find((m) => m.monthKey === monthKey) ?? null;

  const rows = await db.select().from(monthClose).where(eq(monthClose.monthKey, monthKey));
  return rows[0] ?? null;
}

export async function computeFixedTotal(): Promise<number> {
  if (Platform.OS === 'web') return mockFixedTotal;

  const rows = await db.select().from(fixedExpense).where(eq(fixedExpense.active, true));
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

export async function computeVariableTotal(monthKey: string): Promise<number> {
  if (Platform.OS === 'web') return mockVariableTotal;

  const rows = await db.select().from(expense).where(like(expense.date, `${monthKey}%`));
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

export async function upsertMonthClose(data: NewMonthClose) {
  if (Platform.OS === 'web') return;

  const existing = await getMonthClose(data.monthKey);
  if (existing) {
    await db.update(monthClose).set(data).where(eq(monthClose.monthKey, data.monthKey));
  } else {
    await db.insert(monthClose).values(data);
  }
}

/** Todos los cierres de mes, más recientes primero. */
export async function listMonthCloses() {
  if (Platform.OS === 'web') return mockMonthCloses;

  const rows = await db.select().from(monthClose);
  return rows.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

export async function deleteMonthClose(monthKey: string) {
  if (Platform.OS === 'web') return;
  await db.delete(monthClose).where(eq(monthClose.monthKey, monthKey));
}
