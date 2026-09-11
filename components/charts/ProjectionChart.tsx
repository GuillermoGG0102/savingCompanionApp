import { View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { colors } from '@/theme/tokens';

const theme = colors.light;

type Props = { conserv: number[]; actual: number[]; optim: number[] };

export function ProjectionChart({ conserv, actual, optim }: Props) {
  const data = actual.map((value, i) => ({ x: i, conserv: conserv[i] ?? 0, actual: value, optim: optim[i] ?? 0 }));

  return (
    <View style={{ height: 130 }}>
      <CartesianChart data={data} xKey="x" yKeys={['conserv', 'actual', 'optim']} domainPadding={{ top: 10, bottom: 10 }}>
        {({ points }) => (
          <>
            <Line points={points.conserv} color={theme.textMuted} strokeWidth={1.5} opacity={0.6} curveType="natural" />
            <Line points={points.actual} color={theme.accent} strokeWidth={2.6} curveType="natural" />
            <Line points={points.optim} color="#7A6FF0" strokeWidth={1.5} curveType="natural" />
          </>
        )}
      </CartesianChart>
    </View>
  );
}
