import { Stack } from 'expo-router';

export default function CierreMensualLayout() {
  return <Stack screenOptions={{ headerShown: false, presentation: 'modal' }} />;
}
