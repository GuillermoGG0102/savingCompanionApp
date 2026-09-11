import { eq } from 'drizzle-orm';
import { Platform } from 'react-native';

import { db } from '@/db/client';
import { category, expense, subcategory } from '@/db/schema';
import { mockExpensesToday } from '@/db/webMockData';

export type NewExpense = {
  subcategoryId: number;
  amount: number;
  date: string;
  note?: string;
};

export async function createExpense(data: NewExpense) {
  const [row] = await db.insert(expense).values(data).returning();
  return row;
}

export async function hasAnyExpense(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  const rows = await db.select({ id: expense.id }).from(expense).limit(1);
  return rows.length > 0;
}

export async function listExpensesForDate(date: string) {
  if (Platform.OS === 'web') return mockExpensesToday;

  return db
    .select({
      id: expense.id,
      amount: expense.amount,
      subcategoryName: subcategory.name,
      categoryName: category.name,
      categoryColor: category.color,
    })
    .from(expense)
    .innerJoin(subcategory, eq(expense.subcategoryId, subcategory.id))
    .innerJoin(category, eq(subcategory.categoryId, category.id))
    .where(eq(expense.date, date));
}
