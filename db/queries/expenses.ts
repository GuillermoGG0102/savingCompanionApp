import { eq, like } from 'drizzle-orm';
import { Platform } from 'react-native';

import { db } from '@/db/client';
import { category, expense, subcategory } from '@/db/schema';
import { mockExpensesMonth, mockExpensesToday } from '@/db/webMockData';

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

export type ExpenseListItem = {
  id: number;
  amount: number;
  date: string;
  note: string | null;
  subcategoryId: number;
  subcategoryName: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
};

/** Gastos de un mes, con filtro opcional por categoría y por texto (subcategoría o nota). Para el historial/buscador de Gastos. */
export async function listExpensesByMonth(
  monthKey: string,
  filters?: { categoryId?: number; query?: string }
): Promise<ExpenseListItem[]> {
  const rows: ExpenseListItem[] = Platform.OS === 'web'
    ? mockExpensesMonth
    : await db
        .select({
          id: expense.id,
          amount: expense.amount,
          date: expense.date,
          note: expense.note,
          subcategoryId: expense.subcategoryId,
          subcategoryName: subcategory.name,
          categoryId: subcategory.categoryId,
          categoryName: category.name,
          categoryColor: category.color,
        })
        .from(expense)
        .innerJoin(subcategory, eq(expense.subcategoryId, subcategory.id))
        .innerJoin(category, eq(subcategory.categoryId, category.id))
        .where(like(expense.date, `${monthKey}%`));

  const q = filters?.query?.trim().toLowerCase();
  return rows
    .filter((r) => !filters?.categoryId || r.categoryId === filters.categoryId)
    .filter((r) => !q || r.subcategoryName.toLowerCase().includes(q) || (r.note ?? '').toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date));
}
