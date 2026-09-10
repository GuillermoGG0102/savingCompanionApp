import { Platform } from 'react-native';

import { db } from '@/db/client';
import { mockProfile } from '@/db/webMockData';
import { profile } from '@/db/schema';

export type NewProfile = {
  annualSalary: number;
  monthlyNetPay: number;
  currency: string;
  payDayOfMonth: number;
};

export async function getProfile() {
  if (Platform.OS === 'web') return mockProfile;

  const rows = await db.select().from(profile).limit(1);
  return rows[0] ?? null;
}

export async function createProfile(data: NewProfile) {
  const [row] = await db.insert(profile).values(data).returning();
  return row;
}
