import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deleteMonthClose, listMonthCloses } from '@/db/queries/monthClose';
import { formatMonthLabel } from '@/lib/month';
import { formatCents } from '@/lib/money';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

type MonthCloseRow = Awaited<ReturnType<typeof listMonthCloses>>[number];

function formatClosedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Cierres() {
  const [rows, setRows] = useState<MonthCloseRow[] | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  const reload = useCallback(() => {
    listMonthCloses().then(setRows);
  }, []);

  useFocusEffect(reload);

  async function handleDelete(monthKey: string) {
    await deleteMonthClose(monthKey);
    setConfirmDeleteKey(null);
    reload();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.pad}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Atrás</Text>
        </Pressable>
        <Text style={styles.title}>Cierres de mes</Text>
        <Text style={styles.subtitle}>Toca uno para editarlo</Text>

        <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.md }}>
          {rows == null ? null : rows.length === 0 ? (
            <Text style={styles.empty}>Todavía no has cerrado ningún mes.</Text>
          ) : (
            rows.map((row) => (
              <View key={row.monthKey} style={styles.row}>
                {confirmDeleteKey === row.monthKey ? (
                  <>
                    <Text style={styles.confirmLabel}>¿Borrar el cierre de {formatMonthLabel(row.monthKey)}?</Text>
                    <Pressable onPress={() => handleDelete(row.monthKey)}>
                      <Text style={styles.confirmYes}>Sí, borrar</Text>
                    </Pressable>
                    <Pressable onPress={() => setConfirmDeleteKey(null)}>
                      <Text style={styles.confirmNo}>Cancelar</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      style={styles.rowInner}
                      onPress={() => router.push({ pathname: '/cierre-mensual', params: { monthKey: row.monthKey } })}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>{formatMonthLabel(row.monthKey)}</Text>
                        <Text style={styles.rowSubtitle}>Cerrado el {formatClosedAt(row.closedAt)}</Text>
                      </View>
                      <Text style={styles.rowValue}>{formatCents(row.netWorth)}</Text>
                    </Pressable>
                    <Pressable style={styles.trashBtn} onPress={() => setConfirmDeleteKey(row.monthKey)}>
                      <View style={styles.trashIcon} />
                    </Pressable>
                  </>
                )}
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
  back: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.textMuted },
  title: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '600', color: theme.textPrimary, marginTop: 4 },
  subtitle: { fontFamily: typography.fontDisplay, fontSize: 12, color: theme.textSecondary, marginTop: 4 },
  empty: { fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  rowInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowTitle: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13.5, color: theme.textPrimary },
  rowSubtitle: { fontFamily: typography.fontDisplay, fontSize: 11, color: theme.textMuted, marginTop: 2 },
  rowValue: { fontFamily: typography.fontMono, fontWeight: '600', fontSize: 13, color: theme.textPrimary },
  trashBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(224,96,60,.1)', alignItems: 'center', justifyContent: 'center' },
  trashIcon: { width: 11, height: 13, borderWidth: 1.5, borderColor: theme.negative, borderTopWidth: 0, borderRadius: 2 },
  confirmLabel: { flex: 1, fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textSecondary },
  confirmYes: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.negative },
  confirmNo: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.textMuted },
});
