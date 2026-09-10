import { View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { colors } from '@/theme/tokens';

const theme = colors.light;

type Props = { thisMonth: number[]; average: number[] };

export function DailySpendChart({ thisMonth, average }: Props) {
  const data = thisMonth.map((value, i) => ({ day: i + 1, thisMonth: value, average: average[i] ?? 0 }));

  return (
    <View style={{ height: 90 }}>
      <CartesianChart data={data} xKey="day" yKeys={['thisMonth', 'average']} domainPadding={{ top: 10, bottom: 10 }}>
        {({ points }) => (
          <>
            <Line points={points.average} color={theme.textMuted} strokeWidth={1.5} opacity={0.6} curveType="natural" />
            <Line points={points.thisMonth} color={theme.negative} strokeWidth={2.5} curveType="natural" />
          </>
        )}
      </CartesianChart>
    </View>
  );
}
