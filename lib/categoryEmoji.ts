/**
 * Emoji de respaldo por categoría mientras no haya una librería de iconos
 * en el stack (no está en el stack cerrado; usar emoji evita añadir una
 * dependencia nueva solo para esto).
 */
const EMOJI_BY_CATEGORY: Record<string, string> = {
  Comida: '🍽️',
  Transporte: '🚌',
  Ocio: '🎟️',
  Deporte: '🏋️',
  Hogar: '🏠',
  Salud: '❤️',
  Suscripciones: '🔁',
  Otros: '➕',
};

export function getCategoryEmoji(categoryName: string): string {
  return EMOJI_BY_CATEGORY[categoryName] ?? '•';
}
