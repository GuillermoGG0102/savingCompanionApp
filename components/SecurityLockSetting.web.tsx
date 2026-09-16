import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/theme/tokens';

const theme = colors.light;

export function SecurityLockSetting() {
  return (
    <View>
      <Text style={styles.label}>Bloqueo con huella/Face ID</Text>
      <Text style={styles.sub}>Disponible solo en la app instalada en tu móvil.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13, color: theme.textPrimary },
  sub: { fontFamily: typography.fontDisplay, fontSize: 11, color: theme.textMuted, marginTop: 2 },
});
