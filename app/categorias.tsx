import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { createSubcategory, listCategoriesWithSubcategories, type CategoryWithSubcategories } from '@/db/queries/categories';
import { getCategoryEmoji } from '@/lib/categoryEmoji';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

export default function Categorias() {
  const [categories, setCategories] = useState<CategoryWithSubcategories[] | null>(null);
  const [openFor, setOpenFor] = useState<number | null>(null);
  const [newName, setNewName] = useState('');

  const reload = useCallback(() => {
    listCategoriesWithSubcategories().then(setCategories);
  }, []);

  useFocusEffect(reload);

  async function handleAdd(categoryId: number) {
    if (!newName.trim()) return;
    await createSubcategory(categoryId, newName.trim());
    setNewName('');
    setOpenFor(null);
    reload();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <Text style={styles.eyebrow}>Categorías</Text>
        <Text style={styles.title}>Cómo se organiza tu gasto</Text>

        {categories === null ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={{ gap: spacing.sm, marginTop: spacing.md }}>
            {categories.map((cat) => (
              <View key={cat.id} style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={[styles.icon, { backgroundColor: `${cat.color}22` }]}>
                    <Text style={{ fontSize: 16 }}>{getCategoryEmoji(cat.name)}</Text>
                  </View>
                  <Text style={styles.name}>{cat.name}</Text>
                  <View style={[styles.badge, cat.kind === 'fixed' ? styles.badgeFixed : styles.badgeVariable]}>
                    <Text style={[styles.badgeLabel, { color: cat.kind === 'fixed' ? '#8A6D1C' : theme.accent }]}>
                      {cat.kind === 'fixed' ? 'Fijo' : 'Variable'}
                    </Text>
                  </View>
                </View>

                <View style={styles.chipRow}>
                  {cat.subcategories.map((sub) => (
                    <Chip key={sub.id} label={sub.name} />
                  ))}
                  <Chip label="+ Añadir" dashed onPress={() => setOpenFor(cat.id)} />
                </View>

                {openFor === cat.id && (
                  <View style={styles.addRow}>
                    <View style={{ flex: 1 }}>
                      <TextField label="Nueva subcategoría" value={newName} onChangeText={setNewName} placeholder="p. ej. Podcast" />
                    </View>
                    <Text style={styles.confirm} onPress={() => handleAdd(cat.id)}>
                      Guardar
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
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
  },
  title: { fontFamily: typography.fontDisplay, fontSize: 20, fontWeight: '600', color: theme.textPrimary, marginTop: 4 },
  card: {
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 14, color: theme.textPrimary },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: radius.pill },
  badgeFixed: { backgroundColor: 'rgba(201,162,39,0.14)' },
  badgeVariable: { backgroundColor: 'rgba(14,158,146,0.14)' },
  badgeLabel: { fontFamily: typography.fontMono, fontSize: 9.5, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  addRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  confirm: { fontFamily: typography.fontDisplay, fontSize: 13, fontWeight: '600', color: theme.accent, paddingBottom: 13 },
});
