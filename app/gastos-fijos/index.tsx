import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listFixedExpensesWithCategory } from '@/db/queries/fixedExpenses';
import { getCategoryEmoji } from '@/lib/categoryEmoji';
import { formatCents } from '@/lib/money';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

type Row = Awaited<ReturnType<typeof listFixedExpensesWithCategory>>[number];

export default function GastosFijos() {
  const [rows, setRows] = useState<Row[]>([]);

  useFocusEffect(
    useCallback(() => {
      listFixedExpensesWithCategory().then(setRows);
    }, [])
  );

  const total = rows.filter((r) => r.active).reduce((sum, r) => sum + r.amount, 0);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Gastos fijos</Text>
          <Text style={styles.title}>Cada mes, sin pensarlo</Text>
        </View>

        <View style={styles.totalsStrip}>
          <Text style={styles.totalsLabel}>Total mensual</Text>
          <Text style={styles.totalsValue}>{formatCents(total)}</Text>
        </View>

        <ScrollView contentContainerStyle={{ gap: spacing.sm }}>
          {rows.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => router.push(`/gastos-fijos/${row.id}`)}
              style={[styles.row, !row.active && styles.rowInactive]}
            >
              <View style={[styles.icon, { backgroundColor: `${row.categoryColor}22` }]}>
                <Text style={{ fontSize: 14 }}>{getCategoryEmoji(row.categoryName)}</Text>
              </View>
              <View style={styles.meta}>
                <Text style={styles.name}>{row.name}</Text>
                <Text style={styles.sub}>
                  {row.categoryName} · día {row.dayOfMonth}
                  {row.active ? '' : ' · pausado'}
                </Text>
              </View>
              <Text style={styles.amount}>{formatCents(row.amount)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Pressable style={styles.fab} onPress={() => router.push('/gastos-fijos/nuevo')}>
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  pad: { flex: 1, padding: spacing.xl },
  header: { marginBottom: spacing.md },
  eyebrow: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: theme.accent,
    fontWeight: '600',
  },
  title: { fontFamily: typography.fontDisplay, fontSize: 20, fontWeight: '600', color: theme.textPrimary, marginTop: 4 },
  totalsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: 14,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    backgroundColor: theme.cardGradientTo,
  },
  totalsLabel: { fontFamily: typography.fontMono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#B9CBC6' },
  totalsValue: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '600', color: theme.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  rowInactive: { opacity: 0.5 },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  meta: { flex: 1, minWidth: 0 },
  name: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13, color: theme.textPrimary },
  sub: { fontFamily: typography.fontDisplay, fontSize: 11, color: theme.textMuted },
  amount: { fontFamily: typography.fontMono, fontWeight: '600', fontSize: 13, color: theme.textPrimary },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: theme.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: { color: theme.background, fontSize: 22, lineHeight: 24 },
});
