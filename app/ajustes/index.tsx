import { router } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SecurityLockSetting } from '@/components/SecurityLockSetting';
import { sqlite } from '@/db/client';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const DB_NAME = 'saving-companion.db';

function getDbFile() {
  return new File(Paths.document, 'SQLite', DB_NAME);
}

export default function Ajustes() {
  const [message, setMessage] = useState<string | null>(null);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [restoreDone, setRestoreDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setMessage(null);
    setBusy(true);
    try {
      await sqlite.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
      const dbFile = getDbFile();
      if (!dbFile.exists) {
        setMessage('No se encontró la base de datos todavía.');
        return;
      }
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        setMessage('Compartir no está disponible en este dispositivo.');
        return;
      }
      await Sharing.shareAsync(dbFile.uri, { mimeType: 'application/octet-stream', dialogTitle: 'Copia de seguridad de Saving Companion' });
    } catch {
      setMessage('No se pudo exportar la copia de seguridad.');
    } finally {
      setBusy(false);
    }
  }

  async function handlePickRestoreFile() {
    setMessage(null);
    try {
      const picked = await File.pickFileAsync();
      if (picked.canceled) return;
      setPendingRestoreFile(picked.result);
    } catch {
      setMessage('No se pudo abrir el selector de archivos.');
    }
  }

  async function handleConfirmRestore() {
    if (!pendingRestoreFile) return;
    setBusy(true);
    try {
      await sqlite.closeAsync();
      const dbFile = getDbFile();
      await pendingRestoreFile.copy(dbFile, { overwrite: true });
      const wal = new File(dbFile.uri + '-wal');
      const shm = new File(dbFile.uri + '-shm');
      if (wal.exists) wal.delete();
      if (shm.exists) shm.delete();
      setRestoreDone(true);
    } catch {
      setMessage('No se pudo restaurar la copia. Puede que el archivo elegido no sea válido.');
      setPendingRestoreFile(null);
    } finally {
      setBusy(false);
    }
  }

  if (restoreDone) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.pad}>
          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.doneTitle}>Copia restaurada</Text>
            <Text style={styles.doneText}>
              Cierra la app por completo ahora (no basta con minimizarla) y vuelve a abrirla para que los datos restaurados se carguen
              correctamente.
            </Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.pad}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Atrás</Text>
        </Pressable>
        <Text style={styles.title}>Ajustes</Text>

        <ScrollView contentContainerStyle={{ gap: spacing.md, paddingTop: spacing.md }}>
          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.cardTitle}>Copia de seguridad</Text>
            <Text style={styles.cardText}>
              Exporta un archivo con todos tus datos (activos, gastos, ingresos, cierres) para guardarlo donde quieras. Si cambias de
              móvil o borras la app, podrás restaurarlo desde aquí.
            </Text>

            {Platform.OS === 'web' ? (
              <Text style={styles.webNote}>Esto solo funciona en la app instalada en tu móvil, no en esta vista previa.</Text>
            ) : (
              <>
                <Button label="Exportar copia de seguridad" variant="secondary" onPress={handleExport} disabled={busy} />

                {pendingRestoreFile ? (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmText}>
                      ¿Seguro? Esto sustituirá TODOS tus datos actuales por los de la copia elegida. No se puede deshacer.
                    </Text>
                    <View style={styles.confirmRow}>
                      <Pressable onPress={handleConfirmRestore} disabled={busy}>
                        <Text style={styles.confirmYes}>Sí, restaurar</Text>
                      </Pressable>
                      <Pressable onPress={() => setPendingRestoreFile(null)} disabled={busy}>
                        <Text style={styles.confirmNo}>Cancelar</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Button label="Restaurar copia de seguridad" variant="ghost" onPress={handlePickRestoreFile} disabled={busy} />
                )}
              </>
            )}

            {message && <Text style={styles.message}>{message}</Text>}
          </Card>

          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.cardTitle}>Seguridad</Text>
            <SecurityLockSetting />
          </Card>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  pad: { flex: 1, padding: spacing.xl },
  back: { fontFamily: typography.fontDisplay, fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  title: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '600', color: theme.textPrimary, marginTop: spacing.sm },
  cardTitle: { fontFamily: typography.fontMono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: theme.textMuted, fontWeight: '600' },
  cardText: { fontFamily: typography.fontDisplay, fontSize: 12.5, lineHeight: 18, color: theme.textSecondary },
  webNote: { fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textMuted, fontStyle: 'italic' },
  message: { fontFamily: typography.fontDisplay, fontSize: 12, color: theme.negative },
  confirmBox: { gap: spacing.sm, padding: 12, borderRadius: radius.md, backgroundColor: 'rgba(224,96,60,.08)' },
  confirmText: { fontFamily: typography.fontDisplay, fontSize: 12, color: theme.textPrimary, lineHeight: 17 },
  confirmRow: { flexDirection: 'row', gap: spacing.md },
  confirmYes: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '700', color: theme.negative },
  confirmNo: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.textMuted },
  doneTitle: { fontFamily: typography.fontDisplay, fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  doneText: { fontFamily: typography.fontDisplay, fontSize: 13, lineHeight: 19, color: theme.textSecondary },
});
