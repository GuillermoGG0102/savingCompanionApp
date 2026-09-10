import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { StepDots } from '@/components/StepDots';
import { TextField } from '@/components/TextField';
import { parseAmountInput } from '@/lib/money';
import { useOnboardingDraft } from '@/store/onboardingDraft';
import { colors, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

export default function OnboardingSalary() {
  const setSalary = useOnboardingDraft((s) => s.setSalary);
  const [annualSalary, setAnnualSalary] = useState('36.000');
  const [monthlyNetPay, setMonthlyNetPay] = useState('2.100');

  function handleContinue() {
    setSalary(parseAmountInput(annualSalary), parseAmountInput(monthlyNetPay));
    router.push('/onboarding/payday');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <StepDots total={3} current={0} />
        <Text style={styles.eyebrow}>Paso 1 de 3</Text>
        <Text style={styles.title}>¿Cuál es tu situación salarial?</Text>
        <Text style={styles.hint}>Con esto calculamos tu ahorro cada mes. Puedes cambiarlo luego.</Text>

        <View style={styles.fields}>
          <TextField
            label="Salario bruto anual"
            value={annualSalary}
            onChangeText={setAnnualSalary}
            suffix="€ / año"
            keyboardType="decimal-pad"
          />
          <TextField
            label="Nómina neta mensual"
            value={monthlyNetPay}
            onChangeText={setMonthlyNetPay}
            suffix="€ / mes"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.spacer} />
        <Button label="Continuar" onPress={handleContinue} />
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
  fields: { gap: spacing.md, marginTop: spacing.lg },
  spacer: { flex: 1 },
});
