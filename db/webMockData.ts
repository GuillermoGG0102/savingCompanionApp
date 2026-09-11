/**
 * Datos de ejemplo usados SOLO en web (ver db/client.web.ts): como
 * expo-sqlite no funciona de forma fiable en este target, las pantallas de
 * datos leen de aquí en vez de la base de datos real, únicamente para poder
 * hacer capturas de PREVIEW. El móvil real nunca pasa por este archivo.
 */
import type { CategoryWithSubcategories } from './queries/categories';

export const mockCategories: CategoryWithSubcategories[] = [
  {
    id: 1,
    name: 'Comida',
    icon: 'utensils',
    color: '#E0603C',
    kind: 'variable',
    subcategories: [
      { id: 1, categoryId: 1, name: 'Supermercado' },
      { id: 2, categoryId: 1, name: 'Restaurantes' },
      { id: 3, categoryId: 1, name: 'Bares y cafés' },
      { id: 4, categoryId: 1, name: 'Comida a domicilio' },
    ],
  },
  {
    id: 2,
    name: 'Transporte',
    icon: 'car',
    color: '#3F7DE0',
    kind: 'variable',
    subcategories: [
      { id: 5, categoryId: 2, name: 'Transporte público' },
      { id: 6, categoryId: 2, name: 'Combustible' },
    ],
  },
  {
    id: 3,
    name: 'Ocio',
    icon: 'ticket',
    color: '#7A6FF0',
    kind: 'variable',
    subcategories: [
      { id: 7, categoryId: 3, name: 'Cine y espectáculos' },
      { id: 8, categoryId: 3, name: 'Viajes' },
    ],
  },
  {
    id: 4,
    name: 'Deporte',
    icon: 'dumbbell',
    color: '#0E9E92',
    kind: 'variable',
    subcategories: [
      { id: 9, categoryId: 4, name: 'Gimnasio' },
      { id: 10, categoryId: 4, name: 'Equipamiento' },
      { id: 11, categoryId: 4, name: 'Actividades y clases' },
    ],
  },
  {
    id: 5,
    name: 'Hogar',
    icon: 'home',
    color: '#C9A227',
    kind: 'fixed',
    subcategories: [
      { id: 12, categoryId: 5, name: 'Alquiler / hipoteca' },
      { id: 13, categoryId: 5, name: 'Suministros' },
    ],
  },
  {
    id: 6,
    name: 'Salud',
    icon: 'heart-pulse',
    color: '#E0603C',
    kind: 'variable',
    subcategories: [{ id: 14, categoryId: 6, name: 'Farmacia' }],
  },
  {
    id: 7,
    name: 'Suscripciones',
    icon: 'repeat',
    color: '#0E9E92',
    kind: 'fixed',
    subcategories: [
      { id: 15, categoryId: 7, name: 'Streaming' },
      { id: 16, categoryId: 7, name: 'Software y apps' },
    ],
  },
  {
    id: 8,
    name: 'Otros',
    icon: 'more-horizontal',
    color: '#8A928E',
    kind: 'variable',
    subcategories: [{ id: 17, categoryId: 8, name: 'Imprevistos' }],
  },
];

export const mockFixedExpenses = [
  { id: 1, name: 'Alquiler', amount: 85000, dayOfMonth: 1, active: true, categoryId: 5, categoryName: 'Hogar', categoryIcon: 'home', categoryColor: '#C9A227' },
  { id: 2, name: 'Netflix', amount: 1599, dayOfMonth: 5, active: true, categoryId: 7, categoryName: 'Suscripciones', categoryIcon: 'repeat', categoryColor: '#0E9E92' },
  { id: 3, name: 'Gimnasio', amount: 3990, dayOfMonth: 3, active: true, categoryId: 4, categoryName: 'Deporte', categoryIcon: 'dumbbell', categoryColor: '#0E9E92' },
  { id: 4, name: 'Seguro médico', amount: 6400, dayOfMonth: 10, active: false, categoryId: 6, categoryName: 'Salud', categoryIcon: 'heart-pulse', categoryColor: '#E0603C' },
];

export const mockExpensesToday = [
  { id: 1, amount: 3420, subcategoryName: 'Supermercado', categoryName: 'Comida', categoryColor: '#E0603C' },
  { id: 2, amount: 480, subcategoryName: 'Bares y cafés', categoryName: 'Comida', categoryColor: '#E0603C' },
];

export const mockProfile = {
  id: 1,
  annualSalary: 3600000,
  monthlyNetPay: 210000,
  currency: 'EUR',
  payDayOfMonth: 25,
  savingsGoalPct: 25,
  netWorthGoal: 4000000,
  payPeriodsPerYear: 12,
};

// Mes que se muestra ya cerrado, y activos con el valor que tenían entonces.
import { getCurrentMonthKey, getPreviousMonthKey } from '@/lib/month';

const targetMonthKey = getPreviousMonthKey(getCurrentMonthKey());
const priorMonthKey = getPreviousMonthKey(targetMonthKey);

export const mockAssets = [
  { id: 1, name: 'Cuenta corriente', type: 'bank' as const, latestValue: 320000 },
  { id: 2, name: 'Efectivo', type: 'cash' as const, latestValue: 15000 },
  { id: 3, name: 'Fondo indexado', type: 'investment' as const, latestValue: 840000 },
];

export const mockAssetHistory = [
  { monthKey: '2026-04', value: 280000 },
  { monthKey: '2026-05', value: 292000 },
  { monthKey: '2026-06', value: 298000 },
  { monthKey: '2026-07', value: 305000 },
  { monthKey: '2026-08', value: 311000 },
  { monthKey: '2026-09', value: 320000 },
];

export const mockTransfers = [
  { id: 1, fromAssetId: 1, toAssetId: 3, amount: 20000, date: `${targetMonthKey}-15`, fromName: 'Cuenta corriente', toName: 'Fondo indexado' },
];

export const mockFixedTotal = mockFixedExpenses.filter((e) => e.active).reduce((sum, e) => sum + e.amount, 0);
export const mockVariableTotal = 42350;

export const mockMonthCloses = [
  {
    monthKey: priorMonthKey,
    income: 210000,
    fixedTotal: 90589,
    variableTotal: 35000,
    netWorth: 1175000,
    savingsRate: (210000 - 90589 - 35000) / 210000,
    closedAt: `${priorMonthKey}-01T00:00:00.000Z`,
  },
];

// Dashboard (F4)
export const mockCurrentNetWorth = 1225000;

export const mockNetWorthHistory = [
  { monthKey: '2026-03', netWorth: 1050000 },
  { monthKey: '2026-04', netWorth: 1080000 },
  { monthKey: '2026-05', netWorth: 1110000 },
  { monthKey: '2026-06', netWorth: 1140000 },
  { monthKey: '2026-07', netWorth: 1175000 },
  { monthKey: '2026-08', netWorth: 1218000 },
];

// Incluye tanto lo fijo (p.ej. el alquiler dentro de Hogar) como lo variable,
// igual que hace getCategoryBreakdown de verdad; la suma cuadra con
// mockFixedTotal + mockVariableTotal.
export const mockCategoryBreakdown = [
  { categoryId: 5, name: 'Hogar', color: '#C9A227', amount: 97690 },
  { categoryId: 1, name: 'Comida', color: '#E0603C', amount: 16920 },
  { categoryId: 4, name: 'Deporte', color: '#0E9E92', amount: 12450 },
  { categoryId: 8, name: 'Otros', color: '#8A928E', amount: 4280 },
  { categoryId: 7, name: 'Suscripciones', color: '#0E9E92', amount: 1599 },
];

const dailyThisMonth = [
  0, 3200, 3200, 8900, 8900, 8900, 15400, 15400, 21000, 21000, 26500, 34000, 34000, 34000, 41200, 41200, 42350,
];
export const mockDailyThisMonthCurve = [
  ...dailyThisMonth,
  ...new Array(28 - dailyThisMonth.length).fill(dailyThisMonth[dailyThisMonth.length - 1]),
];

export const mockDailyAverageCurve = Array.from({ length: 28 }, (_, i) => Math.round(((i + 1) / 28) * 35500));

// Análisis (Tanda 1): tasa de ahorro de los últimos 12 meses, en %.
export const mockSavingsRateSeries = [18.2, 22.5, 15.8, 27.1, 24.6, 12.3, 29.4, 31.0, 26.7, 20.1, 33.5, 30.4].map(
  (pct, i) => ({ monthKey: `2026-${String(i + 1).padStart(2, '0')}`, pct })
);

// Análisis (Tanda 2)
export const mockReconciliation = {
  prevMonthKey: priorMonthKey,
  patrimonioInicial: 1175000,
  ahorro: 92900,
  rendimiento: 15600,
  sinExplicar: mockCurrentNetWorth - 1175000 - 92900 - 15600,
  patrimonioFinal: mockCurrentNetWorth,
};

export const mockCategoryAnomalies = [
  { categoryId: 5, name: 'Hogar', color: '#C9A227', amount: 97690, pct: 1, meanPos: 0.97, isAnomaly: false, z: 0.2 },
  { categoryId: 1, name: 'Comida', color: '#E0603C', amount: 41200, pct: 0.42, meanPos: 0.27, isAnomaly: true, z: 1.9 },
  { categoryId: 3, name: 'Ocio', color: '#7A6FF0', amount: 18600, pct: 0.19, meanPos: 0.16, isAnomaly: false, z: 0.3 },
  { categoryId: 4, name: 'Deporte', color: '#0E9E92', amount: 9500, pct: 0.1, meanPos: 0.12, isAnomaly: false, z: 0.5 },
  { categoryId: 2, name: 'Transporte', color: '#3F7DE0', amount: 8800, pct: 0.09, meanPos: 0.14, isAnomaly: false, z: 0.6 },
];

export const mockCategoryHistory = [
  { monthKey: '2026-04', amount: 15600 },
  { monthKey: '2026-05', amount: 18200 },
  { monthKey: '2026-06', amount: 14300 },
  { monthKey: '2026-07', amount: 21000 },
  { monthKey: '2026-08', amount: 19800 },
  { monthKey: '2026-09', amount: 41200 },
];

export const mockSubcategoryBreakdown = [
  { subcategoryId: 1, name: 'Supermercado', amount: 28900 },
  { subcategoryId: 2, name: 'Restaurantes', amount: 8100 },
  { subcategoryId: 3, name: 'Bares y cafés', amount: 3200 },
  { subcategoryId: 4, name: 'Comida a domicilio', amount: 1000 },
];

// Análisis (Tanda 3)
export const mockYoyComparison = {
  locked: false,
  mesesFaltan: 0,
  mes: [
    { name: 'Ingresos', prev: 238000, now: 245000 },
    { name: 'Fijos', prev: 108000, now: 113400 },
    { name: 'Variables', prev: 90000, now: 88400 },
    { name: 'Ahorro', prev: 40000, now: 43200 },
  ],
  ytdNow: [43200, 86400, 132600, 178100, 220800, 268400, 310900, 356200, 401700],
  ytdPrev: [35000, 71200, 108500, 145900, 183200, 220600, 258100, 296400, 335800],
};

export const mockHeatmapGasto = [
  { year: '2025', cells: [78000, 76000, 82000, 79000, 81000, 70000, 98000, 145000, 90000, 87000, 91000, 136000] },
  { year: '2026', cells: [79000, 76200, 88000, 101000, 83500, 109000, 104800, 138000, 88400, null, null, null] },
];

export const mockHeatmapAhorro = [
  { year: '2025', cells: [28.4, 29.1, 24.8, 27.6, 25.9, 32.1, 18.4, 8.2, 22.6, 24.1, 23.0, 12.5] },
  { year: '2026', cells: [27.9, 28.8, 23.5, 20.1, 26.4, 19.2, 20.8, 15.0, 30.4, null, null, null] },
];

export const mockAdditionalIncome = [
  { id: 1, amount: 45000, date: `${getCurrentMonthKey()}-03`, note: 'Trabajo freelance' },
];

export const mockCategoryByDayOfWeek = [
  { label: 'L', amount: 4200 },
  { label: 'M', amount: 3100 },
  { label: 'X', amount: 5600 },
  { label: 'J', amount: 4800 },
  { label: 'V', amount: 7900 },
  { label: 'S', amount: 9800 },
  { label: 'D', amount: 5800 },
];
