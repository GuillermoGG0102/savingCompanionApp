import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

const theme = colors.light;

/** Ver nota en NetWorthLineChart.web.tsx: solo para capturas de PREVIEW. */
type Props = { data: number[]; width?: number; height?: number };

export function MiniSparkline({ data, width = 76, height = 32 }: Props) {
  const max = Math.max(...data, 1);

  return (
    <View style={[styles.row, { width, height }]}>
      {data.map((value, i) => (
        <View key={i} style={styles.barWrap}>
          <View style={[styles.bar, { height: `${Math.max(8, (value / max) * 100)}%` }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barWrap: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { backgroundColor: theme.accent, borderRadius: 2, minHeight: 2 },
});
