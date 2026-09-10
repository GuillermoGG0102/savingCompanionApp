import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailySpendChart } from '@/components/charts/DailySpendChart';
import { NetWorthLineChart } from '@/components/charts/NetWorthLineChart';
import { getHistoricalDailyAverage, getNetWorthHistory, getThisMonthDailyAccumulated } from '@/db/queries/dashboard';
import { getCurrentMonthKey } from '@/lib/month';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();

type AnalisisData = {
  netWorthHistory: { monthKey: string; netWorth: number }[];
  thisMonthDaily: number[];
  averageDaily: number[];
};

export default function Analisis() {
  const [data, setData] = useState<AnalisisData | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getNetWorthHistory(12), getThisMonthDailyAccumulated(currentMonthKey), getHistoricalDailyAverage(currentMonthKey)]).then(
        ([netWorthHistory, thisMonthDaily, averageDaily]) => {
          setData({ netWorthHistory, thisMonthDaily, averageDaily });
        }
      );
    }, [])
  );

  if (!data) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.pad}>
        <Text style={styles.title}>Análisis</Text>

        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingTop: spacing.md }}>
          {data.netWorthHistory.length > 1 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Evolución del patrimonio</Text>
              <NetWorthLineChart data={data.netWorthHistory} />
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gasto acumulado vs. media histórica</Text>
            <DailySpendChart thisMonth={data.thisMonthDaily} average={data.averageDaily} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { flex: 1, padding: spacing.xl },
  title: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '600', color: theme.textPrimary },
  card: { borderRadius: radius.lg, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  cardTitle: { fontFamily: typography.fontMono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: theme.textMuted, fontWeight: '600', marginBottom: 8 },
});
