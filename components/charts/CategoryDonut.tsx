import { StyleSheet, Text, View } from 'react-native';
import { Pie, PolarChart } from 'victory-native';

import type { CategorySlice } from '@/db/queries/dashboard';
import { formatCents } from '@/lib/money';
import { colors, typography } from '@/theme/tokens';

const theme = colors.light;
const SIZE = 104;

type Props = { data: CategorySlice[] };

export function CategoryDonut({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <View style={styles.row}>
      <View style={{ width: SIZE, height: SIZE }}>
        <PolarChart data={data} colorKey="color" labelKey="name" valueKey="amount">
          <Pie.Chart innerRadius="62%">{({ slice }) => <Pie.Slice />}</Pie.Chart>
        </PolarChart>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.centerLabel}>TOTAL</Text>
          <Text style={styles.centerValue}>{formatCents(total)}</Text>
        </View>
      </View>

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
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  center: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  centerLabel: { fontFamily: typography.fontMono, fontSize: 8, fontWeight: '600', color: theme.textMuted, letterSpacing: 1 },
  centerValue: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '700', color: theme.textPrimary, marginTop: 2 },
  legend: { flex: 1, gap: 7 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 2 },
  legendName: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 11.5, color: theme.textSecondary },
  legendValue: { fontFamily: typography.fontMono, fontSize: 11, fontWeight: '600', color: theme.textPrimary },
});
