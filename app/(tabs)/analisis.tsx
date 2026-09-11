import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { DailySpendChart } from '@/components/charts/DailySpendChart';
import { NetWorthLineChart } from '@/components/charts/NetWorthLineChart';
import { PatrimonioDonut } from '@/components/charts/PatrimonioDonut';
import { RingGauge } from '@/components/charts/RingGauge';
import { getPatrimonioComposicion, getSafetyRunway, getSavingsRateSeries } from '@/db/queries/analysis';
import { getHistoricalDailyAverage, getNetWorthHistory, getThisMonthDailyAccumulated } from '@/db/queries/dashboard';
import { computeFixedTotal, computeVariableTotal } from '@/db/queries/monthClose';
import { getProfile, updateProfileGoals } from '@/db/queries/profile';
import { getCurrentMonthKey } from '@/lib/month';
import { formatCents, parseAmountInput } from '@/lib/money';
import { formatMonths, simulateProjection } from '@/lib/projection';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();
const DEFAULT_RENDIMIENTO_PCT = 5;

const RANGOS = [
  { key: '3M', months: 3 },
  { key: '6M', months: 6 },
  { key: '1A', months: 12 },
  { key: 'Todo', months: 24 },
] as const;

type SavingsPoint = { monthKey: string; pct: number };
type Profile = Awaited<ReturnType<typeof getProfile>>;

type AnalisisData = {
  netWorthHistory: { monthKey: string; netWorth: number }[];
  thisMonthDaily: number[];
  averageDaily: number[];
  savingsRateSeries: SavingsPoint[];
  composicion: Awaited<ReturnType<typeof getPatrimonioComposicion>>;
  runway: Awaited<ReturnType<typeof getSafetyRunway>>;
  profile: Profile;
  currentSavingsCents: number;
};

function fmtPct(n: number) {
  return n.toFixed(1).replace('.', ',');
}

export default function Analisis() {
  const [data, setData] = useState<AnalisisData | null>(null);
  const [rango, setRango] = useState<(typeof RANGOS)[number]['key']>('1A');
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');

  const load = useCallback(() => {
    Promise.all([
      getNetWorthHistory(12),
      getThisMonthDailyAccumulated(currentMonthKey),
      getHistoricalDailyAverage(currentMonthKey),
      getSavingsRateSeries(currentMonthKey, 24),
      getPatrimonioComposicion(),
      getSafetyRunway(currentMonthKey),
      getProfile(),
      computeFixedTotal(),
      computeVariableTotal(currentMonthKey),
    ]).then(([netWorthHistory, thisMonthDaily, averageDaily, savingsRateSeries, composicion, runway, profile, fixedTotal, variableTotal]) => {
      const currentSavingsCents = profile ? profile.monthlyNetPay - fixedTotal - variableTotal : 0;
      setData({ netWorthHistory, thisMonthDaily, averageDaily, savingsRateSeries, composicion, runway, profile, currentSavingsCents });
    });
  }, []);

  useFocusEffect(load);

  if (!data) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  const { savingsRateSeries, composicion, runway, profile } = data;
  const patrimonioTotal = composicion.reduce((sum, c) => sum + c.amount, 0);

  if (patrimonioTotal === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.pad}>
          <Text style={styles.title}>Análisis</Text>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <View style={styles.emptyIconBar} />
            </View>
            <Text style={styles.emptyTitle}>Todavía no hay nada que analizar</Text>
            <Text style={styles.emptySub}>
              Registra tus primeros gastos y el saldo de tus activos. En unos días empezaremos a mostrarte tendencias.
            </Text>
            <Button label="Registrar mi primer gasto" onPress={() => router.push('/registrar-gasto')} style={{ marginTop: spacing.lg }} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const windowMonths = RANGOS.find((r) => r.key === rango)!.months;
  const sparkSeries = savingsRateSeries.slice(-windowMonths);
  const last12 = savingsRateSeries.slice(-12);
  const pctNow = savingsRateSeries[savingsRateSeries.length - 1]?.pct ?? 0;
  const pctPrevMes = savingsRateSeries[savingsRateSeries.length - 2]?.pct ?? pctNow;
  const avg12 = last12.length ? last12.reduce((sum, s) => sum + s.pct, 0) / last12.length : pctNow;
  const maxAbsPct = Math.max(...sparkSeries.map((s) => Math.abs(s.pct)), 1);

  const goalPct = profile?.savingsGoalPct ?? 25;
  const achievedPct = goalPct > 0 ? (pctNow / goalPct) * 100 : 0;
  const currency = profile?.currency ?? 'EUR';
  const netWorthGoal = profile?.netWorthGoal ?? null;
  const monthsToGoal =
    netWorthGoal && data.currentSavingsCents > 0
      ? simulateProjection(patrimonioTotal, netWorthGoal, data.currentSavingsCents, DEFAULT_RENDIMIENTO_PCT).months
      : null;

  async function adjustGoalPct(delta: number) {
    if (!profile) return;
    const next = Math.max(20, Math.min(60, goalPct + delta));
    await updateProfileGoals(profile.id, { savingsGoalPct: next });
    setData((prev) => (prev && prev.profile ? { ...prev, profile: { ...prev.profile, savingsGoalPct: next } } : prev));
  }

  async function saveNetWorthGoal() {
    if (!profile) return;
    const cents = parseAmountInput(goalDraft) || null;
    await updateProfileGoals(profile.id, { netWorthGoal: cents });
    setData((prev) => (prev && prev.profile ? { ...prev, profile: { ...prev.profile, netWorthGoal: cents } } : prev));
    setEditingGoal(false);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.pad}>
        <Text style={styles.title}>Análisis</Text>
        <Text style={styles.subtitle}>Tu dinero, en profundidad</Text>

        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xxl }}>
          <View style={styles.chipsRow}>
            {RANGOS.map((r) => (
              <Chip key={r.key} label={r.key} selected={rango === r.key} onPress={() => setRango(r.key)} />
            ))}
          </View>

          <View style={styles.hero}>
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroEyebrow}>Tasa de ahorro</Text>
                <View style={styles.heroPctRow}>
                  <Text style={styles.heroPct}>{fmtPct(pctNow)}</Text>
                  <Text style={styles.heroPctSuffix}>%</Text>
                </View>
                <View style={styles.deltasRow}>
                  <Text style={[styles.delta, { color: pctNow >= pctPrevMes ? '#5FE9DC' : '#F0A08A' }]}>
                    {pctNow - pctPrevMes >= 0 ? '+' : ''}
                    {fmtPct(pctNow - pctPrevMes)}pp vs mes ant.
                  </Text>
                  <Text style={[styles.delta, { color: pctNow >= avg12 ? '#5FE9DC' : '#F0A08A' }]}>
                    {pctNow - avg12 >= 0 ? '+' : ''}
                    {fmtPct(pctNow - avg12)}pp vs media 12m
                  </Text>
                </View>
              </View>
              <RingGauge achievedPct={achievedPct} centerLabel={`${Math.round(goalPct)}%`} />
            </View>

            <View style={styles.sparkline}>
              {sparkSeries.map((s, i) => (
                <View
                  key={s.monthKey + i}
                  style={[
                    styles.sparkBar,
                    { height: Math.max(3, (Math.abs(s.pct) / maxAbsPct) * 34), backgroundColor: s.pct >= 0 ? '#5FE9DC' : '#F0A08A' },
                  ]}
                />
              ))}
            </View>

            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Objetivo: {Math.round(goalPct)}%</Text>
              <View style={styles.stepper}>
                <Pressable style={styles.stepperBtn} onPress={() => adjustGoalPct(-5)}>
                  <Text style={styles.stepperLabel}>−</Text>
                </Pressable>
                <Pressable style={styles.stepperBtn} onPress={() => adjustGoalPct(5)}>
                  <Text style={styles.stepperLabel}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Composición del patrimonio</Text>
            <PatrimonioDonut data={composicion} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Colchón de seguridad</Text>
            <View style={styles.runwayBigRow}>
              <Text style={styles.runwayBig}>{runway.meses.toFixed(1)}</Text>
              <Text style={styles.runwaySub}>meses de gasto cubiertos con activos líquidos</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${Math.min(100, (runway.meses / 15) * 100)}%` }]} />
            </View>
            <Text style={styles.caption}>
              Líquido: {formatCents(runway.liquido, currency)} · Ilíquido: {formatCents(runway.iliquido, currency)} — no cuenta para el colchón
            </Text>
          </View>

          <Pressable
            style={styles.card}
            onPress={() => {
              if (netWorthGoal) router.push('/proyeccion');
              else setEditingGoal(true);
            }}
          >
            <Text style={styles.cardTitle}>Objetivo de patrimonio</Text>
            {editingGoal ? (
              <View style={{ gap: spacing.sm }}>
                <TextField label="Importe objetivo" value={goalDraft} onChangeText={setGoalDraft} suffix={currency === 'EUR' ? '€' : currency} keyboardType="decimal-pad" />
                <Button label="Guardar objetivo" onPress={saveNetWorthGoal} />
              </View>
            ) : netWorthGoal ? (
              <Text style={styles.projText}>
                Al ritmo actual llegarás a tu objetivo de <Text style={styles.projTextStrong}>{formatCents(netWorthGoal, currency)}</Text>
                {monthsToGoal !== null ? (
                  <>
                    {' '}
                    en <Text style={styles.projTextAccent}>{formatMonths(monthsToGoal)}</Text>
                  </>
                ) : null}
                . Toca para simular escenarios.
              </Text>
            ) : (
              <Text style={styles.projText}>Aún no has fijado un objetivo. Toca para fijarlo y ver tu proyección con distintos escenarios.</Text>
            )}
          </Pressable>

          <Text style={styles.sectionLabel}>Insights</Text>
          {buildInsights(savingsRateSeries, goalPct).map((insight, i) => (
            <View key={i} style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: insight.bg }]}>
                <Text style={{ fontSize: 13 }}>{insight.emoji}</Text>
              </View>
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          ))}

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

function buildInsights(series: SavingsPoint[], goalPct: number) {
  if (series.length === 0) return [];
  const values = series.map((s) => s.pct);
  const best = Math.max(...values);
  const worst = Math.min(...values);
  const insights = [
    {
      emoji: '🏆',
      bg: 'rgba(14,158,146,.12)',
      text: `Tu mejor tasa de ahorro fue del ${Math.round(best)}% y la más baja del ${Math.round(worst)}% en los últimos meses.`,
    },
  ];

  let streak = 0;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].pct >= goalPct) streak++;
    else break;
  }
  if (streak >= 2) {
    insights.push({
      emoji: '🔥',
      bg: 'rgba(224,96,60,.1)',
      text: `Llevas ${streak} meses seguidos por encima de tu objetivo del ${Math.round(goalPct)}% de ahorro.`,
    });
  }

  return insights;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { flex: 1, padding: spacing.xl },
  title: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '600', color: theme.textPrimary },
  subtitle: { fontFamily: typography.fontDisplay, fontSize: 12, color: theme.textSecondary, marginTop: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  sectionLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
  },

  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    backgroundColor: theme.cardGradientFrom,
    overflow: 'hidden',
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroEyebrow: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#B9CBC6',
  },
  heroPctRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 10 },
  heroPct: { fontFamily: typography.fontDisplay, fontSize: 42, fontWeight: '600', letterSpacing: -1, color: '#F4F1EA' },
  heroPctSuffix: { fontFamily: typography.fontDisplay, fontSize: 18, fontWeight: '500', color: '#B9CBC6' },
  deltasRow: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  delta: { fontFamily: typography.fontMono, fontSize: 10.5, fontWeight: '600' },
  sparkline: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 34, marginTop: 16 },
  sparkBar: { flex: 1, borderRadius: 2 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  goalLabel: { fontFamily: typography.fontDisplay, fontSize: 11.5, fontWeight: '600', color: '#B9CBC6' },
  stepper: { flexDirection: 'row', gap: 8 },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(244,241,234,.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: { fontFamily: typography.fontDisplay, fontSize: 15, fontWeight: '600', color: '#F4F1EA' },

  card: { borderRadius: radius.lg, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  cardTitle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
    marginBottom: 12,
  },

  runwayBigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 14 },
  runwayBig: { fontFamily: typography.fontDisplay, fontSize: 26, fontWeight: '600', letterSpacing: -0.5, color: theme.textPrimary },
  runwaySub: { fontFamily: typography.fontDisplay, fontSize: 12, color: theme.textMuted, flex: 1 },
  track: { height: 14, borderRadius: radius.pill, backgroundColor: 'rgba(17,25,23,.06)', overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: radius.pill, backgroundColor: theme.accent },
  caption: { fontFamily: typography.fontDisplay, fontSize: 11, color: theme.textMuted, marginTop: 10, lineHeight: 16 },

  projText: { fontFamily: typography.fontDisplay, fontSize: 12.5, lineHeight: 18, color: theme.textPrimary },
  projTextStrong: { fontWeight: '600' },
  projTextAccent: { fontWeight: '600', color: theme.accent },

  insightCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  insightIcon: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  insightText: { flex: 1, fontFamily: typography.fontDisplay, fontSize: 12.5, lineHeight: 17, color: theme.textPrimary },

  emptyCard: {
    marginTop: spacing.lg,
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: radius.xl,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(14,158,146,.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyIconBar: { width: 4, height: 20, borderRadius: 2, backgroundColor: theme.accent },
  emptyTitle: { fontFamily: typography.fontDisplay, fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  emptySub: { fontFamily: typography.fontDisplay, fontSize: 12.5, lineHeight: 18, color: theme.textMuted, textAlign: 'center', marginTop: 8 },
});
