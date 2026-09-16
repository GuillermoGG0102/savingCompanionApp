import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CategorySlice } from '@/db/queries/dashboard';
import { getCategoryBreakdown } from '@/db/queries/dashboard';
import { listExpensesForDate } from '@/db/queries/expenses';
import { dismissFixedExpenseSuggestion, getFixedExpenseCandidates, type FixedExpenseCandidate } from '@/db/queries/fixedExpenseSuggestions';
import { computeFixedTotal } from '@/db/queries/monthClose';
import { getCurrentMonthKey } from '@/lib/month';
import { formatCents } from '@/lib/money';
import { useEnter3D } from '@/lib/motion';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();
const todayIso = new Date().toISOString().slice(0, 10);

type TodayExpense = Awaited<ReturnType<typeof listExpensesForDate>>[number];

export default function Gastos() {
  const [categories, setCategories] = useState<CategorySlice[] | null>(null);
  const [fixedTotal, setFixedTotal] = useState(0);
  const [today, setToday] = useState<TodayExpense[]>([]);
  const [fixedCandidates, setFixedCandidates] = useState<FixedExpenseCandidate[]>([]);

  const reload = useCallback(() => {
    Promise.all([
      getCategoryBreakdown(currentMonthKey),
      computeFixedTotal(),
      listExpensesForDate(todayIso),
      getFixedExpenseCandidates(currentMonthKey),
    ]).then(([breakdown, fixed, todayList, candidates]) => {
      setCategories(breakdown);
      setFixedTotal(fixed);
      setToday(todayList);
      setFixedCandidates(candidates);
    });
  }, []);

  useFocusEffect(reload);

  async function handleDismissCandidate(subcategoryId: number) {
    await dismissFixedExpenseSuggestion(subcategoryId);
    reload();
  }

  function handleConvertCandidate(c: FixedExpenseCandidate) {
    dismissFixedExpenseSuggestion(c.subcategoryId);
    router.push({
      pathname: '/gastos-fijos/nuevo',
      params: { name: c.subcategoryName, categoryId: String(c.categoryId), amount: String(c.avgAmount) },
    });
  }

  const enterStyle = useEnter3D();

  if (!categories) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  const total = categories.reduce((sum, c) => sum + c.amount, 0);
  const variableTotal = total - fixedTotal;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Animated.View style={[styles.pad, enterStyle]}>
        <Text style={styles.title}>Gastos</Text>
        <Text style={styles.hint}>
          {formatCents(variableTotal)} variables · {formatCents(fixedTotal)} fijos
        </Text>

        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingTop: spacing.md }}>
          <View style={styles.totalStrip}>
            <Text style={styles.totalLabel}>Total del mes</Text>
            <Text style={styles.totalValue}>{formatCents(total)}</Text>
          </View>

          {fixedCandidates.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>¿Esto es un gasto fijo?</Text>
              <Text style={styles.suggestionHint}>Llevas {fixedCandidates[0].months.length} meses pagando un importe parecido en:</Text>
              {fixedCandidates.map((c) => (
                <View key={c.subcategoryId} style={styles.suggestionRow}>
                  <View style={styles.suggestionTop}>
                    <View style={[styles.catDot, { backgroundColor: c.categoryColor }]} />
                    <Text style={styles.catName}>{c.subcategoryName}</Text>
                    <Text style={styles.catValue}>{formatCents(c.avgAmount)}/mes</Text>
                  </View>
                  <View style={styles.suggestionActions}>
                    <Pressable onPress={() => handleConvertCandidate(c)}>
                      <Text style={styles.suggestionAccept}>Convertir a fijo →</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDismissCandidate(c.subcategoryId)}>
                      <Text style={styles.suggestionReject}>No, es variable</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Por categoría</Text>
            {categories.map((c) => (
              <View key={c.categoryId} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: c.color }]} />
                <Text style={styles.catName}>{c.name}</Text>
                <Text style={styles.catValue}>{formatCents(c.amount)}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.linkBtn} onPress={() => router.push('/gastos/historial')}>
            <Text style={styles.linkLabel}>Ver todos los gastos →</Text>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => router.push('/gastos-fijos')}>
            <Text style={styles.linkLabel}>Gestionar gastos fijos →</Text>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => router.push('/categorias')}>
            <Text style={styles.linkLabel}>Gestionar categorías →</Text>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => router.push('/ingresos')}>
            <Text style={styles.linkLabel}>Gestionar ingresos →</Text>
          </Pressable>

          {today.length > 0 && (
            <>
              <Text style={styles.cardTitle}>Hoy</Text>
              {today.map((e) => (
                <View key={e.id} style={styles.expenseRow}>
                  <View style={[styles.expenseIcon, { backgroundColor: `${e.categoryColor}22` }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseName}>{e.subcategoryName}</Text>
                    <Text style={styles.expenseSub}>{e.categoryName}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>{formatCents(e.amount)}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { flex: 1, padding: spacing.xl },
  title: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '600', color: theme.textPrimary },
  hint: { fontFamily: typography.fontDisplay, fontSize: 12, color: theme.textSecondary, marginTop: 4 },
  totalStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', padding: 14, borderRadius: radius.lg, backgroundColor: theme.textPrimary },
  totalLabel: { fontFamily: typography.fontMono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.background, opacity: 0.6 },
  totalValue: { fontFamily: typography.fontDisplay, fontSize: 20, fontWeight: '600', color: theme.background },
  card: { borderRadius: radius.lg, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  cardTitle: { fontFamily: typography.fontMono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: theme.textMuted, fontWeight: '600', marginBottom: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  catDot: { width: 9, height: 9, borderRadius: 3 },
  catName: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
  catValue: { fontFamily: typography.fontMono, fontSize: 12.5, fontWeight: '600', color: theme.textPrimary },
  suggestionHint: { fontFamily: typography.fontDisplay, fontSize: 11.5, color: theme.textMuted, marginBottom: 6 },
  suggestionRow: { paddingVertical: 8, gap: 6, borderTopWidth: 1, borderTopColor: theme.border },
  suggestionTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  suggestionActions: { flexDirection: 'row', gap: spacing.md, paddingLeft: 19 },
  suggestionAccept: { fontFamily: typography.fontDisplay, fontSize: 12, fontWeight: '600', color: theme.accent },
  suggestionReject: { fontFamily: typography.fontDisplay, fontSize: 12, fontWeight: '600', color: theme.textMuted },
  linkBtn: { borderWidth: 1, borderStyle: 'dashed', borderColor: theme.border, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  linkLabel: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5, color: theme.textSecondary },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: radius.md, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  expenseIcon: { width: 28, height: 28, borderRadius: 8 },
  expenseName: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
  expenseSub: { fontFamily: typography.fontDisplay, fontSize: 10.5, color: theme.textMuted },
  expenseAmount: { fontFamily: typography.fontMono, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
});
