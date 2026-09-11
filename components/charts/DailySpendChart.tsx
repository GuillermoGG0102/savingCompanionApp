import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { useFont } from '@shopify/react-native-skia';
import { View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { colors } from '@/theme/tokens';

const theme = colors.light;

function formatEurAxis(cents: number): string {
  const eur = cents / 100;
  return Math.abs(eur) >= 1000 ? `${Math.round(eur / 1000)}k€` : `${Math.round(eur)}€`;
}

type Props = { thisMonth: number[]; average: number[] };

export function DailySpendChart({ thisMonth, average }: Props) {
  const font = useFont(IBMPlexMono_500Medium, 10);
  const data = thisMonth.map((value, i) => ({ day: i + 1, thisMonth: value, average: average[i] ?? 0 }));

  return (
    <View style={{ height: 130 }}>
      <CartesianChart
        data={data}
        xKey="day"
        yKeys={['thisMonth', 'average']}
        domainPadding={{ top: 10, bottom: 10, left: 10, right: 10 }}
        xAxis={{ font, labelColor: theme.textMuted, lineColor: theme.border, tickCount: 5 }}
        yAxis={[{ font, labelColor: theme.textMuted, lineColor: theme.border, formatYLabel: formatEurAxis, tickCount: 4 }]}
      >
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
