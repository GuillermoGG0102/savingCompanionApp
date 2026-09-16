import { eq, gte } from 'drizzle-orm';
import { Platform } from 'react-native';

import { db } from '@/db/client';
import { category, dismissedFixedSuggestion, expense, subcategory } from '@/db/schema';
import { mockFixedExpenseCandidates } from '@/db/webMockData';
import { getPreviousMonthKey } from '@/lib/month';

export type FixedExpenseCandidate = {
  subcategoryId: number;
  subcategoryName: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  avgAmount: number;
  months: string[];
};

const TOLERANCE = 0.2; // el importe de cada mes puede variar hasta un ±20% de la media

/** Gastos variables que aparecen todos los meses (últimos `months`) con un importe parecido: candidatos a pasar a fijos. */
export async function getFixedExpenseCandidates(currentMonthKey: string, months = 3): Promise<FixedExpenseCandidate[]> {
  if (Platform.OS === 'web') return mockFixedExpenseCandidates;

  const monthKeys: string[] = [currentMonthKey];
  let cursor = currentMonthKey;
  for (let i = 1; i < months; i++) {
    cursor = getPreviousMonthKey(cursor);
    monthKeys.unshift(cursor);
  }
  const monthKeySet = new Set(monthKeys);

  const [rows, dismissed] = await Promise.all([
    db
      .select({
        amount: expense.amount,
        date: expense.date,
        subcategoryId: expense.subcategoryId,
        subcategoryName: subcategory.name,
        categoryId: subcategory.categoryId,
        categoryName: category.name,
        categoryColor: category.color,
      })
      .from(expense)
      .innerJoin(subcategory, eq(expense.subcategoryId, subcategory.id))
      .innerJoin(category, eq(subcategory.categoryId, category.id))
      .where(gte(expense.date, `${monthKeys[0]}-01`)),
    db.select({ subcategoryId: dismissedFixedSuggestion.subcategoryId }).from(dismissedFixedSuggestion),
  ]);

  const dismissedIds = new Set(dismissed.map((d) => d.subcategoryId));

  const bySubcategory = new Map<
    number,
    { subcategoryName: string; categoryId: number; categoryName: string; categoryColor: string; perMonth: Map<string, number> }
  >();

  for (const r of rows) {
    const monthKey = r.date.slice(0, 7);
    if (!monthKeySet.has(monthKey) || dismissedIds.has(r.subcategoryId)) continue;

    let entry = bySubcategory.get(r.subcategoryId);
    if (!entry) {
      entry = {
        subcategoryName: r.subcategoryName,
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        categoryColor: r.categoryColor,
        perMonth: new Map(),
      };
      bySubcategory.set(r.subcategoryId, entry);
    }
    entry.perMonth.set(monthKey, (entry.perMonth.get(monthKey) ?? 0) + r.amount);
  }

  const candidates: FixedExpenseCandidate[] = [];
  for (const [subcategoryId, entry] of bySubcategory) {
    if (entry.perMonth.size < months) continue;
    const amounts = monthKeys.map((mk) => entry.perMonth.get(mk) ?? 0);
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    if (avg <= 0) continue;
    const withinTolerance = amounts.every((a) => Math.abs(a - avg) <= avg * TOLERANCE);
    if (!withinTolerance) continue;

    candidates.push({
      subcategoryId,
      subcategoryName: entry.subcategoryName,
      categoryId: entry.categoryId,
      categoryName: entry.categoryName,
      categoryColor: entry.categoryColor,
      avgAmount: Math.round(avg),
      months: monthKeys,
    });
  }

  return candidates.sort((a, b) => b.avgAmount - a.avgAmount);
}

/** Marca una sugerencia como descartada (rechazada, o ya convertida) para no volver a preguntarla. */
export async function dismissFixedExpenseSuggestion(subcategoryId: number) {
  if (Platform.OS === 'web') return;
  await db.insert(dismissedFixedSuggestion).values({ subcategoryId, dismissedAt: new Date().toISOString() });
}
