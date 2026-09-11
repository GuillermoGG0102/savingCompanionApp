import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { deleteFixedExpense, listFixedExpensesWithCategory } from '@/db/queries/fixedExpenses';
import { getProfile, updateProfileIncome } from '@/db/queries/profile';
import { formatCents, parseAmountInput } from '@/lib/money';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

function toAmountDraft(cents: number) {
  return formatCents(cents).replace(/[^\d.,]/g, '');
}

type Profile = Awaited<ReturnType<typeof getProfile>>;
type FixedRow = Awaited<ReturnType<typeof listFixedExpensesWithCategory>>[number];

type Props = { visible: boolean; onClose: () => void };

export function IngresosYFijosSheet({ visible, onClose }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fixed, setFixed] = useState<FixedRow[]>([]);
  const [annualSalaryDraft, setAnnualSalaryDraft] = useState('');
  const [monthlyDraft, setMonthlyDraft] = useState('');
  const [pagas, setPagas] = useState(12);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSaved(false);
    Promise.all([getProfile(), listFixedExpensesWithCategory()]).then(([p, f]) => {
      setProfile(p);
      setFixed(f);
      if (p) {
        setPagas(p.payPeriodsPerYear);
        setAnnualSalaryDraft(toAmountDraft(p.annualSalary));
        setMonthlyDraft(toAmountDraft(p.monthlyNetPay));
      }
    });
  }, [visible]);

  function adjustPagas(delta: number) {
    setPagas((v) => Math.max(1, Math.min(14, v + delta)));
    setSaved(false);
  }

  async function handleSave() {
    if (!profile) return;
    await updateProfileIncome(profile.id, {
      annualSalary: parseAmountInput(annualSalaryDraft),
      monthlyNetPay: parseAmountInput(monthlyDraft),
      payPeriodsPerYear: pagas,
    });
    setSaved(true);
  }

  async function handleDeleteFixed(id: number) {
    await deleteFixedExpense(id);
    listFixedExpensesWithCategory().then(setFixed);
  }

  function handleAddFixed() {
    onClose();
    router.push('/gastos-fijos/nuevo');
  }

  const totalFixed = fixed.filter((f) => f.active).reduce((sum, f) => sum + f.amount, 0);
  const currency = profile?.currency ?? 'EUR';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Ingresos y fijos</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Cerrar</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
            <View style={styles.card}>
              <TextField
                label="Salario bruto anual"
                value={annualSalaryDraft}
                onChangeText={(t) => {
                  setAnnualSalaryDraft(t);
                  setSaved(false);
                }}
                suffix={currency === 'EUR' ? '€' : currency}
                keyboardType="decimal-pad"
              />
              <View style={styles.gap} />
              <TextField
                label="Nómina neta / mes"
                value={monthlyDraft}
                onChangeText={(t) => {
                  setMonthlyDraft(t);
                  setSaved(false);
                }}
                suffix={currency === 'EUR' ? '€' : currency}
                keyboardType="decimal-pad"
              />
              <View style={styles.pagasRow}>
                <Text style={styles.pagasLabel}>Pagas al año: {pagas}</Text>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepperBtn} onPress={() => adjustPagas(-1)}>
                    <Text style={styles.stepperLabel}>−</Text>
                  </Pressable>
                  <Pressable style={styles.stepperBtn} onPress={() => adjustPagas(1)}>
                    <Text style={styles.stepperLabel}>+</Text>
                  </Pressable>
                </View>
              </View>
              <Button label={saved ? 'Guardado ✓' : 'Guardar'} onPress={handleSave} style={{ marginTop: spacing.sm }} />
            </View>

            <Text style={styles.sectionLabel}>Gastos fijos</Text>
            <View style={styles.card}>
              {fixed.map((f, i) => (
                <View key={f.id} style={[styles.fixedRow, i > 0 && styles.fixedRowBorder]}>
                  <Text style={styles.fixedName}>{f.name}</Text>
                  <Text style={styles.fixedAmount}>{formatCents(f.amount, currency)}</Text>
                  <Pressable onPress={() => handleDeleteFixed(f.id)} hitSlop={8}>
                    <Text style={styles.fixedDelete}>×</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable style={styles.addFixed} onPress={handleAddFixed}>
                <Text style={styles.addFixedLabel}>+ Añadir gasto fijo</Text>
              </Pressable>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total fijos</Text>
              <Text style={styles.totalValue}>{formatCents(totalFixed, currency)}</Text>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11,25,22,.42)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '85%',
    backgroundColor: theme.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: spacing.xl,
    gap: spacing.md,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: typography.fontDisplay, fontSize: 19, fontWeight: '600', color: theme.textPrimary },
  close: { fontFamily: typography.fontDisplay, fontSize: 13, fontWeight: '600', color: theme.textMuted },
  card: { borderRadius: radius.lg, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  gap: { height: spacing.sm },
  pagasRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  pagasLabel: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.textSecondary },
  stepper: { flexDirection: 'row', gap: 8 },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: { fontFamily: typography.fontDisplay, fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  sectionLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
  },
  fixedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  fixedRowBorder: { borderTopWidth: 1, borderTopColor: theme.border },
  fixedName: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '500', fontSize: 13, color: theme.textPrimary },
  fixedAmount: { fontFamily: typography.fontMono, fontWeight: '600', fontSize: 13, color: theme.textPrimary },
  fixedDelete: { fontSize: 16, color: theme.negative, paddingHorizontal: 4 },
  addFixed: { paddingVertical: 12 },
  addFixedLabel: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5, color: theme.accent },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: theme.textPrimary,
  },
  totalLabel: { fontFamily: typography.fontMono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.background, opacity: 0.6 },
  totalValue: { fontFamily: typography.fontDisplay, fontSize: 18, fontWeight: '600', color: theme.background },
});
