import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FixedExpenseForm } from '@/components/FixedExpenseForm';
import { listCategoriesWithSubcategories, type CategoryWithSubcategories } from '@/db/queries/categories';
import { deleteFixedExpense, listFixedExpensesWithCategory, updateFixedExpense } from '@/db/queries/fixedExpenses';
import { colors, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

export default function EditarGastoFijo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const expenseId = Number(id);
  const [categories, setCategories] = useState<CategoryWithSubcategories[] | null>(null);
  const [initial, setInitial] = useState<{ name: string; categoryId: number; amount: number; dayOfMonth: number; active: boolean } | null>(null);

  useEffect(() => {
    listCategoriesWithSubcategories().then(setCategories);
    listFixedExpensesWithCategory().then((rows) => {
      const row = rows.find((r) => r.id === expenseId);
      if (row) {
        setInitial({
          name: row.name,
          categoryId: row.categoryId,
          amount: row.amount,
          dayOfMonth: row.dayOfMonth,
          active: row.active,
        });
      }
    });
  }, [expenseId]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <Text style={styles.eyebrow}>Editar gasto fijo</Text>
        {categories === null || initial === null ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        ) : (
          <FixedExpenseForm
            categories={categories}
            initial={initial}
            onSubmit={async (values) => {
              await updateFixedExpense(expenseId, values);
              router.back();
            }}
            onDelete={async () => {
              await deleteFixedExpense(expenseId);
              router.back();
            }}
          />
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
    marginBottom: spacing.lg,
  },
});
