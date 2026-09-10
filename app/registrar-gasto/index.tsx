import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { StepDots } from '@/components/StepDots';
import { TextField } from '@/components/TextField';
import { parseAmountInput } from '@/lib/money';
import { useQuickExpenseDraft } from '@/store/quickExpenseDraft';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const TODAY = isoDate(new Date());
const YESTERDAY = isoDate(new Date(Date.now() - 86400000));

// Últimos 14 días para "elegir fecha", suficiente para rellenar un gasto olvidado.
const RECENT_DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.now() - i * 86400000);
  return { iso: isoDate(d), label: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) };
});

export default function RegistrarGastoAmount() {
  const setAmount = useQuickExpenseDraft((s) => s.setAmount);
  const setDate = useQuickExpenseDraft((s) => s.setDate);
  const date = useQuickExpenseDraft((s) => s.date);
  const [raw, setRaw] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  function handleNext() {
    setAmount(parseAmountInput(raw));
    router.push('/registrar-gasto/categoria');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <StepDots total={3} current={0} />
        <Text style={styles.eyebrow}>Toque 1 de 3 · Importe</Text>

        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>Fecha</Text>
          <View style={styles.datePills}>
            <Pressable
              style={[styles.datePill, date === TODAY && styles.datePillOn]}
              onPress={() => {
                setDate(TODAY);
                setShowPicker(false);
              }}
            >
              <Text style={[styles.datePillLabel, date === TODAY && styles.datePillLabelOn]}>Hoy</Text>
            </Pressable>
            <Pressable
              style={[styles.datePill, date === YESTERDAY && styles.datePillOn]}
              onPress={() => {
                setDate(YESTERDAY);
                setShowPicker(false);
              }}
            >
              <Text style={[styles.datePillLabel, date === YESTERDAY && styles.datePillLabelOn]}>Ayer</Text>
            </Pressable>
            <Pressable style={[styles.datePill, showPicker && styles.datePillOn]} onPress={() => setShowPicker((v) => !v)}>
              <Text style={[styles.datePillLabel, showPicker && styles.datePillLabelOn]}>Elegir fecha…</Text>
            </Pressable>
          </View>

          {showPicker && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
              <View style={styles.recentRow}>
                {RECENT_DAYS.map((d) => (
                  <Pressable
                    key={d.iso}
                    style={[styles.recentChip, date === d.iso && styles.datePillOn]}
                    onPress={() => setDate(d.iso)}
                  >
                    <Text style={[styles.datePillLabel, date === d.iso && styles.datePillLabelOn]}>{d.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        <View style={styles.center}>
          <TextField label="Importe" value={raw} onChangeText={setRaw} suffix="€" placeholder="0,00" keyboardType="decimal-pad" />
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.close}>Cancelar</Text>
          </Pressable>
          <Button label="Siguiente →" onPress={handleNext} disabled={!raw.trim()} style={{ flex: 1 }} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  pad: { flex: 1, padding: spacing.xl },
  eyebrow: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: theme.accent,
    fontWeight: '600',
    textAlign: 'center',
  },
  dateField: { marginTop: spacing.lg, gap: 6 },
  dateLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
  },
  datePills: { flexDirection: 'row', gap: 6 },
  datePill: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: radius.pill, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  datePillOn: { backgroundColor: theme.textPrimary, borderColor: 'transparent' },
  datePillLabel: { fontFamily: typography.fontDisplay, fontSize: 11.5, fontWeight: '600', color: theme.textSecondary },
  datePillLabelOn: { color: theme.background },
  recentScroll: { marginTop: 8 },
  recentRow: { flexDirection: 'row', gap: 6 },
  recentChip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  center: { flex: 1, justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  close: { fontFamily: typography.fontDisplay, fontSize: 13, color: theme.textMuted, fontWeight: '600' },
});
