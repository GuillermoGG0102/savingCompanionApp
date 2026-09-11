import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listCategoriesWithSubcategories } from '@/db/queries/categories';
import { getCategoryBreakdown } from '@/db/queries/dashboard';
import { getCategoryByDayOfWeek, getCategoryHistory, getSubcategoryBreakdown } from '@/db/queries/analysis';
import { formatCents } from '@/lib/money';
import { getCurrentMonthKey } from '@/lib/month';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();

type CategoriaDetailData = {
  name: string;
  color: string;
  total: number;
  history: { monthKey: string; amount: number }[];
  subcategories: { subcategoryId: number; name: string; amount: number }[];
  byDayOfWeek: { label: string; amount: number }[];
};

export default function AnalisisCategoria() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = Number(id);
  const [data, setData] = useState<CategoriaDetailData | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        listCategoriesWithSubcategories(),
        getCategoryBreakdown(currentMonthKey),
        getCategoryHistory(categoryId, currentMonthKey),
        getSubcategoryBreakdown(categoryId, currentMonthKey),
        getCategoryByDayOfWeek(categoryId, currentMonthKey),
      ]).then(([categories, breakdown, history, subcategories, byDayOfWeek]) => {
        const category = categories.find((c) => c.id === categoryId);
        const total = breakdown.find((c) => c.categoryId === categoryId)?.amount ?? 0;
        setData({ name: category?.name ?? '', color: category?.color ?? theme.textMuted, total, history, subcategories, byDayOfWeek });
      });
    }, [categoryId])
  );

  if (!data) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  const maxHistory = Math.max(...data.history.map((h) => h.amount), 1);
  const maxDay = Math.max(...data.byDayOfWeek.map((d) => d.amount), 1);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.pad}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Análisis</Text>
        </Pressable>

        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xxl }}>
          <View style={styles.headerRow}>
            <View style={[styles.badge, { backgroundColor: data.color }]}>
              <Text style={styles.badgeLabel}>{data.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.title}>{data.name}</Text>
              <Text style={styles.subtitle}>{formatCents(data.total)} este mes</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Últimos 6 meses</Text>
            <View style={styles.historyRow}>
              {data.history.map((h) => (
                <View key={h.monthKey} style={styles.historyCol}>
                  <View style={styles.historyTrack}>
                    <View style={[styles.historyBar, { height: `${Math.max(4, (h.amount / maxHistory) * 100)}%`, backgroundColor: data.color }]} />
                  </View>
                  <Text style={styles.historyLabel}>{h.monthKey.slice(5)}</Text>
                </View>
              ))}
            </View>
          </View>

          {data.subcategories.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Subcategorías</Text>
              <View style={styles.card}>
                {data.subcategories.map((s, i) => (
                  <View key={s.subcategoryId} style={[styles.subRow, i > 0 && styles.subRowBorder]}>
                    <Text style={styles.subName}>{s.name}</Text>
                    <Text style={styles.subValue}>{formatCents(s.amount)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionLabel}>Por día de la semana</Text>
          <View style={styles.card}>
            <View style={styles.dayRow}>
              {data.byDayOfWeek.map((d) => (
                <View key={d.label} style={styles.dayCol}>
                  <View style={styles.dayTrack}>
                    <View
                      style={[
                        styles.dayBar,
                        { height: `${Math.max(4, (d.amount / maxDay) * 100)}%`, backgroundColor: data.color, opacity: 0.5 + (d.amount / maxDay) * 0.5 },
                      ]}
                    />
                  </View>
                  <Text style={styles.dayLabel}>{d.label}</Text>
                </View>
              ))}
            </View>
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
  back: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.textMuted },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  badge: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13, color: '#FFFDF8' },
  title: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '600', color: theme.textPrimary },
  subtitle: { fontFamily: typography.fontDisplay, fontSize: 12, color: theme.textMuted, marginTop: 2 },
  card: { borderRadius: radius.lg, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  cardTitle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
  },
  historyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 90 },
  historyCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%' },
  historyTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  historyBar: { width: '100%', borderRadius: 5 },
  historyLabel: { fontFamily: typography.fontMono, fontSize: 9.5, color: theme.textMuted },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  subRowBorder: { borderTopWidth: 1, borderTopColor: theme.border },
  subName: { fontFamily: typography.fontDisplay, fontWeight: '500', fontSize: 13.5, color: theme.textPrimary },
  subValue: { fontFamily: typography.fontMono, fontWeight: '600', fontSize: 14, color: theme.textPrimary },
  dayRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100 },
  dayCol: { flex: 1, alignItems: 'center', gap: 5, height: '100%' },
  dayTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  dayBar: { width: '100%', borderRadius: 4 },
  dayLabel: { fontFamily: typography.fontDisplay, fontSize: 9, color: theme.textMuted },
});
