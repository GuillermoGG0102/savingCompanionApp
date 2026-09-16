import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { canUseBiometricsAsync, isAppLockEnabled, setAppLockEnabled } from '@/lib/appLock';
import { colors, typography } from '@/theme/tokens';

const theme = colors.light;

export function SecurityLockSetting() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    Promise.all([canUseBiometricsAsync(), isAppLockEnabled()]).then(([sup, en]) => {
      setSupported(sup);
      setEnabled(en);
    });
  }, []);

  async function toggle(value: boolean) {
    setEnabled(value);
    await setAppLockEnabled(value);
  }

  if (supported === null) return null;

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>Bloqueo con huella/Face ID</Text>
        <Text style={styles.sub}>
          {supported ? 'Pide desbloquear al abrir la app.' : 'Tu dispositivo no tiene huella/Face ID configurado.'}
        </Text>
      </View>
      <Switch value={enabled} onValueChange={toggle} disabled={!supported} trackColor={{ true: theme.accent, false: theme.border }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13, color: theme.textPrimary },
  sub: { fontFamily: typography.fontDisplay, fontSize: 11, color: theme.textMuted, marginTop: 2 },
});
