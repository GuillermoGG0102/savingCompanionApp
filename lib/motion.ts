import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Entrada 3D de cada pantalla cada vez que su pestaña recibe el foco
 * (perspectiva + giro + opacidad), como en el mockup de Claude Design. Si el
 * sistema tiene activado "reducir movimiento", aparece directo sin animar.
 */
export function useEnter3D() {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useFocusEffect(
    useCallback(() => {
      progress.value = reduceMotion ? 1 : 0;
      progress.value = reduceMotion ? 1 : withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduceMotion])
  );

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ perspective: 1400 }, { rotateY: `${(1 - progress.value) * -14}deg` }, { translateX: (1 - progress.value) * 34 }],
  }));
}
