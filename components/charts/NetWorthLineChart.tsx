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

type Props = { data: { monthKey: string; netWorth: number }[] };

export function NetWorthLineChart({ data }: Props) {
  const font = useFont(IBMPlexMono_500Medium, 10);
  const labels = data.map((d) => d.monthKey.slice(5));
  const points = data.map((d, i) => ({ x: i, netWorth: d.netWorth }));

  return (
    <View style={{ height: 130 }}>
      <CartesianChart
        data={points}
        xKey="x"
        yKeys={['netWorth']}
        domainPadding={{ top: 10, bottom: 10, left: 10, right: 10 }}
        xAxis={{ font, labelColor: theme.textMuted, lineColor: theme.border, formatXLabel: (v) => labels[v] ?? '' }}
        yAxis={[{ font, labelColor: theme.textMuted, lineColor: theme.border, formatYLabel: formatEurAxis, tickCount: 4 }]}
      >
        {({ points: p }) => <Line points={p.netWorth} color={theme.accent} strokeWidth={2.5} curveType="natural" />}
      </CartesianChart>
    </View>
  );
}
