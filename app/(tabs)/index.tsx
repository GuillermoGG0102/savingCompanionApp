import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { IngresosYFijosSheet } from '@/components/IngresosYFijosSheet';
import { TextField } from '@/components/TextField';
import { MiniSparkline } from '@/components/charts/MiniSparkline';
import { listAssetsWithLatestValue } from '@/db/queries/assets';
import type { CategorySlice } from '@/db/queries/dashboard';
import { getCategoryBreakdown, getCurrentNetWorth, getNetWorthHistory } from '@/db/queries/dashboard';
import { hasAnyExpense } from '@/db/queries/expenses';
import { computeAdditionalIncomeForMonth } from '@/db/queries/income';
import { computeFixedTotal, computeVariableTotal, getMonthClose, listMonthCloses } from '@/db/queries/monthClose';
import { getProfile, updateProfileName } from '@/db/queries/profile';
import { calculateNetWorthDelta, calculateSavings, calculateSavingsRate } from '@/lib/calculations';
import { formatMonthLabel, getCurrentMonthKey, getPreviousMonthKey } from '@/lib/month';
import { formatCents } from '@/lib/money';
import { useEnter3D, useFlip } from '@/lib/motion';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();
const targetMonthKey = getPreviousMonthKey(currentMonthKey);

type InicioData = {
  profileId: number | null;
  name: string | null;
  currency: string;
  netWorth: number;
  netWorthDelta: number | null;
  netWorthSparkline: number[];
  income: number;
  fixedTotal: number;
  variableSoFar: number;
  savings: number;
  savingsRate: number;
  savingsGoalPct: number;
  savingsDelta: number | null;
  categoryBreakdown: CategorySlice[];
  pendingClose: boolean;
  checklist: { key: string; label: string; done: boolean; route: string }[];
};

export default function Inicio() {
  const [data, setData] = useState<InicioData | null>(null);
  const [showIngresos, setShowIngresos] = useState(false);
  const [showNameEditor, setShowNameEditor] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const load = useCallback(() => {
    (async () => {
      const [
        profile,
        netWorth,
        history,
        prevClose,
        fixedTotal,
        variableSoFar,
        categoryBreakdown,
        additionalIncome,
        assets,
        hasExpense,
        monthCloses,
      ] = await Promise.all([
        getProfile(),
        getCurrentNetWorth(),
        getNetWorthHistory(6),
        getMonthClose(targetMonthKey),
        computeFixedTotal(),
        computeVariableTotal(currentMonthKey),
        getCategoryBreakdown(currentMonthKey),
        computeAdditionalIncomeForMonth(currentMonthKey),
        listAssetsWithLatestValue(),
        hasAnyExpense(),
        listMonthCloses(),
      ]);

      const income = (profile?.monthlyNetPay ?? 0) + additionalIncome;
      const savings = calculateSavings(income, fixedTotal, variableSoFar);
      const savingsRate = calculateSavingsRate(savings, income);
      const prevSavings = prevClose ? prevClose.income - prevClose.fixedTotal - prevClose.variableTotal : null;

      const checklist = [
        { key: 'assets', label: 'Añade tu primer activo', done: assets.length > 0, route: '/activos' },
        { key: 'expense', label: 'Registra tu primer gasto', done: hasExpense, route: '/registrar-gasto' },
        { key: 'close', label: 'Cierra tu primer mes', done: monthCloses.length > 0, route: '/activos' },
        { key: 'goal', label: 'Fija tu objetivo de patrimonio', done: !!profile?.netWorthGoal, route: '/analisis' },
      ].filter((item) => !item.done);

      setData({
        profileId: profile?.id ?? null,
        name: profile?.name ?? null,
        currency: profile?.currency ?? 'EUR',
        netWorth,
        netWorthDelta: prevClose ? calculateNetWorthDelta(netWorth, prevClose.netWorth) : null,
        netWorthSparkline: history.map((h) => h.netWorth),
        income,
        fixedTotal,
        variableSoFar,
        savings,
        savingsRate,
        savingsGoalPct: profile?.savingsGoalPct ?? 25,
        savingsDelta: prevSavings !== null ? savings - prevSavings : null,
        categoryBreakdown: categoryBreakdown.slice(0, 3),
        pendingClose: !prevClose,
        checklist,
      });
    })();
  }, []);

  useFocusEffect(load);

  const enterStyle = useEnter3D();
  const { toggle: toggleFlip, frontStyle, backStyle } = useFlip();
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

  function openNameEditor() {
    setNameDraft(data?.name ?? '');
    setShowNameEditor(true);
  }

  async function saveName() {
    if (!data?.profileId || !nameDraft.trim()) {
      setShowNameEditor(false);
      return;
    }
    await updateProfileName(data.profileId, nameDraft.trim());
    setData((prev) => (prev ? { ...prev, name: nameDraft.trim() } : prev));
    setShowNameEditor(false);
  }

  const progressPct = data.savingsGoalPct > 0 ? Math.min(100, (data.savingsRate * 100 * 100) / data.savingsGoalPct) : 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Animated.View style={[styles.flex, enterStyle]}>
        <View style={styles.headerRow}>
          <View>
            <Image source={require('@/assets/brand/lockup-horizontal-transparent.png')} style={styles.brand} resizeMode="contain" />
            <Pressable onPress={openNameEditor}>
              <Text style={styles.greeting}>{data.name ? `Hola, ${data.name}` : 'Hola 👋 · toca para poner tu nombre'}</Text>
            </Pressable>
          </View>
          <Pressable style={styles.gearBtn} onPress={() => setShowIngresos(true)}>
            <View style={styles.gearIcon} />
          </Pressable>
        </View>

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

          <View>
            <Animated.View style={frontStyle}>
              <LinearGradient
                colors={[theme.cardGradientFrom, theme.cardGradientMid, theme.cardGradientTo]}
                locations={[0, 0.55, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.glowBlobOuter} pointerEvents="none" />
                <View style={styles.glowBlobMid} pointerEvents="none" />
                <View style={styles.glowBlobCore} pointerEvents="none" />
                <Pressable onPress={toggleFlip}>
                  <View style={styles.heroTopRow}>
                    <Text style={styles.heroLabel}>Ahorro del mes</Text>
                    <View style={styles.girarPill}>
                      <Text style={styles.girarLabel}>Girar</Text>
                    </View>
                  </View>
                  <Text style={styles.heroValue}>{formatCents(data.savings, data.currency)}</Text>
                  {data.savingsDelta !== null && (
                    <View style={[styles.deltaPill, data.savingsDelta >= 0 ? styles.deltaPillPos : styles.deltaPillNeg]}>
                      <Text style={styles.deltaPillLabel}>
                        {data.savingsDelta >= 0 ? '↑' : '↓'} {formatCents(Math.abs(data.savingsDelta), data.currency)} vs. mes anterior
                      </Text>
                    </View>
                  )}
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Tasa de ahorro {(data.savingsRate * 100).toFixed(1)}%</Text>
                    <Text style={styles.progressLabel}>Objetivo {Math.round(data.savingsGoalPct)}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <LinearGradient
                      colors={['#22D3C5', '#5FE9DC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${progressPct}%` }]}
                    />
                  </View>
                </Pressable>
              </LinearGradient>
            </Animated.View>

            <Animated.View style={[styles.heroCardBack, backStyle]}>
              <Pressable style={styles.flex} onPress={toggleFlip}>
                <Text style={styles.backTitle}>Cómo sale el mes</Text>
                <View style={styles.backRow}>
                  <Text style={styles.backLabel}>Nómina neta</Text>
                  <Text style={[styles.backValue, styles.pos]}>+{formatCents(data.income, data.currency)}</Text>
                </View>
                <View style={styles.backRow}>
                  <Text style={styles.backLabel}>Gastos fijos</Text>
                  <Text style={[styles.backValue, styles.neg]}>−{formatCents(data.fixedTotal, data.currency)}</Text>
                </View>
                <View style={styles.backRow}>
                  <Text style={styles.backLabel}>Gastos variables</Text>
                  <Text style={[styles.backValue, styles.neg]}>−{formatCents(data.variableSoFar, data.currency)}</Text>
                </View>
                <View style={styles.backDivider} />
                <View style={styles.backRow}>
                  <Text style={styles.backLabelStrong}>Queda</Text>
                  <Text style={styles.backValueStrong}>{formatCents(data.savings, data.currency)}</Text>
                </View>
              </Pressable>
            </Animated.View>
          </View>

          <Pressable style={styles.netWorthCard} onPress={() => router.push('/activos')}>
            <View>
              <Text style={styles.heroLabelDark}>Patrimonio total</Text>
              <Text style={styles.netWorthValue}>{formatCents(data.netWorth, data.currency)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <MiniSparkline data={data.netWorthSparkline.length > 1 ? data.netWorthSparkline : [data.netWorth, data.netWorth]} />
              {data.netWorthDelta !== null && (
                <Text style={[styles.netWorthDelta, data.netWorthDelta >= 0 ? styles.pos : styles.neg]}>
                  {data.netWorthDelta >= 0 ? '+' : ''}
                  {formatCents(data.netWorthDelta, data.currency)}
                </Text>
              )}
            </View>
          </Pressable>

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

          {data.checklist.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Para sacarle el máximo partido</Text>
              {data.checklist.map((item) => (
                <Pressable key={item.key} style={styles.checklistRow} onPress={() => router.push(item.route as never)}>
                  <View style={styles.checklistDot} />
                  <Text style={styles.checklistLabel}>{item.label}</Text>
                  <Text style={styles.checklistGo}>→</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Consejo</Text>
              <Text style={styles.tipText}>
                Ya tienes lo básico configurado. Echa un vistazo a Análisis de vez en cuando para detectar patrones en tus gastos y ver si
                vas camino de tu objetivo.
              </Text>
            </View>
          )}
        </Animated.ScrollView>
      </Animated.View>

      <IngresosYFijosSheet visible={showIngresos} onClose={() => setShowIngresos(false)} />

      {showNameEditor && (
        <Pressable style={styles.nameBackdrop} onPress={() => setShowNameEditor(false)}>
          <Pressable style={styles.nameSheet} onPress={(e) => e.stopPropagation()}>
            <TextField label="Tu nombre" value={nameDraft} onChangeText={setNameDraft} placeholder="p. ej. Marta" />
            <Button label="Guardar" onPress={saveName} style={{ marginTop: spacing.md }} />
          </Pressable>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  brand: { width: 132, height: 33 },
  greeting: { fontFamily: typography.fontDisplay, fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginTop: 4 },
  gearBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: theme.textSecondary },
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

  heroCard: { borderRadius: 24, padding: 20, overflow: 'hidden', minHeight: 210 },
  glowBlobOuter: {
    position: 'absolute',
    top: -100,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(95,233,220,.05)',
  },
  glowBlobMid: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(95,233,220,.11)',
  },
  glowBlobCore: {
    position: 'absolute',
    top: -25,
    right: -15,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(95,233,220,.20)',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontFamily: typography.fontMono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#B9CBC6', fontWeight: '600' },
  girarPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(244,241,234,.35)' },
  girarLabel: { fontFamily: typography.fontDisplay, fontSize: 10.5, fontWeight: '600', color: '#F4F1EA' },
  heroValue: { fontFamily: typography.fontDisplay, fontSize: 42, fontWeight: '700', color: theme.background, letterSpacing: -0.5, marginTop: 8 },
  deltaPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    marginTop: 10,
  },
  deltaPillPos: { backgroundColor: 'rgba(95,233,220,.16)' },
  deltaPillNeg: { backgroundColor: 'rgba(240,160,138,.16)' },
  deltaPillLabel: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 11, color: '#5FE9DC' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 6 },
  progressLabel: { fontFamily: typography.fontDisplay, fontSize: 11, color: '#B9CBC6' },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: 'rgba(244,241,234,.15)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill },

  heroCardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    padding: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  backTitle: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
    marginBottom: 14,
  },
  backRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  backLabel: { fontFamily: typography.fontDisplay, fontSize: 13, color: theme.textSecondary },
  backValue: { fontFamily: typography.fontMono, fontSize: 13, fontWeight: '600' },
  backDivider: { height: 1, backgroundColor: theme.border, marginVertical: 6 },
  backLabelStrong: { fontFamily: typography.fontDisplay, fontSize: 14, fontWeight: '600', color: theme.textPrimary },
  backValueStrong: { fontFamily: typography.fontMono, fontSize: 16, fontWeight: '700', color: theme.accent },

  netWorthCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  heroLabelDark: {
    fontFamily: typography.fontMono,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
  },
  netWorthValue: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '700', color: theme.textPrimary, marginTop: 4 },
  netWorthDelta: { fontFamily: typography.fontMono, fontSize: 11, fontWeight: '600' },
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
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  checklistDot: { width: 7, height: 7, borderRadius: 2, borderWidth: 1.5, borderColor: theme.accent },
  checklistLabel: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
  checklistGo: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13, color: theme.accent },
  tipText: { fontFamily: typography.fontDisplay, fontSize: 12.5, lineHeight: 18, color: theme.textSecondary },

  nameBackdrop: { position: 'absolute', inset: 0, backgroundColor: 'rgba(11,25,22,.42)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  nameSheet: { width: '100%', backgroundColor: theme.background, borderRadius: radius.xl, padding: spacing.xl },
});
