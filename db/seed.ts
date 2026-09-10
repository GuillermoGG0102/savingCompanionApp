import type { db as DbClient } from './client';
import { category, subcategory } from './schema';

/**
 * Categorías y subcategorías por defecto. Colores usados solo como señal
 * (ver criterios de UI): aquí son identificativos de categoría, no de estado.
 */
const DEFAULT_CATEGORIES: {
  name: string;
  icon: string;
  color: string;
  kind: 'fixed' | 'variable';
  subcategories: string[];
}[] = [
  {
    name: 'Comida',
    icon: 'utensils',
    color: '#E0603C',
    kind: 'variable',
    subcategories: ['Supermercado', 'Restaurantes', 'Bares y cafés', 'Comida a domicilio'],
  },
  {
    name: 'Transporte',
    icon: 'car',
    color: '#3F7DE0',
    kind: 'variable',
    subcategories: ['Transporte público', 'Combustible', 'Taxi / VTC', 'Parking y peajes'],
  },
  {
    name: 'Ocio',
    icon: 'ticket',
    color: '#7A6FF0',
    kind: 'variable',
    subcategories: ['Cine y espectáculos', 'Viajes', 'Hobbies', 'Salidas nocturnas'],
  },
  {
    name: 'Deporte',
    icon: 'dumbbell',
    color: '#0E9E92',
    kind: 'variable',
    subcategories: ['Gimnasio', 'Equipamiento', 'Actividades y clases'],
  },
  {
    name: 'Hogar',
    icon: 'home',
    color: '#C9A227',
    kind: 'fixed',
    subcategories: ['Alquiler / hipoteca', 'Suministros', 'Mantenimiento', 'Muebles y menaje'],
  },
  {
    name: 'Salud',
    icon: 'heart-pulse',
    color: '#E0603C',
    kind: 'variable',
    subcategories: ['Farmacia', 'Consultas médicas', 'Seguro médico'],
  },
  {
    name: 'Suscripciones',
    icon: 'repeat',
    color: '#0E9E92',
    kind: 'fixed',
    subcategories: ['Streaming', 'Software y apps', 'Prensa y revistas'],
  },
  {
    name: 'Otros',
    icon: 'more-horizontal',
    color: '#8A928E',
    kind: 'variable',
    subcategories: ['Regalos', 'Imprevistos', 'Sin clasificar'],
  },
];

export async function seedDefaultCategories(db: typeof DbClient): Promise<void> {
  const existing = await db.select().from(category).limit(1);
  if (existing.length > 0) return;

  for (const { name, icon, color, kind, subcategories } of DEFAULT_CATEGORIES) {
    const [inserted] = await db
      .insert(category)
      .values({ name, icon, color, kind })
      .returning({ id: category.id });

    await db
      .insert(subcategory)
      .values(subcategories.map((subName) => ({ categoryId: inserted.id, name: subName })));
  }
}
