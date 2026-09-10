import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getMonthClose } from '@/db/queries/monthClose';
import { getProfile } from '@/db/queries/profile';
import { formatMonthLabel, getCurrentMonthKey, getPreviousMonthKey } from '@/lib/month';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const targetMonthKey = getPreviousMonthKey(getCurrentMonthKey());

export default function Home() {
  const [status, setStatus] = useState<'loading' | 'needs-onboarding' | 'ready'>('loading');
  const [pendingClose, setPendingClose] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getProfile().then((profile) => setStatus(profile ? 'ready' : 'needs-onboarding'));
      getMonthClose(targetMonthKey).then((close) => setPendingClose(!close));
    }, [])
  );

  if (status === 'loading') {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  if (status === 'needs-onboarding') {
    return <Redirect href="/onboarding/salary" />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <Text style={styles.label}>Saving Companion</Text>
        <Text style={styles.title}>¿Qué quieres hacer?</Text>
        <Text style={styles.hint}>El panel con tu ahorro y patrimonio llega en la siguiente fase (F4).</Text>

        {pendingClose && (
          <Pressable style={styles.banner} onPress={() => router.push('/cierre-mensual')}>
            <Text style={styles.bannerIcon}>📅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Cierra {formatMonthLabel(targetMonthKey)}</Text>
              <Text style={styles.bannerSubtitle}>Toca para registrar el valor de tus activos</Text>
            </View>
            <Text style={styles.bannerGo}>Ir →</Text>
          </Pressable>
        )}

        <View style={styles.actions}>
          <Pressable style={styles.primaryAction} onPress={() => router.push('/registrar-gasto')}>
            <Text style={styles.primaryActionLabel}>+ Registrar gasto</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => router.push('/gastos-fijos')}>
            <Text style={styles.actionLabel}>Gastos fijos</Text>
          </Pressable>
          <Pressable style={styles.action} onPress={() => router.push('/categorias')}>
            <Text style={styles.actionLabel}>Categorías</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { flex: 1, padding: spacing.xl },
  label: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: theme.accent,
    fontWeight: '600',
  },
  title: { fontFamily: typography.fontDisplay, fontSize: 24, fontWeight: '600', color: theme.textPrimary, marginTop: 8 },
  hint: { fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textSecondary, marginTop: 6, lineHeight: 18 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: theme.cardGradientTo,
    marginTop: spacing.lg,
  },
  bannerIcon: { fontSize: 20 },
  bannerTitle: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13, color: theme.background },
  bannerSubtitle: { fontFamily: typography.fontDisplay, fontSize: 11, color: '#B9CBC6' },
  bannerGo: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12, color: theme.accentStrong },
  actions: { gap: spacing.sm, marginTop: spacing.xxl },
  primaryAction: { backgroundColor: theme.textPrimary, borderRadius: radius.lg, padding: 16, alignItems: 'center' },
  primaryActionLabel: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 14, color: theme.background },
  action: {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionLabel: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 14, color: theme.textPrimary },
});
