import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { INSTITUTION_ICONS, type InstitutionIconGroup } from '@/lib/institutionIcons';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;

const GROUPS: { key: InstitutionIconGroup; label: string }[] = [
  { key: 'banco', label: 'Bancos' },
  { key: 'digital', label: 'Digital' },
  { key: 'cripto', label: 'Cripto' },
];

type Props = {
  value: string | null;
  onChange: (key: string | null) => void;
};

/** Selector de logo de entidad (banco/digital/cripto) para un activo. Si no se elige ninguno, se muestran las iniciales del nombre. */
export function InstitutionIconPicker({ value, onChange }: Props) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={styles.fieldLabel}>Logo (opcional)</Text>
      <View style={styles.row}>
        <Pressable style={[styles.tile, styles.noneTile, value === null && styles.tileSelected]} onPress={() => onChange(null)}>
          <Text style={styles.noneLabel}>Aa</Text>
        </Pressable>
        {GROUPS.flatMap((g) =>
          INSTITUTION_ICONS.filter((i) => i.group === g.key).map((icon) => (
            <Pressable
              key={icon.key}
              style={[styles.tile, value === icon.key && styles.tileSelected]}
              onPress={() => onChange(icon.key)}
            >
              <Image source={icon.source} style={styles.tileImage} resizeMode="contain" />
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.surfaceRaised,
    borderWidth: 1.5,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  tileSelected: { borderColor: theme.accent },
  tileImage: { width: '100%', height: '100%' },
  noneTile: { backgroundColor: theme.background },
  noneLabel: { fontFamily: typography.fontDisplay, fontWeight: '700', fontSize: 13, color: theme.textMuted },
});
