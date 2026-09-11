import { StyleSheet, Text, View } from 'react-native';

import type { PatrimonioComposicion } from '@/db/queries/analysis';
import { colors, typography } from '@/theme/tokens';

const theme = colors.light;
const CLASE_COLORS: Record<string, string> = { Líquido: '#0E9E92', Inversión: '#7A6FF0', Cripto: '#C9A227' };

/** Ver nota en NetWorthLineChart.web.tsx: solo para capturas de PREVIEW. */
type Props = { data: PatrimonioComposicion };

export function PatrimonioDonut({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.bar}>
        {data
          .filter((d) => d.amount > 0)
          .map((d) => (
            <View key={d.clase} style={{ flex: d.amount, backgroundColor: CLASE_COLORS[d.clase] }} />
          ))}
      </View>
      <View style={{ gap: 8 }}>
        {data.map((d) => (
          <View key={d.clase} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: CLASE_COLORS[d.clase] }]} />
            <Text style={styles.legendName}>{d.clase}</Text>
            <Text style={styles.legendValue}>{total > 0 ? ((d.amount / total) * 100).toFixed(1) : '0'}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 2 },
  legendName: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12, color: theme.textPrimary },
  legendValue: { fontFamily: typography.fontMono, fontSize: 11.5, fontWeight: '600', color: theme.textPrimary },
});
