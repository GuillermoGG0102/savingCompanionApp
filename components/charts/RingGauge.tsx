import { StyleSheet, Text, View } from 'react-native';
import { Pie, PolarChart } from 'victory-native';

import { typography } from '@/theme/tokens';

const SIZE = 76;

type Props = { achievedPct: number; centerLabel: string };

export function RingGauge({ achievedPct, centerLabel }: Props) {
  const clamped = Math.max(0.5, Math.min(99.5, achievedPct));
  const data = [
    { key: 'done', value: clamped, color: '#5FE9DC' },
    { key: 'rest', value: 100 - clamped, color: 'rgba(244,241,234,0.15)' },
  ];

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <PolarChart data={data} colorKey="color" labelKey="key" valueKey="value">
        <Pie.Chart innerRadius="76%">{() => <Pie.Slice />}</Pie.Chart>
      </PolarChart>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.label}>{centerLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: typography.fontMono, fontSize: 13, fontWeight: '600', color: '#F4F1EA' },
});
