import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepDots } from '@/components/StepDots';
import { createExpense } from '@/db/queries/expenses';
import { createSubcategory, listCategoriesWithSubcategories, type CategoryWithSubcategories } from '@/db/queries/categories';
import { formatCents } from '@/lib/money';
import { getCategoryEmoji } from '@/lib/categoryEmoji';
import { useQuickExpenseDraft } from '@/store/quickExpenseDraft';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

export default function RegistrarGastoCategoria() {
  const amountCents = useQuickExpenseDraft((s) => s.amountCents);
  const date = useQuickExpenseDraft((s) => s.date);
  const setCategory = useQuickExpenseDraft((s) => s.setCategory);
  const reset = useQuickExpenseDraft((s) => s.reset);
  const [categories, setCategories] = useState<CategoryWithSubcategories[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCategoriesWithSubcategories().then(setCategories);
  }, []);

  async function handlePick(cat: CategoryWithSubcategories) {
    setCategory(cat.id, cat.name);

    if (cat.subcategories.length === 0) {
      // Sin subcategorías propias: se guarda directo (regla de los 3 toques).
      setSaving(true);
      // No hay subcategoría real a la que enlazar: se crea una implícita "General".
      const generic = await createSubcategory(cat.id, 'General');
      await createExpense({
        subcategoryId: generic.id,
        amount: amountCents,
        date,
      });
      reset();
      router.replace({
        pathname: '/registrar-gasto/confirmacion',
        params: { subcategoryName: 'General', categoryName: cat.name, amountCents: String(amountCents) },
      });
      return;
    }

    router.push('/registrar-gasto/subcategoria');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <StepDots total={3} current={1} />
        <Text style={styles.eyebrow}>Toque 2 de 3 · Categoría</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{formatCents(amountCents)}</Text>
        </View>

        {categories === null || saving ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.grid}>
            {categories.map((cat) => (
              <Pressable key={cat.id} onPress={() => handlePick(cat)} style={styles.tile}>
                <View style={[styles.tileIcon, { backgroundColor: `${cat.color}22` }]}>
                  <Text style={{ fontSize: 17 }}>{getCategoryEmoji(cat.name)}</Text>
                </View>
                <Text style={styles.tileLabel}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.spacer} />
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Atrás</Text>
        </Pressable>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '31%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tileIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontFamily: typography.fontDisplay, fontSize: 11, fontWeight: '600', color: theme.textPrimary, textAlign: 'center' },
  spacer: { flex: 1 },
  back: { fontFamily: typography.fontDisplay, fontSize: 13, color: theme.textMuted, fontWeight: '600', textAlign: 'center' },
});
