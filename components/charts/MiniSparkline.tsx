import { View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { colors } from '@/theme/tokens';

const theme = colors.light;

type Props = { data: number[]; width?: number; height?: number };

/** Línea diminuta sin ejes, solo para dar una idea de tendencia (tarjeta de Patrimonio total). */
export function MiniSparkline({ data, width = 76, height = 32 }: Props) {
  const points = data.map((value, i) => ({ x: i, value }));

  return (
    <View style={{ width, height }}>
      <CartesianChart data={points} xKey="x" yKeys={['value']} domainPadding={{ top: 6, bottom: 6, left: 4, right: 4 }}>
        {({ points: p }) => <Line points={p.value} color={theme.accent} strokeWidth={2} curveType="natural" />}
      </CartesianChart>
    </View>
  );
}
