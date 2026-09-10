import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

const theme = colors.light;

export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.dotOn]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 18 },
  dot: { width: 6, height: 6, borderRadius: 99, backgroundColor: theme.border },
  dotOn: { width: 18, backgroundColor: theme.accent },
});
