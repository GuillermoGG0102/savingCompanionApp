import { and, eq } from 'drizzle-orm';
import { Platform } from 'react-native';

import { db } from '@/db/client';
import { mockAssets } from '@/db/webMockData';
import { asset, assetSnapshot } from '@/db/schema';

export type AssetType = 'cash' | 'bank' | 'investment' | 'crypto' | 'other';

export async function createAssetWithSnapshot(data: { name: string; type: AssetType; value: number; monthKey: string }) {
  const [createdAsset] = await db
    .insert(asset)
    .values({ name: data.name, type: data.type })
    .returning();

  await db.insert(assetSnapshot).values({
    assetId: createdAsset.id,
    monthKey: data.monthKey,
    value: data.value,
  });

  return createdAsset;
}

export async function listAssets() {
  return db.select().from(asset);
}

/** Cada activo con el valor de su snapshot más reciente (para precargar el cierre mensual). */
export async function listAssetsWithLatestValue() {
  if (Platform.OS === 'web') return mockAssets;

  const [assets, snapshots] = await Promise.all([db.select().from(asset), db.select().from(assetSnapshot)]);

  return assets.map((a) => {
    const own = snapshots
      .filter((s) => s.assetId === a.id)
      .sort((x, y) => y.monthKey.localeCompare(x.monthKey));
    return { ...a, latestValue: own[0]?.value ?? 0 };
  });
}

export async function getAssetSnapshotsForMonth(monthKey: string) {
  return db.select().from(assetSnapshot).where(eq(assetSnapshot.monthKey, monthKey));
}

/** Guarda el valor de un activo para un mes, sobrescribiendo si ya existía. */
export async function upsertAssetSnapshot(assetId: number, monthKey: string, value: number) {
  if (Platform.OS === 'web') return;

  const existing = await db
    .select()
    .from(assetSnapshot)
    .where(and(eq(assetSnapshot.assetId, assetId), eq(assetSnapshot.monthKey, monthKey)));

  if (existing[0]) {
    await db.update(assetSnapshot).set({ value }).where(eq(assetSnapshot.id, existing[0].id));
  } else {
    await db.insert(assetSnapshot).values({ assetId, monthKey, value });
  }
}
