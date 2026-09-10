import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { StepDots } from '@/components/StepDots';
import { useOnboardingDraft } from '@/store/onboardingDraft';
import { colors, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function OnboardingPayday() {
  const setPayDay = useOnboardingDraft((s) => s.setPayDay);
  const storedDay = useOnboardingDraft((s) => s.payDayOfMonth);
  const [day, setDay] = useState(storedDay);

  function handleContinue() {
    setPayDay(day);
    router.push('/onboarding/assets');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <StepDots total={3} current={1} />
        <Text style={styles.eyebrow}>Paso 2 de 3</Text>
        <Text style={styles.title}>¿Qué día cobras?</Text>
        <Text style={styles.hint}>Usamos esta fecha para organizar tus gastos fijos del mes.</Text>

        <View style={styles.grid}>
          {DAYS.map((d) => (
            <Pressable key={d} onPress={() => setDay(d)} style={[styles.cell, d === day && styles.cellOn]}>
              <Text style={[styles.cellLabel, d === day && styles.cellLabelOn]}>{d}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.spacer} />
        <View style={styles.actions}>
          <Button label="Atrás" variant="ghost" onPress={() => router.back()} style={styles.ghostBtn} />
          <Button label="Continuar" onPress={handleContinue} style={styles.flexBtn} />
        </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.lg,
  },
  cell: {
    width: '12.5%',
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cellOn: { backgroundColor: theme.textPrimary, borderColor: 'transparent' },
  cellLabel: { fontFamily: typography.fontMono, fontSize: 12, fontWeight: '600', color: theme.textSecondary },
  cellLabelOn: { color: theme.background },
  spacer: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  ghostBtn: { flex: 0 },
  flexBtn: { flex: 1 },
});
