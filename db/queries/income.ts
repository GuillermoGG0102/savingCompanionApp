import { eq, like } from 'drizzle-orm';
import { Platform } from 'react-native';

import { db } from '@/db/client';
import { additionalIncome } from '@/db/schema';
import { mockAdditionalIncome } from '@/db/webMockData';

export type NewAdditionalIncome = { amount: number; date: string; note?: string };

/** Ingresos puntuales (no la nómina), más recientes primero. */
export async function listAdditionalIncome() {
  if (Platform.OS === 'web') return mockAdditionalIncome;

  const rows = await db.select().from(additionalIncome);
  return rows.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

export async function computeAdditionalIncomeForMonth(monthKey: string): Promise<number> {
  if (Platform.OS === 'web') return mockAdditionalIncome.filter((i) => i.date.startsWith(monthKey)).reduce((sum, i) => sum + i.amount, 0);

  const rows = await db.select().from(additionalIncome).where(like(additionalIncome.date, `${monthKey}%`));
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

export async function createAdditionalIncome(data: NewAdditionalIncome) {
  if (Platform.OS === 'web') return;
  await db.insert(additionalIncome).values(data);
}

export async function deleteAdditionalIncome(id: number) {
  if (Platform.OS === 'web') return;
  await db.delete(additionalIncome).where(eq(additionalIncome.id, id));
}
