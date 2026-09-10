import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * En web, expo-sqlite depende de un worker + WebAssembly que aquí no
 * arranca de forma fiable, así que la versión web (solo usada para
 * capturas de PREVIEW) se salta la base de datos por completo.
 */
export default function RootLayoutWeb() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
