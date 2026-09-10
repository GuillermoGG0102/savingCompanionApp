import { db } from '@/db/client';
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
