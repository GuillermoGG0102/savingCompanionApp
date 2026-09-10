import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { formatCents } from '@/lib/money';
import { colors, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

export default function RegistrarGastoConfirmacion() {
  const { subcategoryName, categoryName, amountCents } = useLocalSearchParams<{
    subcategoryName: string;
    categoryName: string;
    amountCents: string;
  }>();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <View style={styles.check}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.big}>Guardado</Text>
        <Text style={styles.small}>
          {formatCents(Number(amountCents))} en {categoryName} · {subcategoryName}
        </Text>
        <Button
          label="Registrar otro gasto"
          variant="secondary"
          onPress={() => router.replace('/registrar-gasto')}
          style={{ marginTop: spacing.lg }}
        />
        <Button label="Volver al inicio" variant="ghost" onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  pad: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 6 },
  check: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  checkMark: { color: theme.background, fontSize: 24, fontWeight: '600' },
  big: { fontFamily: typography.fontDisplay, fontSize: 20, fontWeight: '600', color: theme.textPrimary },
  small: { fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textSecondary, textAlign: 'center' },
});
