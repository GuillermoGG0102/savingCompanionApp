import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FixedExpenseForm, type FixedExpenseFormValues } from '@/components/FixedExpenseForm';
import { listCategoriesWithSubcategories, type CategoryWithSubcategories } from '@/db/queries/categories';
import { createFixedExpense } from '@/db/queries/fixedExpenses';
import { colors, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

export default function NuevoGastoFijo() {
  const [categories, setCategories] = useState<CategoryWithSubcategories[] | null>(null);
  const params = useLocalSearchParams<{ name?: string; categoryId?: string; amount?: string }>();

  useEffect(() => {
    listCategoriesWithSubcategories().then(setCategories);
  }, []);

  const initial: FixedExpenseFormValues | undefined = params.name
    ? {
        name: params.name,
        categoryId: Number(params.categoryId),
        amount: Number(params.amount),
        dayOfMonth: 1,
        active: true,
      }
    : undefined;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <Text style={styles.eyebrow}>Nuevo gasto fijo</Text>
        {categories === null ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        ) : (
          <FixedExpenseForm
            categories={categories}
            initial={initial}
            onSubmit={async (values) => {
              await createFixedExpense(values);
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
