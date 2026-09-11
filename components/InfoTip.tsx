import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

type Props = { title: string; text: string; dark?: boolean };

/** Icono "?" que abre una explicación en lenguaje sencillo de qué significa un dato o módulo. */
export function InfoTip({ title, text, dark }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable hitSlop={10} onPress={() => setOpen(true)} style={[styles.badge, dark && styles.badgeDark]}>
        <Text style={[styles.badgeLabel, dark && styles.badgeLabelDark]}>?</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.text}>{text}</Text>
            <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeLabel}>Entendido</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(17,25,23,.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDark: { backgroundColor: 'rgba(244,241,234,.15)' },
  badgeLabel: { fontFamily: typography.fontMono, fontSize: 10.5, fontWeight: '600', color: theme.textMuted },
  badgeLabelDark: { color: '#B9CBC6' },
  backdrop: { flex: 1, backgroundColor: 'rgba(11,25,22,.42)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { width: '100%', maxWidth: 340, backgroundColor: theme.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  title: { fontFamily: typography.fontDisplay, fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  text: { fontFamily: typography.fontDisplay, fontSize: 13, lineHeight: 19, color: theme.textSecondary },
  closeBtn: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: theme.textPrimary },
  closeLabel: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.background },
});
