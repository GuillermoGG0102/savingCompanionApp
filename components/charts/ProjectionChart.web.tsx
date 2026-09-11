import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

const theme = colors.light;

/** Ver nota en NetWorthLineChart.web.tsx: solo para capturas de PREVIEW. */
type Props = { conserv: number[]; actual: number[]; optim: number[] };

export function ProjectionChart({ conserv, actual, optim }: Props) {
  const max = Math.max(...conserv, ...actual, ...optim, 1);
  const step = 4;
  const sample = (arr: number[]) => arr.filter((_, i) => i % step === 0);

  const sConserv = sample(conserv);
  const sActual = sample(actual);
  const sOptim = sample(optim);

  return (
    <View style={styles.row}>
      {sActual.map((value, i) => (
        <View key={i} style={styles.barWrap}>
          <View style={[styles.bar, styles.barOptim, { height: `${(sOptim[i] / max) * 100}%` }]} />
          <View style={[styles.bar, styles.barActual, { height: `${(value / max) * 100}%` }]} />
          <View style={[styles.bar, styles.barConserv, { height: `${(sConserv[i] / max) * 100}%` }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 130, flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  barWrap: { flex: 1, height: '100%', position: 'relative' },
  bar: { position: 'absolute', bottom: 0, borderRadius: 3, minHeight: 3, width: 3 },
  barConserv: { left: '20%', backgroundColor: theme.textMuted, opacity: 0.5 },
  barActual: { left: '48%', backgroundColor: theme.accent },
  barOptim: { left: '76%', backgroundColor: '#7A6FF0' },
});
