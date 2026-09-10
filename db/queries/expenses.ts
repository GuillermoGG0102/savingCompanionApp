import { db } from '@/db/client';
import { expense } from '@/db/schema';

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
