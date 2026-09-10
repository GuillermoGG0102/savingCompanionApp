import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

export default function Placeholder() {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="dark" />
      <Text style={[styles.label, { color: theme.accent }]}>Saving Companion</Text>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Cimientos listos (F1)</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Base de datos, esquema y sistema de diseño en marcha. Las pantallas de verdad llegan en F2.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  label: {
    fontFamily: typography.fontMono,
    fontSize: typography.size.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.size.xl,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.size.base,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
