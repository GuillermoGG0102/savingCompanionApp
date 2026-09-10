import { eq } from 'drizzle-orm';
import { Platform } from 'react-native';

import { db } from '@/db/client';
import { mockFixedExpenses } from '@/db/webMockData';
import { category, fixedExpense } from '@/db/schema';

export type NewFixedExpense = {
  categoryId: number;
  name: string;
  amount: number;
  dayOfMonth: number;
  active: boolean;
};

export async function listFixedExpensesWithCategory() {
  if (Platform.OS === 'web') return mockFixedExpenses;

  return db
    .select({
      id: fixedExpense.id,
      name: fixedExpense.name,
      amount: fixedExpense.amount,
      dayOfMonth: fixedExpense.dayOfMonth,
      active: fixedExpense.active,
      categoryId: fixedExpense.categoryId,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
    })
    .from(fixedExpense)
    .innerJoin(category, eq(fixedExpense.categoryId, category.id));
}

export async function createFixedExpense(data: NewFixedExpense) {
  const [row] = await db.insert(fixedExpense).values(data).returning();
  return row;
}

export async function updateFixedExpense(id: number, data: Partial<NewFixedExpense>) {
  const [row] = await db.update(fixedExpense).set(data).where(eq(fixedExpense.id, id)).returning();
  return row;
}

export async function deleteFixedExpense(id: number) {
  await db.delete(fixedExpense).where(eq(fixedExpense.id, id));
}
