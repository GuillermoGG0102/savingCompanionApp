const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Las migraciones de Drizzle se importan como texto plano (.sql).
config.resolver.sourceExts.push('sql');
// expo-sqlite en web usa un módulo WebAssembly (wa-sqlite) como asset.
config.resolver.assetExts.push('wasm');

module.exports = config;
