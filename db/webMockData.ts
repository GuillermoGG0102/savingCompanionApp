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

export const mockProfile = {
  id: 1,
  annualSalary: 3600000,
  monthlyNetPay: 210000,
  currency: 'EUR',
  payDayOfMonth: 25,
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
