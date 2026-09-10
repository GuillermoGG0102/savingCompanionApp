import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const sqlite = openDatabaseSync('saving-companion.db', { enableChangeListener: false });

export const db = drizzle(sqlite, { schema });
