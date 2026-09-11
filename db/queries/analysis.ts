import { Platform } from 'react-native';

import { db } from '@/db/client';
import { monthClose } from '@/db/schema';
import { mockSavingsRateSeries } from '@/db/webMockData';
import { listAssetsWithLatestValue, type AssetType } from './assets';
import { computeFixedTotal, computeVariableTotal } from './monthClose';
import { getProfile } from './profile';

function savingsPct(income: number, fixedTotal: number, variableTotal: number): number {
  return income ? ((income - fixedTotal - variableTotal) / income) * 100 : 0;
}

/** Tasa de ahorro mes a mes (histórico cerrado + el mes actual en curso), en %. */
export async function getSavingsRateSeries(currentMonthKey: string, limit = 12): Promise<{ monthKey: string; pct: number }[]> {
  if (Platform.OS === 'web') return mockSavingsRateSeries;

  const [closes, profile, fixedTotal, variableTotal] = await Promise.all([
    db.select().from(monthClose),
    getProfile(),
    computeFixedTotal(),
    computeVariableTotal(currentMonthKey),
  ]);

  const series = closes
    .filter((c) => c.monthKey !== currentMonthKey)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((c) => ({ monthKey: c.monthKey, pct: savingsPct(c.income, c.fixedTotal, c.variableTotal) }));

  if (profile) {
    series.push({ monthKey: currentMonthKey, pct: savingsPct(profile.monthlyNetPay, fixedTotal, variableTotal) });
  }

  return series.slice(-limit);
}

const CLASE_BY_TYPE: Record<AssetType, 'Líquido' | 'Inversión' | 'Cripto'> = {
  cash: 'Líquido',
  bank: 'Líquido',
  other: 'Líquido',
  investment: 'Inversión',
  crypto: 'Cripto',
};

export type PatrimonioComposicion = { clase: 'Líquido' | 'Inversión' | 'Cripto'; amount: number }[];

/** Agrupa los activos actuales por clase (Líquido / Inversión / Cripto) según su tipo. */
export async function getPatrimonioComposicion(): Promise<PatrimonioComposicion> {
  const assets = await listAssetsWithLatestValue();
  const grouped = { Líquido: 0, Inversión: 0, Cripto: 0 };
  for (const a of assets) grouped[CLASE_BY_TYPE[a.type as AssetType]] += a.latestValue;
  return (['Líquido', 'Inversión', 'Cripto'] as const).map((clase) => ({ clase, amount: grouped[clase] }));
}

/** Meses de gasto mensual cubiertos con los activos líquidos actuales. */
export async function getSafetyRunway(currentMonthKey: string): Promise<{ meses: number; liquido: number; iliquido: number }> {
  const [composicion, fixedTotal, variableTotal] = await Promise.all([
    getPatrimonioComposicion(),
    computeFixedTotal(),
    computeVariableTotal(currentMonthKey),
  ]);

  const liquido = composicion.find((c) => c.clase === 'Líquido')?.amount ?? 0;
  const iliquido = composicion.reduce((sum, c) => sum + c.amount, 0) - liquido;
  const burnMensual = fixedTotal + variableTotal;

  return { meses: burnMensual ? liquido / burnMensual : 0, liquido, iliquido };
}
