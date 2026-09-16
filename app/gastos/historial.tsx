import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { listExpensesByMonth, type ExpenseListItem } from '@/db/queries/expenses';
import { getCurrentMonthKey, formatMonthLabel } from '@/lib/month';
import { formatCents } from '@/lib/money';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();

function formatExpenseDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export default function HistorialGastos() {
  const [all, setAll] = useState<ExpenseListItem[] | null>(null);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      listExpensesByMonth(currentMonthKey).then(setAll);
    }, [])
  );

  const categories = useMemo(() => {
    if (!all) return [];
    const seen = new Map<number, { id: number; name: string; color: string }>();
    for (const e of all) if (!seen.has(e.categoryId)) seen.set(e.categoryId, { id: e.categoryId, name: e.categoryName, color: e.categoryColor });
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = query.trim().toLowerCase();
    return all
      .filter((e) => !categoryId || e.categoryId === categoryId)
      .filter((e) => !q || e.subcategoryName.toLowerCase().includes(q) || (e.note ?? '').toLowerCase().includes(q));
  }, [all, query, categoryId]);

  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.pad}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Atrás</Text>
        </Pressable>
        <Text style={styles.title}>Historial de gastos</Text>
        <Text style={styles.subtitle}>{formatMonthLabel(currentMonthKey)}</Text>

        <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.md }}>
          <TextField label="" value={query} onChangeText={setQuery} placeholder="Buscar por concepto o nota..." />

          {categories.length > 0 && (
            <View style={styles.chipRow}>
              <Chip label="Todas" selected={categoryId === null} onPress={() => setCategoryId(null)} />
              {categories.map((c) => (
                <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
              ))}
            </View>
          )}

          {all !== null && (
            <View style={styles.totalStrip}>
              <Text style={styles.totalLabel}>
                {filtered.length} {filtered.length === 1 ? 'gasto' : 'gastos'}
              </Text>
              <Text style={styles.totalValue}>{formatCents(filteredTotal)}</Text>
            </View>
          )}

          {all === null ? null : filtered.length === 0 ? (
            <Text style={styles.empty}>No hay gastos que coincidan con la búsqueda.</Text>
          ) : (
            filtered.map((e) => (
              <View key={e.id} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: e.categoryColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{e.subcategoryName}</Text>
                  <Text style={styles.sub}>
                    {e.categoryName} · {formatExpenseDate(e.date)}
                    {e.note ? ` · ${e.note}` : ''}
                  </Text>
                </View>
                <Text style={styles.amount}>{formatCents(e.amount)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  pad: { flex: 1, padding: spacing.xl },
  back: { fontFamily: typography.fontDisplay, fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  title: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '600', color: theme.textPrimary, marginTop: spacing.sm },
  subtitle: { fontFamily: typography.fontDisplay, fontSize: 12, color: theme.textMuted, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  totalStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  totalLabel: { fontFamily: typography.fontMono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: theme.textMuted, fontWeight: '600' },
  totalValue: { fontFamily: typography.fontDisplay, fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  empty: { fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  dot: { width: 9, height: 9, borderRadius: 3 },
  name: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
  sub: { fontFamily: typography.fontDisplay, fontSize: 10.5, color: theme.textMuted, marginTop: 1 },
  amount: { fontFamily: typography.fontMono, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
});
