import { StyleSheet, Text, View } from 'react-native';

import { formatCents } from '@/lib/money';
import { colors, typography } from '@/theme/tokens';

const theme = colors.light;

/**
 * react-native-skia no carga en web sin configuración adicional de
 * WebAssembly (misma limitación que expo-sqlite en F1). Esta versión solo
 * se usa para las capturas de PREVIEW; el móvil real usa el gráfico Skia.
 */
type Props = { data: { monthKey: string; netWorth: number }[] };

export function NetWorthLineChart({ data }: Props) {
  const max = Math.max(...data.map((d) => d.netWorth), 1);

  return (
    <View>
      <View style={styles.row}>
        {data.map((d, i) => (
          <View key={d.monthKey} style={styles.barWrap}>
            <View style={[styles.bar, { height: `${(d.netWorth / max) * 100}%`, opacity: 0.4 + (i / data.length) * 0.6 }]} />
          </View>
        ))}
      </View>
      <View style={styles.labelsRow}>
        {data.map((d) => (
          <Text key={d.monthKey} style={styles.label} numberOfLines={1}>
            {d.monthKey.slice(5)}
          </Text>
        ))}
      </View>
      <Text style={styles.caption}>
        {formatCents(Math.min(...data.map((d) => d.netWorth)))} — {formatCents(max)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 90, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barWrap: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { backgroundColor: theme.accent, borderRadius: 3, minHeight: 3 },
  labelsRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  label: { flex: 1, fontFamily: typography.fontMono, fontSize: 8.5, color: theme.textMuted, textAlign: 'center' },
  caption: { fontFamily: typography.fontMono, fontSize: 9.5, color: theme.textMuted, textAlign: 'center', marginTop: 6 },
});
