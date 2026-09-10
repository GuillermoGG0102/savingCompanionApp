import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryDonut } from '@/components/charts/CategoryDonut';
import { DailySpendChart } from '@/components/charts/DailySpendChart';
import { NetWorthLineChart } from '@/components/charts/NetWorthLineChart';
import type { CategorySlice } from '@/db/queries/dashboard';
import {
  getCategoryBreakdown,
  getCurrentNetWorth,
  getHistoricalDailyAverage,
  getNetWorthHistory,
  getThisMonthDailyAccumulated,
} from '@/db/queries/dashboard';
import { computeFixedTotal, getMonthClose } from '@/db/queries/monthClose';
import { getProfile } from '@/db/queries/profile';
import { calculateNetWorthDelta, calculateSavings, calculateSavingsRate } from '@/lib/calculations';
import { formatMonthLabel, getCurrentMonthKey, getPreviousMonthKey } from '@/lib/month';
import { formatCents } from '@/lib/money';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();
const targetMonthKey = getPreviousMonthKey(currentMonthKey);

type DashboardData = {
  netWorth: number;
  netWorthDelta: number | null;
  netWorthHistory: { monthKey: string; netWorth: number }[];
  savings: number;
  savingsRate: number;
  categoryBreakdown: CategorySlice[];
  thisMonthDaily: number[];
  averageDaily: number[];
  worseThanUsual: boolean;
  pendingClose: boolean;
};

export default function Dashboard() {
  const [status, setStatus] = useState<'loading' | 'needs-onboarding' | 'ready'>('loading');
  const [data, setData] = useState<DashboardData | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const profile = await getProfile();
        if (!profile) {
          setStatus('needs-onboarding');
          return;
        }

        const [netWorth, history, closePending, fixedTotal, thisMonthDaily, averageDaily, categoryBreakdown] =
          await Promise.all([
            getCurrentNetWorth(),
            getNetWorthHistory(12),
            getMonthClose(targetMonthKey),
            computeFixedTotal(),
            getThisMonthDailyAccumulated(currentMonthKey),
            getHistoricalDailyAverage(currentMonthKey),
            getCategoryBreakdown(currentMonthKey),
          ]);

        const today = Math.min(new Date().getDate(), thisMonthDaily.length) - 1;
        const variableSoFar = thisMonthDaily[today] ?? 0;
        const savings = calculateSavings(profile.monthlyNetPay, fixedTotal, variableSoFar);
        const savingsRate = calculateSavingsRate(savings, profile.monthlyNetPay);
        const lastClosed = history[history.length - 1];

        setData({
          netWorth,
          netWorthDelta: lastClosed ? calculateNetWorthDelta(netWorth, lastClosed.netWorth) : null,
          netWorthHistory: history,
          savings,
          savingsRate,
          categoryBreakdown,
          thisMonthDaily,
          averageDaily,
          worseThanUsual: variableSoFar > (averageDaily[today] ?? 0) * 1.1,
          pendingClose: !closePending,
        });
        setStatus('ready');
      })();
    }, [])
  );

  if (status === 'loading' || !data) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  if (status === 'needs-onboarding') {
    return <Redirect href="/onboarding/salary" />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topRow}>
        <Text style={styles.brand}>SAVING COMPANION</Text>
        <View style={styles.iconRow}>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/gastos-fijos')}>
            <Text>🔁</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/categorias')}>
            <Text>🏷️</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.scroll}>
        {data.pendingClose && (
          <Pressable style={styles.banner} onPress={() => router.push('/cierre-mensual')}>
            <Text style={styles.bannerIcon}>📅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Cierra {formatMonthLabel(targetMonthKey)}</Text>
              <Text style={styles.bannerSubtitle}>Toca para registrar el valor de tus activos</Text>
            </View>
            <Text style={styles.bannerGo}>Ir →</Text>
          </Pressable>
        )}

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Patrimonio total</Text>
          <Text style={styles.heroValue}>{formatCents(data.netWorth)}</Text>
          {data.netWorthDelta !== null && (
            <Text style={[styles.heroDelta, data.netWorthDelta >= 0 ? styles.pos : styles.neg]}>
              {data.netWorthDelta >= 0 ? '▲' : '▼'} {formatCents(Math.abs(data.netWorthDelta))} vs. mes anterior
            </Text>
          )}
        </View>

        <View style={styles.statRow}>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Ahorro este mes</Text>
            <Text style={[styles.statValue, data.savings >= 0 ? styles.pos : styles.neg]}>{formatCents(data.savings)}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statLabel}>Tasa de ahorro</Text>
            <Text style={styles.statValue}>{(data.savingsRate * 100).toFixed(1)} %</Text>
          </View>
        </View>

        {data.worseThanUsual && (
          <View style={styles.alert}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertText}>Vas gastando más rápido que lo habitual este mes.</Text>
          </View>
        )}

        {data.categoryBreakdown.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Gasto por categoría</Text>
            </View>
            <CategoryDonut data={data.categoryBreakdown} />
          </View>
        )}

        {data.netWorthHistory.length > 1 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Evolución del patrimonio</Text>
            </View>
            <NetWorthLineChart data={data.netWorthHistory} />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Gasto acumulado vs. media histórica</Text>
          </View>
          <DailySpendChart thisMonth={data.thisMonthDaily} average={data.averageDaily} />
        </View>
      </View>

      <Pressable style={styles.fab} onPress={() => router.push('/registrar-gasto')}>
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  brand: { fontFamily: typography.fontMono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: theme.accent, fontWeight: '600' },
  iconRow: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, padding: spacing.xl, gap: spacing.md },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: theme.cardGradientTo,
  },
  bannerIcon: { fontSize: 20 },
  bannerTitle: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13, color: theme.background },
  bannerSubtitle: { fontFamily: typography.fontDisplay, fontSize: 11, color: '#B9CBC6' },
  bannerGo: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12, color: theme.accentStrong },
  heroCard: { borderRadius: 20, padding: 18, backgroundColor: theme.cardGradientTo, gap: 4 },
  heroLabel: { fontFamily: typography.fontMono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#B9CBC6', fontWeight: '600' },
  heroValue: { fontFamily: typography.fontDisplay, fontSize: 34, fontWeight: '700', color: theme.background, letterSpacing: -0.5 },
  heroDelta: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5 },
  statRow: { flexDirection: 'row', gap: 10 },
  statTile: { flex: 1, padding: 12, borderRadius: radius.md, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  statLabel: { fontFamily: typography.fontMono, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: theme.textMuted, fontWeight: '600' },
  statValue: { fontFamily: typography.fontDisplay, fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginTop: 3 },
  pos: { color: theme.accent },
  neg: { color: theme.negative },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(224,96,60,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(224,96,60,0.25)',
  },
  alertIcon: { fontSize: 16 },
  alertText: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12, color: '#8a3d28' },
  card: { borderRadius: radius.lg, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  cardHead: { marginBottom: 10 },
  cardTitle: { fontFamily: typography.fontMono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: theme.textMuted, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: theme.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: { color: theme.background, fontSize: 24, lineHeight: 26 },
});
