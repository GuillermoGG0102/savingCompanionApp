import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono';
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLockGate } from '@/components/AppLockGate';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { seedDefaultCategories } from '@/db/seed';
import { colors, typography } from '@/theme/tokens';

const theme = colors.light;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Space Grotesk': SpaceGrotesk_600SemiBold,
    'IBM Plex Mono': IBMPlexMono_600SemiBold,
  });
  const { success: migrationsDone, error: migrationError } = useMigrations(db, migrations);
  const [seedError, setSeedError] = useState<Error | null>(null);
  const [seedDone, setSeedDone] = useState(false);

  useEffect(() => {
    if (!migrationsDone) return;
    seedDefaultCategories(db)
      .then(() => setSeedDone(true))
      .catch((err: Error) => setSeedError(err));
  }, [migrationsDone]);

  const error = migrationError ?? seedError ?? fontError;
  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.negative, fontFamily: typography.fontDisplay }}>
          No se ha podido preparar la base de datos: {error.message}
        </Text>
      </View>
    );
  }

  if (!migrationsDone || !seedDone || !fontsLoaded) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppLockGate>
          <Stack screenOptions={{ headerShown: false }} />
        </AppLockGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
