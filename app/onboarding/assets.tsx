import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { StepDots } from '@/components/StepDots';
import { TextField } from '@/components/TextField';
import { createAssetWithSnapshot, type AssetType } from '@/db/queries/assets';
import { createProfile } from '@/db/queries/profile';
import { formatCents, parseAmountInput } from '@/lib/money';
import { getCurrentMonthKey } from '@/lib/month';
import { useOnboardingDraft } from '@/store/onboardingDraft';
import { colors, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'bank', label: 'Banco' },
  { value: 'investment', label: 'Inversión' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'other', label: 'Otro' },
];

export default function OnboardingAssets() {
  const { annualSalaryCents, monthlyNetPayCents, payDayOfMonth, assets, addAsset, removeAsset, reset } =
    useOnboardingDraft();

  const [showForm, setShowForm] = useState(assets.length === 0);
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('bank');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  function handleAddAsset() {
    if (!name.trim() || !value.trim()) return;
    addAsset({ name: name.trim(), type, valueCents: parseAmountInput(value) });
    setName('');
    setValue('');
    setShowForm(false);
  }

  async function finish(skipAssets: boolean) {
    setSaving(true);
    await createProfile({
      annualSalary: annualSalaryCents,
      monthlyNetPay: monthlyNetPayCents,
      currency: 'EUR',
      payDayOfMonth,
    });

    if (!skipAssets) {
      const monthKey = getCurrentMonthKey();
      for (const draftAsset of assets) {
        await createAssetWithSnapshot({
          name: draftAsset.name,
          type: draftAsset.type,
          value: draftAsset.valueCents,
          monthKey,
        });
      }
    }

    reset();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <StepDots total={3} current={2} />
        <Text style={styles.eyebrow}>Paso 3 de 3</Text>
        <Text style={styles.title}>Tus activos de partida</Text>
        <Text style={styles.hint}>Añade lo que tienes ahora. Es la foto de salida para medir tu progreso.</Text>

        <ScrollView style={styles.list} contentContainerStyle={{ gap: spacing.sm }}>
          {assets.map((a, i) => (
            <Card key={i} style={styles.assetRow}>
              <Text style={styles.assetName}>{a.name}</Text>
              <Text style={styles.assetValue}>{formatCents(a.valueCents)}</Text>
              <Text style={styles.remove} onPress={() => removeAsset(i)}>
                Quitar
              </Text>
            </Card>
          ))}

          {showForm ? (
            <Card style={{ gap: spacing.sm }}>
              <TextField label="Nombre" value={name} onChangeText={setName} placeholder="p. ej. Cuenta corriente" />
              <View style={styles.chipRow}>
                {ASSET_TYPES.map((t) => (
                  <Chip key={t.value} label={t.label} selected={type === t.value} onPress={() => setType(t.value)} />
                ))}
              </View>
              <TextField label="Valor actual" value={value} onChangeText={setValue} suffix="€" keyboardType="decimal-pad" />
              <Button label="Añadir a la lista" onPress={handleAddAsset} />
            </Card>
          ) : (
            <Button label="+ Añadir otro activo" variant="secondary" onPress={() => setShowForm(true)} />
          )}
        </ScrollView>

        <View style={styles.actions}>
          <Button label="Atrás" variant="ghost" onPress={() => router.back()} disabled={saving} />
          <Button label="Ahora no" variant="ghost" onPress={() => finish(true)} disabled={saving} />
        </View>
        {saving ? (
          <ActivityIndicator color={theme.accent} />
        ) : (
          <Button label="Empezar a ahorrar" onPress={() => finish(false)} disabled={saving} />
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
  title: {
    fontFamily: typography.fontDisplay,
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    marginTop: 6,
    marginBottom: 2,
  },
  hint: { fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textSecondary, lineHeight: 18 },
  list: { flex: 1, marginTop: spacing.lg },
  assetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  assetName: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13, color: theme.textPrimary },
  assetValue: {
    fontFamily: typography.fontMono,
    fontWeight: '600',
    fontSize: 13,
    color: theme.textPrimary,
  },
  remove: { fontFamily: typography.fontDisplay, fontSize: 11, color: theme.negative, marginLeft: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: spacing.md },
});
