import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import type { CategoryWithSubcategories } from '@/db/queries/categories';
import { formatCents, parseAmountInput } from '@/lib/money';
import { colors, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

export type FixedExpenseFormValues = {
  name: string;
  categoryId: number;
  amount: number;
  dayOfMonth: number;
  active: boolean;
};

type Props = {
  categories: CategoryWithSubcategories[];
  initial?: FixedExpenseFormValues;
  onSubmit: (values: FixedExpenseFormValues) => void;
  onDelete?: () => void;
};

export function FixedExpenseForm({ categories, initial, onSubmit, onDelete }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? categories[0]?.id ?? null);
  const [amount, setAmount] = useState(initial ? formatCents(initial.amount).replace(' €', '') : '');
  const [dayOfMonth, setDayOfMonth] = useState(initial ? String(initial.dayOfMonth) : '1');
  const [active, setActive] = useState(initial?.active ?? true);

  function handleSubmit() {
    if (!name.trim() || categoryId == null) return;
    onSubmit({
      name: name.trim(),
      categoryId,
      amount: parseAmountInput(amount),
      dayOfMonth: Math.min(31, Math.max(1, Number(dayOfMonth) || 1)),
      active,
    });
  }

  return (
    <View style={{ gap: spacing.md }}>
      <TextField label="Nombre" value={name} onChangeText={setName} placeholder="p. ej. Gimnasio" />

      <View style={styles.field}>
        <Text style={styles.label}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                selected={categoryId === cat.id}
                onPress={() => setCategoryId(cat.id)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextField label="Importe" value={amount} onChangeText={setAmount} suffix="€" keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Día" value={dayOfMonth} onChangeText={setDayOfMonth} keyboardType="number-pad" />
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Activo</Text>
        <Switch value={active} onValueChange={setActive} trackColor={{ true: theme.accent }} />
      </View>

      <View style={styles.actions}>
        {onDelete ? (
          <Pressable onPress={onDelete}>
            <Text style={styles.delete}>Eliminar</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Button label="Guardar" onPress={handleSubmit} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
  },
  chipRow: { flexDirection: 'row', gap: 6 },
  row: { flexDirection: 'row', gap: spacing.md },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  delete: { fontFamily: typography.fontDisplay, fontSize: 13, fontWeight: '600', color: theme.negative },
});
