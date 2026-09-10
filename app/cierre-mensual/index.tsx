import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { listAssetsWithLatestValue, upsertAssetSnapshot } from '@/db/queries/assets';
import { computeFixedTotal, computeVariableTotal, getMonthClose, upsertMonthClose } from '@/db/queries/monthClose';
import { getProfile } from '@/db/queries/profile';
import { calculateNetWorth, calculateNetWorthDelta, calculateSavings, calculateSavingsRate } from '@/lib/calculations';
import { formatMonthLabel, getCurrentMonthKey, getPreviousMonthKey } from '@/lib/month';
import { formatCents, parseAmountInput } from '@/lib/money';
import { colors, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

type AssetRow = { id: number; name: string; type: string };

export default function CierreMensual() {
  const params = useLocalSearchParams<{ monthKey?: string }>();
  const monthKey = params.monthKey ?? getPreviousMonthKey(getCurrentMonthKey());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [fixedTotal, setFixedTotal] = useState(0);
  const [income, setIncome] = useState('');
  const [values, setValues] = useState<Record<number, string>>({});

  useEffect(() => {
    (async () => {
      const [profile, existingClose, assetList, fixed] = await Promise.all([
        getProfile(),
        getMonthClose(monthKey),
        listAssetsWithLatestValue(),
        computeFixedTotal(),
      ]);

      setIncome(existingClose ? formatCents(existingClose.income).replace(' €', '') : formatCents(profile?.monthlyNetPay ?? 0).replace(' €', ''));
      setFixedTotal(fixed);
      setAssets(assetList);
      setValues(Object.fromEntries(assetList.map((a) => [a.id, formatCents(a.latestValue).replace(' €', '')])));
      setLoading(false);
    })();
  }, [monthKey]);

  const preview = useMemo(() => {
    const incomeCents = parseAmountInput(income);
    const netWorth = calculateNetWorth(assets.map((a) => ({ value: parseAmountInput(values[a.id] ?? '0') })));
    // El gasto variable ya registrado este mes se suma tal cual; no es editable aquí.
    const savings = calculateSavings(incomeCents, fixedTotal, 0);
    return { incomeCents, netWorth, savings };
  }, [income, values, assets, fixedTotal]);

  async function handleClose() {
    setSaving(true);
    const variableTotal = await computeVariableTotal(monthKey);
    const savings = calculateSavings(preview.incomeCents, fixedTotal, variableTotal);
    const savingsRate = calculateSavingsRate(savings, preview.incomeCents);
    const previousClose = await getMonthClose(getPreviousMonthKey(monthKey));
    const delta = previousClose ? calculateNetWorthDelta(preview.netWorth, previousClose.netWorth) : null;

    for (const a of assets) {
      await upsertAssetSnapshot(a.id, monthKey, parseAmountInput(values[a.id] ?? '0'));
    }
    await upsertMonthClose({
      monthKey,
      income: preview.incomeCents,
      fixedTotal,
      variableTotal,
      netWorth: preview.netWorth,
      savingsRate,
    });

    router.replace({
      pathname: '/cierre-mensual/resultado',
      params: {
        monthKey,
        savings: String(savings),
        netWorth: String(preview.netWorth),
        savingsRate: String(savingsRate),
        delta: delta === null ? '' : String(delta),
      },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <Text style={styles.eyebrow}>Cierre de mes</Text>
        <Text style={styles.title}>{formatMonthLabel(monthKey)}</Text>

        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.md }}>
          <TextField label="Ingresos de este mes" value={income} onChangeText={setIncome} suffix="€" keyboardType="decimal-pad" />

          <TextField label="Gastos fijos (automático)" value={formatCents(fixedTotal)} onChangeText={() => {}} editable={false} />

          <Text style={styles.sectionLabel}>Valor actual de tus activos</Text>
          {assets.map((a) => (
            <View key={a.id} style={styles.assetRow}>
              <Text style={styles.assetName}>{a.name}</Text>
              <View style={{ width: 110 }}>
                <TextField
                  label=""
                  value={values[a.id] ?? ''}
                  onChangeText={(text) => setValues((prev) => ({ ...prev, [a.id]: text }))}
                  suffix="€"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          ))}

          <View style={styles.previewCard}>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Ahorro estimado</Text>
              <Text style={styles.previewValue}>{formatCents(preview.savings)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Patrimonio total</Text>
              <Text style={styles.previewValue}>{formatCents(preview.netWorth)}</Text>
            </View>
          </View>
        </ScrollView>

        <Button label={saving ? 'Guardando…' : 'Cerrar mes'} onPress={handleClose} disabled={saving} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { flex: 1, padding: spacing.xl },
  eyebrow: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: theme.accent,
    fontWeight: '600',
  },
  title: { fontFamily: typography.fontDisplay, fontSize: 20, fontWeight: '600', color: theme.textPrimary, marginTop: 4, marginBottom: spacing.md },
  sectionLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
  },
  assetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  assetName: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
  previewCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: theme.cardGradientTo,
    gap: 8,
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  previewLabel: { fontFamily: typography.fontMono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#B9CBC6' },
  previewValue: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 15, color: theme.background },
});
