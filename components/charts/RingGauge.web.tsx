import { StyleSheet, Text, View } from 'react-native';

import { typography } from '@/theme/tokens';

const SIZE = 76;

/** Ver nota en NetWorthLineChart.web.tsx: solo para capturas de PREVIEW. */
type Props = { achievedPct: number; centerLabel: string };

export function RingGauge({ centerLabel }: Props) {
  return (
    <View style={styles.circle}>
      <Text style={styles.label}>{centerLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 7,
    borderColor: 'rgba(244,241,234,0.35)',
    borderTopColor: '#5FE9DC',
    borderRightColor: '#5FE9DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: typography.fontMono, fontSize: 13, fontWeight: '600', color: '#F4F1EA' },
});
