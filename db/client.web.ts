/**
 * En web no se abre SQLite real (ver app/_layout.web.tsx): este archivo
 * solo existe para que Metro no ejecute expo-sqlite al empaquetar para web,
 * ya que expo-router incluye _layout.tsx (nativo) en el grafo del bundle
 * web aunque no se llegue a renderizar.
 */
export const db = null as never;
export const sqlite = null as never;
