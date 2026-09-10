import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { disableDailyReminder, enableDailyReminder, getNotificationStatus } from '@/lib/notifications';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export default function Ajustes() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    getNotificationStatus().then((status) => {
      setEnabled(status.enabled);
      setHour(status.hour);
      setMinute(status.minute);
      setLoading(false);
    });
  }, []);

  async function handleToggle(value: boolean) {
    setPermissionDenied(false);
    if (value) {
      const granted = await enableDailyReminder(hour, minute);
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      setEnabled(true);
    } else {
      await disableDailyReminder();
      setEnabled(false);
    }
  }

  async function changeHour(delta: number) {
    const nextHour = (hour + delta + 24) % 24;
    setHour(nextHour);
    if (enabled) await enableDailyReminder(nextHour, minute);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.pad}>
        <Text style={styles.eyebrow}>Ajustes</Text>
        <Text style={styles.title}>Recordatorio diario</Text>

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.icon}>
                <Text>🔔</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Avisarme cada día</Text>
                <Text style={styles.rowSubtitle}>Un aviso para apuntar lo que has gastado hoy</Text>
              </View>
              <Switch value={enabled} onValueChange={handleToggle} trackColor={{ true: theme.accent }} />
            </View>

            {enabled && (
              <>
                <View style={styles.divider} />
                <Text style={styles.centerHint}>Hora del aviso</Text>
                <View style={styles.timeRow}>
                  <Pressable style={styles.timeBtn} onPress={() => changeHour(-1)}>
                    <Text style={styles.timeBtnLabel}>−</Text>
                  </Pressable>
                  <Text style={styles.timeValue}>
                    {pad(hour)}:{pad(minute)}
                  </Text>
                  <Pressable style={styles.timeBtn} onPress={() => changeHour(1)}>
                    <Text style={styles.timeBtnLabel}>+</Text>
                  </Pressable>
                </View>
              </>
            )}

            {permissionDenied && (
              <Text style={styles.warning}>
                No hemos podido activar el aviso porque no tienes permiso de notificaciones. Actívalo en los ajustes del
                sistema de tu móvil.
              </Text>
            )}
          </View>
        )}

        <Text style={styles.footHint}>
          Si más adelante desactivas las notificaciones desde los ajustes del sistema, aquí te avisaremos con un mensaje
          para que sepas por qué ha dejado de sonar.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  pad: { flex: 1, padding: spacing.xl, gap: spacing.md },
  eyebrow: {
    fontFamily: typography.fontMono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: theme.accent,
    fontWeight: '600',
  },
  title: { fontFamily: typography.fontDisplay, fontSize: 20, fontWeight: '600', color: theme.textPrimary, marginTop: 4 },
  card: { borderRadius: radius.lg, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(14,158,146,0.12)', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13.5, color: theme.textPrimary },
  rowSubtitle: { fontFamily: typography.fontDisplay, fontSize: 11, color: theme.textMuted, marginTop: 1 },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: spacing.md },
  centerHint: { textAlign: 'center', fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textSecondary, marginBottom: spacing.sm },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  timeBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  timeBtnLabel: { fontFamily: typography.fontDisplay, fontSize: 18, fontWeight: '600', color: theme.textSecondary },
  timeValue: { fontFamily: typography.fontDisplay, fontSize: 32, fontWeight: '600', color: theme.textPrimary, minWidth: 100, textAlign: 'center' },
  warning: { marginTop: spacing.md, fontFamily: typography.fontDisplay, fontSize: 12, color: theme.negative, lineHeight: 17 },
  footHint: { fontFamily: typography.fontDisplay, fontSize: 11.5, color: theme.textMuted, lineHeight: 17 },
});
