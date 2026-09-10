import { StyleSheet, Text, View } from 'react-native';

import type { CategorySlice } from '@/db/queries/dashboard';
import { formatCents } from '@/lib/money';
import { colors, typography } from '@/theme/tokens';

const theme = colors.light;

/** Ver nota en NetWorthLineChart.web.tsx: solo para capturas de PREVIEW. */
type Props = { data: CategorySlice[] };

export function CategoryDonut({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.stackedBar}>
        {data.map((d) => (
          <View key={d.categoryId} style={{ flex: d.amount, backgroundColor: d.color }} />
        ))}
      </View>
      <Text style={styles.total}>{formatCents(total)}</Text>
      <View style={styles.legend}>
        {data.map((d) => (
          <View key={d.categoryId} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: d.color }]} />
            <Text style={styles.legendName}>{d.name}</Text>
            <Text style={styles.legendValue}>{total > 0 ? Math.round((d.amount / total) * 100) : 0}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stackedBar: { height: 14, borderRadius: 7, overflow: 'hidden', flexDirection: 'row' },
  total: { fontFamily: typography.fontDisplay, fontSize: 13, fontWeight: '700', color: theme.textPrimary },
  legend: { gap: 7 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 2 },
  legendName: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 11.5, color: theme.textSecondary },
  legendValue: { fontFamily: typography.fontMono, fontSize: 11, fontWeight: '600', color: theme.textPrimary },
});
