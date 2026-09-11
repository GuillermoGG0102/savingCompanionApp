import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CategorySlice } from '@/db/queries/dashboard';
import {
  getCategoryBreakdown,
  getCurrentNetWorth,
  getNetWorthHistory,
  getThisMonthDailyAccumulated,
} from '@/db/queries/dashboard';
import { computeAdditionalIncomeForMonth } from '@/db/queries/income';
import { computeFixedTotal, getMonthClose } from '@/db/queries/monthClose';
import { getProfile } from '@/db/queries/profile';
import { calculateNetWorthDelta, calculateSavings, calculateSavingsRate } from '@/lib/calculations';
import { formatMonthLabel, getCurrentMonthKey, getPreviousMonthKey } from '@/lib/month';
import { formatCents } from '@/lib/money';
import { useEnter3D } from '@/lib/motion';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();
const targetMonthKey = getPreviousMonthKey(currentMonthKey);

type InicioData = {
  netWorth: number;
  netWorthDelta: number | null;
  savings: number;
  savingsRate: number;
  categoryBreakdown: CategorySlice[];
  pendingClose: boolean;
};

export default function Inicio() {
  const [data, setData] = useState<InicioData | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [profile, netWorth, history, closePending, fixedTotal, thisMonthDaily, categoryBreakdown, additionalIncome] =
          await Promise.all([
            getProfile(),
            getCurrentNetWorth(),
            getNetWorthHistory(12),
            getMonthClose(targetMonthKey),
            computeFixedTotal(),
            getThisMonthDailyAccumulated(currentMonthKey),
            getCategoryBreakdown(currentMonthKey),
            computeAdditionalIncomeForMonth(currentMonthKey),
          ]);

        const today = Math.min(new Date().getDate(), thisMonthDaily.length) - 1;
        const variableSoFar = thisMonthDaily[today] ?? 0;
        const income = (profile?.monthlyNetPay ?? 0) + additionalIncome;
        const savings = calculateSavings(income, fixedTotal, variableSoFar);
        const savingsRate = calculateSavingsRate(savings, income);
        const lastClosed = history[history.length - 1];

        setData({
          netWorth,
          netWorthDelta: lastClosed ? calculateNetWorthDelta(netWorth, lastClosed.netWorth) : null,
          savings,
          savingsRate,
          categoryBreakdown: categoryBreakdown.slice(0, 3),
          pendingClose: !closePending,
        });
      })();
    }, [])
  );

  const enterStyle = useEnter3D();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const heroParallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * -0.12 }],
  }));

  if (!data) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Animated.View style={[styles.flex, enterStyle]}>
      <Text style={styles.brand}>SAVING COMPANION</Text>

      <Animated.ScrollView contentContainerStyle={styles.scroll} onScroll={onScroll} scrollEventThrottle={16}>
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

        <Animated.View style={[styles.heroCard, heroParallaxStyle]}>
          <Text style={styles.heroLabel}>Patrimonio total</Text>
          <Text style={styles.heroValue}>{formatCents(data.netWorth)}</Text>
          {data.netWorthDelta !== null && (
            <Text style={[styles.heroDelta, data.netWorthDelta >= 0 ? styles.pos : styles.neg]}>
              {data.netWorthDelta >= 0 ? '▲' : '▼'} {formatCents(Math.abs(data.netWorthDelta))} vs. mes anterior
            </Text>
          )}
        </Animated.View>

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

        {data.categoryBreakdown.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Dónde se va</Text>
              <Pressable onPress={() => router.push('/gastos')}>
                <Text style={styles.seeAll}>Ver todo →</Text>
              </Pressable>
            </View>
            {data.categoryBreakdown.map((c) => (
              <View key={c.categoryId} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: c.color }]} />
                <Text style={styles.catName}>{c.name}</Text>
                <Text style={styles.catValue}>{formatCents(c.amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  brand: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: theme.accent,
    fontWeight: '600',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  scroll: { padding: spacing.xl, gap: spacing.md },
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
  card: { borderRadius: radius.lg, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  cardTitle: { fontFamily: typography.fontMono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: theme.textMuted, fontWeight: '600' },
  seeAll: { fontFamily: typography.fontDisplay, fontSize: 11, fontWeight: '600', color: theme.accent },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  catDot: { width: 9, height: 9, borderRadius: 3 },
  catName: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
  catValue: { fontFamily: typography.fontMono, fontSize: 12.5, fontWeight: '600', color: theme.textPrimary },
});
