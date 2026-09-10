import { View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { colors } from '@/theme/tokens';

const theme = colors.light;

type Props = { data: { monthKey: string; netWorth: number }[] };

export function NetWorthLineChart({ data }: Props) {
  const points = data.map((d, i) => ({ x: i, netWorth: d.netWorth }));

  return (
    <View style={{ height: 90 }}>
      <CartesianChart data={points} xKey="x" yKeys={['netWorth']} domainPadding={{ top: 10, bottom: 10 }}>
        {({ points: p }) => <Line points={p.netWorth} color={theme.accent} strokeWidth={2.5} curveType="natural" />}
      </CartesianChart>
    </View>
  );
}
