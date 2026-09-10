import { eq } from 'drizzle-orm';
import { Platform } from 'react-native';

import { db } from '@/db/client';
import { mockCategories } from '@/db/webMockData';
import { category, subcategory } from '@/db/schema';

export type CategoryWithSubcategories = typeof category.$inferSelect & {
  subcategories: (typeof subcategory.$inferSelect)[];
};

export async function listCategoriesWithSubcategories(): Promise<CategoryWithSubcategories[]> {
  if (Platform.OS === 'web') return mockCategories;

  const [categories, subcategories] = await Promise.all([
    db.select().from(category),
    db.select().from(subcategory),
  ]);

  return categories.map((cat) => ({
    ...cat,
    subcategories: subcategories.filter((sub) => sub.categoryId === cat.id),
  }));
}

export async function createSubcategory(categoryId: number, name: string) {
  if (Platform.OS === 'web') return { id: Date.now(), categoryId, name };

  const [row] = await db.insert(subcategory).values({ categoryId, name }).returning();
  return row;
}

export async function listSubcategoriesForCategory(categoryId: number) {
  if (Platform.OS === 'web') {
    return mockCategories.find((c) => c.id === categoryId)?.subcategories ?? [];
  }
  return db.select().from(subcategory).where(eq(subcategory.categoryId, categoryId));
}
