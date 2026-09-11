import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TextField } from '@/components/TextField';
import {
  computeAdditionalIncomeForMonth,
  createAdditionalIncome,
  deleteAdditionalIncome,
  listAdditionalIncome,
  type NewAdditionalIncome,
} from '@/db/queries/income';
import { getProfile, updateProfileIncome } from '@/db/queries/profile';
import { getCurrentMonthKey } from '@/lib/month';
import { formatCents, parseAmountInput } from '@/lib/money';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
const TODAY = isoDate(new Date());
const YESTERDAY = isoDate(new Date(Date.now() - 86400000));
const RECENT_DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.now() - i * 86400000);
  return { iso: isoDate(d), label: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) };
});

function toAmountDraft(cents: number) {
  return formatCents(cents).replace(/[^\d.,]/g, '');
}

type Profile = Awaited<ReturnType<typeof getProfile>>;
type IncomeRow = Awaited<ReturnType<typeof listAdditionalIncome>>[number];

export default function Ingresos() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [incomeList, setIncomeList] = useState<IncomeRow[]>([]);
  const [monthlyDraft, setMonthlyDraft] = useState('');
  const [annualNetDraft, setAnnualNetDraft] = useState('');
  const [annualSalaryDraft, setAnnualSalaryDraft] = useState('');
  const [pagas, setPagas] = useState(12);
  const [saved, setSaved] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(TODAY);
  const [incomeNote, setIncomeNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getProfile(), listAdditionalIncome()]).then(([p, incomes]) => {
        setProfile(p);
        setIncomeList(incomes);
        if (p) {
          setPagas(p.payPeriodsPerYear);
          setMonthlyDraft(toAmountDraft(p.monthlyNetPay));
          setAnnualNetDraft(toAmountDraft(p.monthlyNetPay * p.payPeriodsPerYear));
          setAnnualSalaryDraft(toAmountDraft(p.annualSalary));
        }
      });
    }, [])
  );

  function onChangeMonthly(text: string) {
    setMonthlyDraft(text);
    setAnnualNetDraft(toAmountDraft(parseAmountInput(text) * pagas));
    setSaved(false);
  }

  function onChangeAnnualNet(text: string) {
    setAnnualNetDraft(text);
    setMonthlyDraft(toAmountDraft(pagas ? Math.round(parseAmountInput(text) / pagas) : 0));
    setSaved(false);
  }

  function adjustPagas(delta: number) {
    const next = Math.max(1, Math.min(14, pagas + delta));
    setPagas(next);
    setAnnualNetDraft(toAmountDraft(parseAmountInput(monthlyDraft) * next));
    setSaved(false);
  }

  async function handleSaveIncome() {
    if (!profile) return;
    await updateProfileIncome(profile.id, {
      monthlyNetPay: parseAmountInput(monthlyDraft),
      annualSalary: parseAmountInput(annualSalaryDraft),
      payPeriodsPerYear: pagas,
    });
    setSaved(true);
  }

  async function handleAddIncome() {
    if (!incomeAmount.trim()) return;
    const data: NewAdditionalIncome = { amount: parseAmountInput(incomeAmount), date: incomeDate, note: incomeNote.trim() || undefined };
    await createAdditionalIncome(data);
    setIncomeAmount('');
    setIncomeNote('');
    setIncomeDate(TODAY);
    setShowDatePicker(false);
    setShowAddForm(false);
    listAdditionalIncome().then(setIncomeList);
  }

  async function handleDeleteIncome(id: number) {
    await deleteAdditionalIncome(id);
    listAdditionalIncome().then(setIncomeList);
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  const currency = profile.currency;
  const thisMonthAdditional = incomeList.filter((i) => i.date.startsWith(currentMonthKey)).reduce((sum, i) => sum + i.amount, 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.pad}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Atrás</Text>
        </Pressable>
        <Text style={styles.title}>Ingresos</Text>

        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xxl }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nómina</Text>
            <TextField label="Nómina neta mensual" value={monthlyDraft} onChangeText={onChangeMonthly} suffix={currency === 'EUR' ? '€' : currency} keyboardType="decimal-pad" />
            <View style={styles.gap} />
            <TextField
              label="Ingreso neto anual (estimado)"
              value={annualNetDraft}
              onChangeText={onChangeAnnualNet}
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
            <View style={styles.gap} />
            <TextField label="Salario bruto anual" value={annualSalaryDraft} onChangeText={(t) => { setAnnualSalaryDraft(t); setSaved(false); }} suffix={currency === 'EUR' ? '€' : currency} keyboardType="decimal-pad" />
            <Button label={saved ? 'Guardado ✓' : 'Guardar'} onPress={handleSaveIncome} style={{ marginTop: spacing.sm }} />
          </View>

          <View style={styles.movRow}>
            <Text style={styles.sectionLabel}>Ingresos adicionales</Text>
            <Pressable onPress={() => setShowAddForm((v) => !v)}>
              <Text style={styles.addNew}>{showAddForm ? 'Cancelar' : '+ Nuevo'}</Text>
            </Pressable>
          </View>
          {thisMonthAdditional > 0 && (
            <Text style={styles.hint}>Este mes llevas {formatCents(thisMonthAdditional, currency)} en ingresos adicionales — se suman a tu ahorro.</Text>
          )}

          {showAddForm && (
            <Card style={{ gap: spacing.sm }}>
              <Text style={styles.fieldLabel}>Fecha</Text>
              <View style={styles.chipRow}>
                <Pressable style={[styles.chip, incomeDate === TODAY && styles.chipOn]} onPress={() => { setIncomeDate(TODAY); setShowDatePicker(false); }}>
                  <Text style={[styles.chipLabel, incomeDate === TODAY && styles.chipLabelOn]}>Hoy</Text>
                </Pressable>
                <Pressable style={[styles.chip, incomeDate === YESTERDAY && styles.chipOn]} onPress={() => { setIncomeDate(YESTERDAY); setShowDatePicker(false); }}>
                  <Text style={[styles.chipLabel, incomeDate === YESTERDAY && styles.chipLabelOn]}>Ayer</Text>
                </Pressable>
                <Pressable style={[styles.chip, showDatePicker && styles.chipOn]} onPress={() => setShowDatePicker((v) => !v)}>
                  <Text style={[styles.chipLabel, showDatePicker && styles.chipLabelOn]}>Elegir fecha…</Text>
                </Pressable>
              </View>
              {showDatePicker && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {RECENT_DAYS.map((d) => (
                      <Pressable key={d.iso} style={[styles.chip, incomeDate === d.iso && styles.chipOn]} onPress={() => setIncomeDate(d.iso)}>
                        <Text style={[styles.chipLabel, incomeDate === d.iso && styles.chipLabelOn]}>{d.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              )}
              <TextField label="Importe" value={incomeAmount} onChangeText={setIncomeAmount} suffix={currency === 'EUR' ? '€' : currency} keyboardType="decimal-pad" />
              <TextField label="Nota (opcional)" value={incomeNote} onChangeText={setIncomeNote} placeholder="p. ej. Trabajo freelance" />
              <Button label="Guardar ingreso" onPress={handleAddIncome} />
            </Card>
          )}

          {incomeList.length === 0 ? (
            <Text style={styles.empty}>Todavía no has registrado ningún ingreso adicional.</Text>
          ) : (
            incomeList.map((row) => (
              <View key={row.id} style={styles.incomeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.incomeNote}>{row.note ?? 'Ingreso adicional'}</Text>
                  <Text style={styles.incomeDate}>{new Date(row.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                </View>
                <Text style={styles.incomeAmount}>+{formatCents(row.amount, currency)}</Text>
                <Pressable style={styles.trashBtn} onPress={() => handleDeleteIncome(row.id)}>
                  <View style={styles.trashIcon} />
                </Pressable>
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
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { flex: 1, padding: spacing.xl },
  back: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.textMuted },
  title: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '600', color: theme.textPrimary, marginTop: 4 },
  card: { borderRadius: radius.lg, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  cardTitle: {
    fontFamily: typography.fontMono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
    marginBottom: 12,
  },
  gap: { height: spacing.sm },
  pagasRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  pagasLabel: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.textSecondary },
  stepper: { flexDirection: 'row', gap: 8 },
  stepperBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  stepperLabel: { fontFamily: typography.fontDisplay, fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  movRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
  },
  addNew: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.accent },
  hint: { fontFamily: typography.fontDisplay, fontSize: 11.5, color: theme.textMuted, lineHeight: 16, marginTop: -6 },
  fieldLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  chipOn: { backgroundColor: theme.textPrimary, borderColor: 'transparent' },
  chipLabel: { fontFamily: typography.fontDisplay, fontSize: 11.5, fontWeight: '600', color: theme.textSecondary },
  chipLabelOn: { color: theme.background },
  empty: { fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  incomeNote: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
  incomeDate: { fontFamily: typography.fontDisplay, fontSize: 10.5, color: theme.textMuted, marginTop: 1 },
  incomeAmount: { fontFamily: typography.fontMono, fontWeight: '600', fontSize: 12.5, color: theme.accent },
  trashBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(224,96,60,.1)', alignItems: 'center', justifyContent: 'center' },
  trashIcon: { width: 10, height: 12, borderWidth: 1.5, borderColor: theme.negative, borderTopWidth: 0, borderRadius: 2 },
});
