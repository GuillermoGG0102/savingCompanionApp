import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { formatMonthLabel } from '@/lib/month';
import { formatCents } from '@/lib/money';
import { colors, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

export default function CierreMensualResultado() {
  const { monthKey, savings, netWorth, savingsRate, delta } = useLocalSearchParams<{
    monthKey: string;
    savings: string;
    netWorth: string;
    savingsRate: string;
    delta: string;
  }>();

  const savingsNum = Number(savings);
  const deltaNum = delta ? Number(delta) : null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <View style={styles.check}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.big}>{formatMonthLabel(monthKey)} cerrado</Text>
        <Text style={styles.small}>Esto es lo que ha pasado este mes</Text>

        <View style={styles.grid}>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Ahorro del mes</Text>
            <Text style={[styles.tileValue, savingsNum >= 0 ? styles.pos : styles.neg]}>{formatCents(savingsNum)}</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Patrimonio total</Text>
            <Text style={styles.tileValue}>{formatCents(Number(netWorth))}</Text>
          </View>
          {deltaNum !== null && (
            <View style={styles.tile}>
              <Text style={styles.tileLabel}>Variación vs. mes anterior</Text>
              <Text style={[styles.tileValue, deltaNum >= 0 ? styles.pos : styles.neg]}>{formatCents(deltaNum)}</Text>
            </View>
          )}
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Tasa de ahorro</Text>
            <Text style={styles.tileValue}>{(Number(savingsRate) * 100).toFixed(1)} %</Text>
          </View>
        </View>

        <View style={styles.spacer} />
        <Button
          label="Editar este cierre"
          variant="secondary"
          onPress={() => router.replace({ pathname: '/cierre-mensual', params: { monthKey } })}
        />
        <Button label="Volver al inicio" onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  pad: { flex: 1, padding: spacing.xl, alignItems: 'center' },
  check: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: 6,
  },
  checkMark: { color: theme.background, fontSize: 24, fontWeight: '600' },
  big: { fontFamily: typography.fontDisplay, fontSize: 20, fontWeight: '600', color: theme.textPrimary },
  small: { fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textSecondary, marginBottom: spacing.lg },
  grid: { width: '100%', gap: 10 },
  tile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tileLabel: { fontFamily: typography.fontMono, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: theme.textMuted },
  tileValue: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 16, color: theme.textPrimary },
  pos: { color: theme.accent },
  neg: { color: theme.negative },
  spacer: { flex: 1 },
});
