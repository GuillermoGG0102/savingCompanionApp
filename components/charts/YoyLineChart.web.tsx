import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

const theme = colors.light;

/** Ver nota en NetWorthLineChart.web.tsx: solo para capturas de PREVIEW. */
type Props = { now: number[]; prev: number[] };

export function YoyLineChart({ now, prev }: Props) {
  const max = Math.max(...now, ...prev, 1);

  return (
    <View style={styles.row}>
      {now.map((value, i) => (
        <View key={i} style={styles.barWrap}>
          <View style={[styles.barMuted, { height: `${((prev[i] ?? 0) / max) * 100}%` }]} />
          <View style={[styles.bar, { height: `${(value / max) * 100}%` }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  barWrap: { flex: 1, height: '100%', position: 'relative' },
  bar: { position: 'absolute', bottom: 0, left: '22.5%', right: '22.5%', backgroundColor: theme.accent, borderRadius: 3, minHeight: 3 },
  barMuted: { position: 'absolute', bottom: 0, left: '5%', right: '5%', backgroundColor: theme.textMuted, opacity: 0.3, borderRadius: 3, minHeight: 3 },
});
