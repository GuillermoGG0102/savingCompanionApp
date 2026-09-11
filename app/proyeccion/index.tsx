import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { ProjectionChart } from '@/components/charts/ProjectionChart';
import { getCurrentNetWorth } from '@/db/queries/dashboard';
import { computeFixedTotal, computeVariableTotal } from '@/db/queries/monthClose';
import { getProfile, updateProfileGoals } from '@/db/queries/profile';
import { getCurrentMonthKey } from '@/lib/month';
import { formatCents, parseAmountInput } from '@/lib/money';
import { formatMonths, simulateProjection } from '@/lib/projection';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();
const RECORTE_STEP = 1000; // 10 €
const RECORTE_MAX = 15000; // 150 €
const RENDIMIENTO_STEP = 0.5;
const RENDIMIENTO_MAX = 10;

type Profile = Awaited<ReturnType<typeof getProfile>>;

type ProyeccionData = { netWorth: number; currentSavingsCents: number; profile: Profile };

export default function Proyeccion() {
  const [data, setData] = useState<ProyeccionData | null>(null);
  const [recorte, setRecorte] = useState(0);
  const [rendimiento, setRendimiento] = useState(5);
  const [goalDraft, setGoalDraft] = useState('');

  useFocusEffect(
    useCallback(() => {
      Promise.all([getCurrentNetWorth(), computeFixedTotal(), computeVariableTotal(currentMonthKey), getProfile()]).then(
        ([netWorth, fixedTotal, variableTotal, profile]) => {
          const currentSavingsCents = profile ? profile.monthlyNetPay - fixedTotal - variableTotal : 0;
          setData({ netWorth, currentSavingsCents, profile });
          setGoalDraft(profile?.netWorthGoal ? formatCents(profile.netWorthGoal, profile.currency).replace(/[^\d.,]/g, '') : '');
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

  const { netWorth, currentSavingsCents, profile } = data;
  const currency = profile?.currency ?? 'EUR';
  const goal = profile?.netWorthGoal ?? null;
  const aportacionBase = currentSavingsCents - recorte;

  async function saveGoal() {
    if (!profile) return;
    const cents = parseAmountInput(goalDraft) || null;
    await updateProfileGoals(profile.id, { netWorthGoal: cents });
    setData((prev) => (prev && prev.profile ? { ...prev, profile: { ...prev.profile, netWorthGoal: cents } } : prev));
  }

  const simConserv = goal ? simulateProjection(netWorth, goal, aportacionBase, 2) : null;
  const simActual = goal ? simulateProjection(netWorth, goal, aportacionBase, rendimiento) : null;
  const simOptim = goal ? simulateProjection(netWorth, goal, aportacionBase + 10000, rendimiento + 3) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.pad}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Análisis</Text>
        </Pressable>

        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xxl }}>
          <Text style={styles.title}>Proyección con escenarios</Text>

          <View style={styles.card}>
            <TextField label="Objetivo de patrimonio" value={goalDraft} onChangeText={setGoalDraft} suffix={currency === 'EUR' ? '€' : currency} keyboardType="decimal-pad" />
            <Button label="Guardar objetivo" variant="secondary" onPress={saveGoal} style={{ marginTop: spacing.sm }} />
          </View>

          {!goal ? (
            <View style={styles.card}>
              <Text style={styles.hint}>Fija un objetivo arriba para ver la proyección con distintos escenarios.</Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <ProjectionChart conserv={simConserv!.points} actual={simActual!.points} optim={simOptim!.points} />
                <View style={styles.legendRow}>
                  <Text style={[styles.legendItem, { color: theme.textMuted }]}>● Conservadora: {formatMonths(simConserv!.months)}</Text>
                  <Text style={[styles.legendItem, { color: theme.accent }]}>● Actual: {formatMonths(simActual!.months)}</Text>
                  <Text style={[styles.legendItem, { color: '#7A6FF0' }]}>● Optimista: {formatMonths(simOptim!.months)}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>Recorte mensual en Ocio</Text>
                  <Text style={styles.sliderValue}>{formatCents(recorte, currency)}</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepperBtn} onPress={() => setRecorte((v) => Math.max(0, v - RECORTE_STEP))}>
                    <Text style={styles.stepperLabel}>−</Text>
                  </Pressable>
                  <View style={styles.track}>
                    <View style={[styles.trackFill, { width: `${(recorte / RECORTE_MAX) * 100}%` }]} />
                  </View>
                  <Pressable style={styles.stepperBtn} onPress={() => setRecorte((v) => Math.min(RECORTE_MAX, v + RECORTE_STEP))}>
                    <Text style={styles.stepperLabel}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.card}>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderLabel}>Rendimiento anual estimado</Text>
                  <Text style={styles.sliderValue}>{rendimiento.toFixed(1).replace('.', ',')}%</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepperBtn} onPress={() => setRendimiento((v) => Math.max(0, +(v - RENDIMIENTO_STEP).toFixed(1)))}>
                    <Text style={styles.stepperLabel}>−</Text>
                  </Pressable>
                  <View style={styles.track}>
                    <View style={[styles.trackFill, { width: `${(rendimiento / RENDIMIENTO_MAX) * 100}%` }]} />
                  </View>
                  <Pressable style={styles.stepperBtn} onPress={() => setRendimiento((v) => Math.min(RENDIMIENTO_MAX, +(v + RENDIMIENTO_STEP).toFixed(1)))}>
                    <Text style={styles.stepperLabel}>+</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { flex: 1, padding: spacing.xl },
  back: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.textMuted },
  title: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '600', color: theme.textPrimary },
  card: { borderRadius: radius.lg, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  hint: { fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textMuted, lineHeight: 18 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  legendItem: { fontFamily: typography.fontDisplay, fontSize: 11, fontWeight: '600' },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sliderLabel: { fontFamily: typography.fontDisplay, fontSize: 13, fontWeight: '500', color: theme.textPrimary },
  sliderValue: { fontFamily: typography.fontMono, fontSize: 13, fontWeight: '600', color: theme.textPrimary },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: { fontFamily: typography.fontDisplay, fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  track: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: 'rgba(17,25,23,.06)', overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: radius.pill, backgroundColor: theme.accent },
});
