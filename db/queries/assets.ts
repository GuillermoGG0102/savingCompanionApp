import { and, eq, or } from 'drizzle-orm';
import { Platform } from 'react-native';

import { db } from '@/db/client';
import { mockAssetHistory, mockAssets, mockTransfers } from '@/db/webMockData';
import { asset, assetSnapshot, assetTransfer } from '@/db/schema';
import { getPreviousMonthKey } from '@/lib/month';

export type AssetType = 'cash' | 'bank' | 'investment' | 'crypto' | 'other';

export async function createAssetWithSnapshot(data: { name: string; type: AssetType; icon?: string | null; value: number; monthKey: string }) {
  const [createdAsset] = await db
    .insert(asset)
    .values({ name: data.name, type: data.type, icon: data.icon ?? null })
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

/** Cada activo con el valor de su snapshot más reciente que sea igual o anterior a `monthKey`. */
export async function getAssetValuesAsOf(monthKey: string) {
  if (Platform.OS === 'web') return mockAssets.map((a) => ({ ...a, value: a.latestValue }));

  const [assets, snapshots] = await Promise.all([db.select().from(asset), db.select().from(assetSnapshot)]);

  return assets.map((a) => {
    const own = snapshots
      .filter((s) => s.assetId === a.id && s.monthKey <= monthKey)
      .sort((x, y) => y.monthKey.localeCompare(x.monthKey));
    return { ...a, value: own[0]?.value ?? 0 };
  });
}

/** Valor de un activo mes a mes, para la cara trasera de su tarjeta en Activos. */
export async function getAssetHistory(assetId: number, currentMonthKey: string, months = 6) {
  if (Platform.OS === 'web') return mockAssetHistory;

  const monthKeys: string[] = [currentMonthKey];
  let cursor = currentMonthKey;
  for (let i = 1; i < months; i++) {
    cursor = getPreviousMonthKey(cursor);
    monthKeys.unshift(cursor);
  }

  const snapshots = await db.select().from(assetSnapshot).where(eq(assetSnapshot.assetId, assetId));
  return monthKeys.map((monthKey) => {
    const own = snapshots.filter((s) => s.monthKey <= monthKey).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    return { monthKey, value: own[0]?.value ?? 0 };
  });
}

/** Movimientos registrados dentro de un mes concreto (para la reconciliación). */
export async function getTransfersInMonth(monthKey: string) {
  if (Platform.OS === 'web') return mockTransfers;
  const transfers = await db.select().from(assetTransfer);
  return transfers.filter((t) => t.date.startsWith(monthKey));
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

export async function updateAsset(id: number, data: { name: string; type: AssetType; icon?: string | null }) {
  if (Platform.OS === 'web') return;
  await db.update(asset).set({ ...data, icon: data.icon ?? null }).where(eq(asset.id, id));
}

/** Borra un activo junto con su histórico de valores y sus movimientos. */
export async function deleteAsset(id: number) {
  if (Platform.OS === 'web') return;
  await db.delete(assetSnapshot).where(eq(assetSnapshot.assetId, id));
  await db.delete(assetTransfer).where(or(eq(assetTransfer.fromAssetId, id), eq(assetTransfer.toAssetId, id)));
  await db.delete(asset).where(eq(asset.id, id));
}

export type TransferRow = Awaited<ReturnType<typeof listTransfers>>[number];

/** Movimientos de dinero entre activos, más recientes primero. */
export async function listTransfers() {
  if (Platform.OS === 'web') return mockTransfers;

  const [transfers, assets] = await Promise.all([db.select().from(assetTransfer), db.select().from(asset)]);
  const nameById = new Map(assets.map((a) => [a.id, a.name]));

  return transfers
    .map((t) => ({ ...t, fromName: nameById.get(t.fromAssetId) ?? '?', toName: nameById.get(t.toAssetId) ?? '?' }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

/** Transfiere dinero de un activo a otro, actualizando el valor actual de ambos y registrando el movimiento. */
export async function createTransfer(data: { fromAssetId: number; toAssetId: number; amount: number; date: string; monthKey: string }) {
  if (Platform.OS === 'web') return;

  const assets = await listAssetsWithLatestValue();
  const from = assets.find((a) => a.id === data.fromAssetId);
  const to = assets.find((a) => a.id === data.toAssetId);
  if (!from || !to) return;

  await upsertAssetSnapshot(data.fromAssetId, data.monthKey, from.latestValue - data.amount);
  await upsertAssetSnapshot(data.toAssetId, data.monthKey, to.latestValue + data.amount);
  await db.insert(assetTransfer).values({ fromAssetId: data.fromAssetId, toAssetId: data.toAssetId, amount: data.amount, date: data.date });
}
