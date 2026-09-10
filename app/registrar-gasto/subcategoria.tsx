import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { StepDots } from '@/components/StepDots';
import { TextField } from '@/components/TextField';
import { createSubcategory, listSubcategoriesForCategory } from '@/db/queries/categories';
import { createExpense } from '@/db/queries/expenses';
import { formatCents } from '@/lib/money';
import { useQuickExpenseDraft } from '@/store/quickExpenseDraft';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

export default function RegistrarGastoSubcategoria() {
  const { amountCents, categoryId, categoryName, reset } = useQuickExpenseDraft();
  const [subcategories, setSubcategories] = useState<{ id: number; name: string }[] | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (categoryId != null) listSubcategoriesForCategory(categoryId).then(setSubcategories);
  }, [categoryId]);

  async function save(subcategoryId: number, subcategoryName: string) {
    setSaving(true);
    await createExpense({
      subcategoryId,
      amount: amountCents,
      date: new Date().toISOString().slice(0, 10),
    });
    reset();
    router.replace({
      pathname: '/registrar-gasto/confirmacion',
      params: { subcategoryName, categoryName: categoryName ?? '', amountCents: String(amountCents) },
    });
  }

  async function handleSaveCustom() {
    if (!customName.trim() || categoryId == null) return;
    const created = await createSubcategory(categoryId, customName.trim());
    await save(created.id, created.name);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <StepDots total={3} current={2} />
        <Text style={styles.eyebrow}>Toque 3 de 3 · Subcategoría</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {formatCents(amountCents)} · {categoryName}
          </Text>
        </View>

        {saving || subcategories === null ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        ) : showCustom ? (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.hint}>Escribe el nombre. Se queda guardada para la próxima vez que la uses.</Text>
            <TextField label="Nombre" value={customName} onChangeText={setCustomName} placeholder="p. ej. Playtomic" />
            <View style={styles.actions}>
              <Pressable onPress={() => setShowCustom(false)}>
                <Text style={styles.back}>Atrás</Text>
              </Pressable>
              <Button label="Guardar gasto" onPress={handleSaveCustom} disabled={!customName.trim()} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {subcategories.map((sub) => (
              <Pressable key={sub.id} onPress={() => save(sub.id, sub.name)} style={styles.row}>
                <Text style={styles.rowLabel}>{sub.name}</Text>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setShowCustom(true)} style={[styles.row, styles.rowDashed]}>
              <Text style={[styles.rowLabel, { color: theme.accent }]}>+ Otra…</Text>
              <Text style={[styles.arrow, { color: theme.accent }]}>›</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.spacer} />
        {!showCustom && (
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>← Atrás</Text>
          </Pressable>
        )}
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
  pill: {
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pillText: { fontFamily: typography.fontMono, fontSize: 13, fontWeight: '600', color: theme.textPrimary },
  hint: { fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textSecondary, textAlign: 'center', lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  rowDashed: { borderStyle: 'dashed' },
  rowLabel: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13.5, color: theme.textPrimary },
  arrow: { color: theme.textMuted },
  spacer: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: { fontFamily: typography.fontDisplay, fontSize: 13, color: theme.textMuted, fontWeight: '600', textAlign: 'center' },
});
