import { View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { colors } from '@/theme/tokens';

const theme = colors.light;

type Props = { now: number[]; prev: number[] };

export function YoyLineChart({ now, prev }: Props) {
  const data = now.map((value, i) => ({ x: i, now: value, prev: prev[i] ?? 0 }));

  return (
    <View style={{ height: 120 }}>
      <CartesianChart data={data} xKey="x" yKeys={['now', 'prev']} domainPadding={{ top: 10, bottom: 10 }}>
        {({ points }) => (
          <>
            <Line points={points.prev} color={theme.textMuted} strokeWidth={1.5} opacity={0.6} curveType="natural" />
            <Line points={points.now} color={theme.accent} strokeWidth={2.6} curveType="natural" />
          </>
        )}
      </CartesianChart>
    </View>
  );
}
