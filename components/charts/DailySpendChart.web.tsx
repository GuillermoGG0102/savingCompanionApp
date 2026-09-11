import { StyleSheet, Text, View } from 'react-native';

import { formatCents } from '@/lib/money';
import { colors, typography } from '@/theme/tokens';

const theme = colors.light;

/** Ver nota en NetWorthLineChart.web.tsx: solo para capturas de PREVIEW. */
type Props = { thisMonth: number[]; average: number[] };

export function DailySpendChart({ thisMonth, average }: Props) {
  const max = Math.max(...thisMonth, ...average, 1);
  const step = 3;
  const sampled = thisMonth.filter((_, i) => i % step === 0);
  const sampledAvg = average.filter((_, i) => i % step === 0);
  const sampledDays = thisMonth.map((_, i) => i + 1).filter((_, i) => i % step === 0);

  return (
    <View>
      <View style={styles.row}>
        {sampled.map((value, i) => (
          <View key={i} style={styles.barWrap}>
            <View style={[styles.barMuted, { height: `${(sampledAvg[i] / max) * 100}%` }]} />
            <View style={[styles.bar, { height: `${(value / max) * 100}%` }]} />
          </View>
        ))}
      </View>
      <View style={styles.labelsRow}>
        {sampledDays.map((day) => (
          <Text key={day} style={styles.label}>
            {day}
          </Text>
        ))}
      </View>
      <Text style={styles.caption}>0 — {formatCents(max)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 90, flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  barWrap: { flex: 1, height: '100%', position: 'relative' },
  bar: { position: 'absolute', bottom: 0, left: '22.5%', right: '22.5%', backgroundColor: theme.negative, borderRadius: 3, minHeight: 3 },
  barMuted: { position: 'absolute', bottom: 0, left: '5%', right: '5%', backgroundColor: theme.textMuted, opacity: 0.3, borderRadius: 3, minHeight: 3 },
  labelsRow: { flexDirection: 'row', gap: 5, marginTop: 4 },
  label: { flex: 1, fontFamily: typography.fontMono, fontSize: 8.5, color: theme.textMuted, textAlign: 'center' },
  caption: { fontFamily: typography.fontMono, fontSize: 9.5, color: theme.textMuted, textAlign: 'center', marginTop: 6 },
});
