import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, typography } from '@/theme/tokens';

const theme = colors.light;

type Props = {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  dashed?: boolean;
};

export function Chip({ label, onPress, selected, dashed }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.selected, dashed && styles.dashed]}
    >
      <Text style={[styles.label, selected && styles.labelSelected, dashed && styles.labelDashed]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selected: {
    backgroundColor: theme.textPrimary,
    borderColor: 'transparent',
  },
  dashed: {
    borderStyle: 'dashed',
    borderColor: theme.accent,
  },
  label: {
    fontFamily: typography.fontDisplay,
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  labelSelected: {
    color: theme.background,
  },
  labelDashed: {
    color: theme.accent,
  },
});
