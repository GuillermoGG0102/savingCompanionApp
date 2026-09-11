import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { InfoTip } from '@/components/InfoTip';
import { TextField } from '@/components/TextField';
import { DailySpendChart } from '@/components/charts/DailySpendChart';
import { NetWorthLineChart } from '@/components/charts/NetWorthLineChart';
import { PatrimonioDonut } from '@/components/charts/PatrimonioDonut';
import { RingGauge } from '@/components/charts/RingGauge';
import { WaterfallChart } from '@/components/charts/WaterfallChart';
import {
  getCategoryAnomalies,
  getPatrimonioComposicion,
  getReconciliation,
  getSafetyRunway,
  getSavingsRateSeries,
  type CategoryAnomaly,
  type Reconciliation,
} from '@/db/queries/analysis';
import { getHistoricalDailyAverage, getNetWorthHistory, getThisMonthDailyAccumulated } from '@/db/queries/dashboard';
import { computeAdditionalIncomeForMonth } from '@/db/queries/income';
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
  reconciliation: Reconciliation | null;
  anomalies: CategoryAnomaly[];
};

function fmtPct(n: number) {
  return n.toFixed(1).replace('.', ',');
}

const HELP = {
  tasaAhorro:
    'Es el porcentaje de tu nómina que te queda después de pagar gastos fijos y variables. El aro de la derecha muestra qué parte de tu objetivo llevas alcanzada este mes; el número del centro es el objetivo que has fijado.',
  patrimonio:
    'Agrupa tus activos en tres bloques según su tipo: Líquido (efectivo y cuentas bancarias), Inversión (fondos, acciones...) y Cripto. Te ayuda a ver si tu dinero está muy concentrado en un solo sitio.',
  colchon:
    'Cuántos meses podrías cubrir tus gastos fijos y variables usando solo tus activos líquidos (efectivo y cuentas), si dejaras de ingresar dinero. Los activos ilíquidos (inversión, cripto) no cuentan aquí, porque no siempre se pueden convertir en efectivo al momento.',
  objetivo:
    'Calcula, según tu ritmo de ahorro actual, cuánto tardarías en alcanzar el patrimonio que te propongas. Toca la tarjeta para simular qué pasaría si ahorraras un poco más o si tus inversiones rindieran más o menos.',
  insights: 'Observaciones automáticas calculadas a partir de tu propio historial. No son consejos financieros, solo patrones que detectamos en tus datos.',
  flujo:
    'Explica por qué ha cambiado tu patrimonio este mes: lo que has ahorrado, lo que han rendido tus inversiones, y lo que no cuadra (puede ser un gasto que olvidaste registrar o una comisión no anotada). Necesitas al menos un mes ya cerrado para verlo.',
  anomalias:
    'Compara el gasto de cada categoría este mes con la media de tus meses anteriores. La marca "σ" indica cuánto se aleja de lo habitual — más de 1,5 significa que es un mes notablemente distinto a lo normal en esa categoría.',
  evolucion:
    'El eje horizontal muestra los meses ya cerrados; el vertical, tu patrimonio total en cada uno. Cuanto más alta la barra, más patrimonio tenías ese mes.',
  gastoAcumulado:
    'El eje horizontal son los días del mes; el vertical, el gasto variable acumulado en euros. La línea roja es este mes; la gris, la media de tus meses anteriores — si la roja va por encima, vas gastando más de lo habitual.',
};

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
      getReconciliation(currentMonthKey),
      getCategoryAnomalies(currentMonthKey),
      computeAdditionalIncomeForMonth(currentMonthKey),
    ]).then(
      ([
        netWorthHistory,
        thisMonthDaily,
        averageDaily,
        savingsRateSeries,
        composicion,
        runway,
        profile,
        fixedTotal,
        variableTotal,
        reconciliation,
        anomalies,
        additionalIncome,
      ]) => {
        const currentSavingsCents = profile ? profile.monthlyNetPay + additionalIncome - fixedTotal - variableTotal : 0;
        setData({
          netWorthHistory,
          thisMonthDaily,
          averageDaily,
          savingsRateSeries,
          composicion,
          runway,
          profile,
          currentSavingsCents,
          reconciliation,
          anomalies,
        });
      }
    );
  }, []);

  useFocusEffect(load);

  if (!data) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  const { savingsRateSeries, composicion, runway, profile, anomalies } = data;
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
    const next = Math.max(0, Math.min(100, goalPct + delta));
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

  const today = new Date();
  const dayOfMonth = Math.min(today.getDate(), data.thisMonthDaily.length);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const spentSoFar = data.thisMonthDaily[dayOfMonth - 1] ?? 0;
  const averageFinal = data.averageDaily[data.averageDaily.length - 1] ?? 0;
  const pace =
    dayOfMonth > 0 && spentSoFar > 0
      ? { projectedTotal: (spentSoFar / dayOfMonth) * daysInMonth, overPace: (spentSoFar / dayOfMonth) * daysInMonth > averageFinal * 1.05 }
      : null;

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
                <View style={styles.eyebrowRow}>
                  <Text style={styles.heroEyebrow}>Tasa de ahorro</Text>
                  <InfoTip title="Tasa de ahorro" text={HELP.tasaAhorro} dark />
                </View>
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
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, styles.noMargin]}>Flujo vs. patrimonio</Text>
              <InfoTip title="Flujo vs. patrimonio" text={HELP.flujo} />
            </View>
            {data.reconciliation ? (
              <>
                <WaterfallChart data={data.reconciliation} currency={currency} />
                {data.reconciliation.sinExplicar !== 0 && (
                  <Text style={styles.caption}>
                    <Text style={{ color: theme.negative, fontWeight: '600' }}>
                      {data.reconciliation.sinExplicar >= 0 ? '+' : ''}
                      {formatCents(data.reconciliation.sinExplicar, currency)}
                    </Text>{' '}
                    no encajan este mes. Puede ser un gasto que olvidaste registrar o una comisión no anotada.
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.hint}>🔒 Necesitas al menos un mes ya cerrado para ver esto.</Text>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, styles.noMargin]}>Composición del patrimonio</Text>
              <InfoTip title="Composición del patrimonio" text={HELP.patrimonio} />
            </View>
            <PatrimonioDonut data={composicion} />
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, styles.noMargin]}>Colchón de seguridad</Text>
              <InfoTip title="Colchón de seguridad" text={HELP.colchon} />
            </View>
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
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, styles.noMargin]}>Objetivo de patrimonio</Text>
              <InfoTip title="Objetivo de patrimonio" text={HELP.objetivo} />
            </View>
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

          <View style={styles.cardTitleRow}>
            <Text style={styles.sectionLabel}>Insights</Text>
            <InfoTip title="Insights" text={HELP.insights} />
          </View>
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
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, styles.noMargin]}>Evolución del patrimonio</Text>
                <InfoTip title="Evolución del patrimonio" text={HELP.evolucion} />
              </View>
              <NetWorthLineChart data={data.netWorthHistory} />
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, styles.noMargin]}>Gasto acumulado vs. media histórica</Text>
              <InfoTip title="Gasto acumulado vs. media histórica" text={HELP.gastoAcumulado} />
            </View>
            <DailySpendChart thisMonth={data.thisMonthDaily} average={data.averageDaily} />
            {pace && (
              <Text style={[styles.caption, { color: pace.overPace ? theme.negative : theme.accent, fontWeight: '600' }]}>
                A este ritmo cerrarás el mes en {formatCents(pace.projectedTotal, currency)} ({pace.overPace ? 'por encima' : 'por debajo'} de lo
                habitual)
              </Text>
            )}
          </View>

          {anomalies.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, styles.noMargin]}>Categorías fuera de lo normal</Text>
                <InfoTip title="Categorías fuera de lo normal" text={HELP.anomalias} />
              </View>
              {anomalies.map((a, i) => (
                <Pressable
                  key={a.categoryId}
                  style={[styles.anomalyRow, i > 0 && styles.anomalyRowBorder]}
                  onPress={() => router.push(`/analisis-categoria/${a.categoryId}`)}
                >
                  <View style={[styles.anomalyDot, { backgroundColor: a.color }]} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.anomalyTop}>
                      <Text style={styles.anomalyName}>{a.name}</Text>
                      <Text style={styles.anomalyAmount}>{formatCents(a.amount, currency)}</Text>
                    </View>
                    <View style={styles.anomalyBarTrack}>
                      <View style={[styles.anomalyMeanTick, { left: `${Math.min(100, a.meanPos * 100)}%` }]} />
                      <View style={[styles.anomalyBarFill, { width: `${Math.min(100, a.pct * 100)}%`, backgroundColor: a.color }]} />
                    </View>
                  </View>
                  {a.isAnomaly && (
                    <View style={styles.anomalyBadge}>
                      <Text style={styles.anomalyBadgeLabel}>{a.z.toFixed(1)}σ</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}
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
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  noMargin: { marginBottom: 0 },
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
  hint: { fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textMuted, lineHeight: 18, textAlign: 'center', paddingVertical: 8 },

  anomalyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  anomalyRowBorder: { borderTopWidth: 1, borderTopColor: theme.border },
  anomalyDot: { width: 8, height: 8, borderRadius: 2 },
  anomalyTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  anomalyName: { fontFamily: typography.fontDisplay, fontWeight: '500', fontSize: 13, color: theme.textPrimary },
  anomalyAmount: { fontFamily: typography.fontMono, fontSize: 12.5, fontWeight: '600', color: theme.textPrimary },
  anomalyBarTrack: { height: 6, borderRadius: radius.pill, backgroundColor: 'rgba(17,25,23,.06)', overflow: 'hidden', position: 'relative' },
  anomalyMeanTick: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: theme.textMuted, zIndex: 1 },
  anomalyBarFill: { height: '100%', borderRadius: radius.pill },
  anomalyBadge: { paddingVertical: 4, paddingHorizontal: 7, borderRadius: 7, backgroundColor: 'rgba(224,96,60,.1)' },
  anomalyBadgeLabel: { fontFamily: typography.fontMono, fontSize: 10.5, fontWeight: '600', color: theme.negative },

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
