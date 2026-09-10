import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { StepDots } from '@/components/StepDots';
import { TextField } from '@/components/TextField';
import { parseAmountInput } from '@/lib/money';
import { useQuickExpenseDraft } from '@/store/quickExpenseDraft';
import { colors, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

export default function RegistrarGastoAmount() {
  const setAmount = useQuickExpenseDraft((s) => s.setAmount);
  const [raw, setRaw] = useState('');

  function handleNext() {
    setAmount(parseAmountInput(raw));
    router.push('/registrar-gasto/categoria');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <StepDots total={3} current={0} />
        <Text style={styles.eyebrow}>Toque 1 de 3 · Importe</Text>

        <View style={styles.center}>
          <TextField label="Importe" value={raw} onChangeText={setRaw} suffix="€" placeholder="0,00" keyboardType="decimal-pad" />
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.close}>Cancelar</Text>
          </Pressable>
          <Button label="Siguiente →" onPress={handleNext} disabled={!raw.trim()} style={{ flex: 1 }} />
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
    textAlign: 'center',
  },
  center: { flex: 1, justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  close: { fontFamily: typography.fontDisplay, fontSize: 13, color: theme.textMuted, fontWeight: '600' },
});
