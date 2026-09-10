import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

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
    <View style={styles.row}>
      {data.map((d, i) => (
        <View key={d.monthKey} style={styles.barWrap}>
          <View style={[styles.bar, { height: `${(d.netWorth / max) * 100}%`, opacity: 0.4 + (i / data.length) * 0.6 }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 90, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barWrap: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { backgroundColor: theme.accent, borderRadius: 3, minHeight: 3 },
});
