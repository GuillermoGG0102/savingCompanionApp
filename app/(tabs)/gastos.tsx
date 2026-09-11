import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { CategorySlice } from '@/db/queries/dashboard';
import { getCategoryBreakdown } from '@/db/queries/dashboard';
import { listExpensesForDate } from '@/db/queries/expenses';
import { computeFixedTotal } from '@/db/queries/monthClose';
import { getCurrentMonthKey } from '@/lib/month';
import { formatCents } from '@/lib/money';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();
const todayIso = new Date().toISOString().slice(0, 10);

type TodayExpense = Awaited<ReturnType<typeof listExpensesForDate>>[number];

export default function Gastos() {
  const [categories, setCategories] = useState<CategorySlice[] | null>(null);
  const [fixedTotal, setFixedTotal] = useState(0);
  const [today, setToday] = useState<TodayExpense[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getCategoryBreakdown(currentMonthKey), computeFixedTotal(), listExpensesForDate(todayIso)]).then(
        ([breakdown, fixed, todayList]) => {
          setCategories(breakdown);
          setFixedTotal(fixed);
          setToday(todayList);
        }
      );
    }, [])
  );

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
      <View style={styles.pad}>
        <Text style={styles.title}>Gastos</Text>
        <Text style={styles.hint}>
          {formatCents(variableTotal)} variables · {formatCents(fixedTotal)} fijos
        </Text>

        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingTop: spacing.md }}>
          <View style={styles.totalStrip}>
            <Text style={styles.totalLabel}>Total del mes</Text>
            <Text style={styles.totalValue}>{formatCents(total)}</Text>
          </View>

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
      </View>
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
  linkBtn: { borderWidth: 1, borderStyle: 'dashed', borderColor: theme.border, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  linkLabel: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5, color: theme.textSecondary },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: radius.md, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  expenseIcon: { width: 28, height: 28, borderRadius: 8 },
  expenseName: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
  expenseSub: { fontFamily: typography.fontDisplay, fontSize: 10.5, color: theme.textMuted },
  expenseAmount: { fontFamily: typography.fontMono, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
});
