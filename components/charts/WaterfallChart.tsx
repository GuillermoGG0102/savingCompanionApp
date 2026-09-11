import { StyleSheet, Text, View } from 'react-native';

import type { Reconciliation } from '@/db/queries/analysis';
import { formatCents } from '@/lib/money';
import { colors, typography } from '@/theme/tokens';

const theme = colors.light;
const TRACK_HEIGHT = 100;

type Props = { data: Reconciliation; currency: string };

export function WaterfallChart({ data, currency }: Props) {
  const { patrimonioInicial, ahorro, rendimiento, sinExplicar, patrimonioFinal } = data;

  const steps = [
    { name: 'Patrimonio inicial', delta: 0, color: theme.textMuted },
    { name: 'Ahorro del mes', delta: ahorro, color: theme.accent },
    { name: 'Rendimiento', delta: rendimiento, color: theme.accentStrong },
    { name: 'Sin explicar', delta: sinExplicar, color: theme.negative },
  ];

  let cum = patrimonioInicial;
  const bars = steps.map((step) => {
    const start = cum;
    cum += step.delta;
    return { ...step, start, end: cum };
  });

  const allValues = [...bars.flatMap((b) => [b.start, b.end]), patrimonioFinal];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues, 1);
  const trackMin = min - (max - min || max) * 0.15;
  const range = max - trackMin || 1;

  bars.push({ name: 'Patrimonio final', delta: patrimonioFinal, color: theme.textPrimary, start: trackMin, end: patrimonioFinal });

  return (
    <View style={styles.row}>
      {bars.map((b, i) => {
        const top = Math.max(b.start, b.end);
        const bottom = Math.min(b.start, b.end);
        const heightPct = Math.max(2, ((top - bottom) / range) * 100);
        const bottomPct = ((bottom - trackMin) / range) * 100;
        return (
          <View key={i} style={styles.col}>
            <Text style={[styles.value, { color: i === 0 ? theme.textMuted : b.delta >= 0 ? theme.accent : theme.negative }]} numberOfLines={1}>
              {i === 0 || i === bars.length - 1 ? formatCents(b.end, currency) : `${b.delta >= 0 ? '+' : ''}${formatCents(b.delta, currency)}`}
            </Text>
            <View style={styles.track}>
              <View style={[styles.bar, { height: `${heightPct}%`, bottom: `${bottomPct}%`, backgroundColor: b.color }]} />
            </View>
            <Text style={styles.name}>{b.name}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: TRACK_HEIGHT + 46 },
  col: { flex: 1, alignItems: 'center', gap: 6, height: '100%' },
  value: { fontFamily: typography.fontMono, fontSize: 9, fontWeight: '600' },
  track: { width: '100%', height: TRACK_HEIGHT, position: 'relative' },
  bar: { position: 'absolute', left: 0, right: 0, borderRadius: 5 },
  name: { fontFamily: typography.fontDisplay, fontSize: 9, color: theme.textMuted, textAlign: 'center' },
});
