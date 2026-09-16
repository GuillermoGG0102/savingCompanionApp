import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const APP_LOCK_KEY = 'app-lock-enabled';

export async function isAppLockEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(APP_LOCK_KEY)) === 'true';
}

export async function setAppLockEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(APP_LOCK_KEY, enabled ? 'true' : 'false');
}

export async function canUseBiometricsAsync(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

/** Pide huella/Face ID (o el PIN del dispositivo como respaldo del propio sistema operativo). */
export async function authenticateAsync(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquea Saving Companion',
    cancelLabel: 'Cancelar',
  });
  return result.success;
}
