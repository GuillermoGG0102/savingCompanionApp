import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { createAssetWithSnapshot, listAssetsWithLatestValue, type AssetType } from '@/db/queries/assets';
import { formatCents, parseAmountInput } from '@/lib/money';
import { getCurrentMonthKey } from '@/lib/month';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'bank', label: 'Banco' },
  { value: 'investment', label: 'Inversión' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'other', label: 'Otro' },
];

type AssetRow = Awaited<ReturnType<typeof listAssetsWithLatestValue>>[number];

export default function Activos() {
  const [assets, setAssets] = useState<AssetRow[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('bank');
  const [value, setValue] = useState('');

  const reload = useCallback(() => {
    listAssetsWithLatestValue().then(setAssets);
  }, []);

  useFocusEffect(reload);

  async function handleAdd() {
    if (!name.trim() || !value.trim()) return;
    await createAssetWithSnapshot({ name: name.trim(), type, value: parseAmountInput(value), monthKey: currentMonthKey });
    setName('');
    setValue('');
    setShowForm(false);
    reload();
  }

  if (!assets) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  const total = assets.reduce((sum, a) => sum + a.latestValue, 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.pad}>
        <Text style={styles.title}>Activos</Text>

        <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.md }}>
          {assets.map((a) => (
            <View key={a.id} style={styles.assetRow}>
              <View style={styles.assetIcon}>
                <Text style={styles.assetIconLabel}>{a.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <Text style={styles.assetName}>{a.name}</Text>
              <Text style={styles.assetValue}>{formatCents(a.latestValue)}</Text>
            </View>
          ))}

          {showForm ? (
            <Card style={{ gap: spacing.sm }}>
              <TextField label="Nombre" value={name} onChangeText={setName} placeholder="p. ej. Cuenta de ahorro" />
              <View style={styles.chipRow}>
                {ASSET_TYPES.map((t) => (
                  <Chip key={t.value} label={t.label} selected={type === t.value} onPress={() => setType(t.value)} />
                ))}
              </View>
              <TextField label="Valor actual" value={value} onChangeText={setValue} suffix="€" keyboardType="decimal-pad" />
              <Button label="Añadir" onPress={handleAdd} />
            </Card>
          ) : (
            <Button label="+ Añadir activo" variant="secondary" onPress={() => setShowForm(true)} />
          )}

          <View style={styles.totalStrip}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCents(total)}</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { flex: 1, padding: spacing.xl },
  title: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '600', color: theme.textPrimary },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  assetIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: theme.textPrimary, alignItems: 'center', justifyContent: 'center' },
  assetIconLabel: { fontFamily: typography.fontDisplay, fontWeight: '700', fontSize: 11, color: theme.background },
  assetName: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13, color: theme.textPrimary },
  assetValue: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 14, color: theme.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  totalStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', padding: 14, borderRadius: radius.lg, backgroundColor: theme.textPrimary },
  totalLabel: { fontFamily: typography.fontMono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.background, opacity: 0.6 },
  totalValue: { fontFamily: typography.fontDisplay, fontSize: 18, fontWeight: '600', color: theme.background },
});
