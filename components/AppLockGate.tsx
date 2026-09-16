import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { authenticateAsync, isAppLockEnabled } from '@/lib/appLock';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

/** Pantalla de bloqueo por huella/Face ID que envuelve toda la app, si el usuario lo activó en Ajustes. */
export function AppLockGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'locked' | 'unlocked'>('checking');

  async function tryUnlock() {
    const ok = await authenticateAsync();
    setState(ok ? 'unlocked' : 'locked');
  }

  useEffect(() => {
    isAppLockEnabled().then((enabled) => {
      if (!enabled) {
        setState('unlocked');
        return;
      }
      setState('locked');
      tryUnlock();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'checking') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (state === 'locked') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={styles.title}>Saving Companion está bloqueado</Text>
        <Pressable style={styles.button} onPress={tryUnlock}>
          <Text style={styles.buttonLabel}>Desbloquear</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  title: { fontFamily: typography.fontDisplay, fontSize: 16, fontWeight: '600', color: theme.textPrimary, textAlign: 'center' },
  button: { paddingVertical: 14, paddingHorizontal: spacing.lg, borderRadius: radius.lg, backgroundColor: theme.textPrimary },
  buttonLabel: { fontFamily: typography.fontDisplay, fontSize: 13.5, fontWeight: '600', color: theme.background },
});
