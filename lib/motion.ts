import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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

/** Giro 3D reutilizable para tarjetas con cara delantera/trasera (Activos, la tarjeta de Ahorro de Inicio). */
export function useFlip() {
  const [flipped, setFlipped] = useState(false);
  const progress = useSharedValue(0);

  function toggle() {
    progress.value = withTiming(flipped ? 0 : 1, { duration: 500 });
    setFlipped((f) => !f);
  }

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${progress.value * 180}deg` }],
    backfaceVisibility: 'hidden',
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${progress.value * 180 - 180}deg` }],
    backfaceVisibility: 'hidden',
  }));

  return { flipped, toggle, frontStyle, backStyle };
}
