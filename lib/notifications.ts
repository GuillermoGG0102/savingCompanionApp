import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * El estado de "activado y a qué hora" se guarda en la propia programación
 * de expo-notifications, sin campos nuevos en la base de datos: es una
 * preferencia del dispositivo, no un dato financiero.
 */
const DAILY_REMINDER_ID = 'daily-reminder';

export type NotificationStatus = { enabled: boolean; hour: number; minute: number };

const DEFAULT_STATUS: NotificationStatus = { enabled: false, hour: 20, minute: 0 };

export async function getNotificationStatus(): Promise<NotificationStatus> {
  if (Platform.OS === 'web') return DEFAULT_STATUS;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existing = scheduled.find((n) => n.identifier === DAILY_REMINDER_ID);
  const trigger = existing?.trigger;
  if (!trigger || !('type' in trigger) || trigger.type !== 'daily') return DEFAULT_STATUS;

  return { enabled: true, hour: trigger.hour, minute: trigger.minute };
}

/** Devuelve false si el usuario ha denegado el permiso de notificaciones. */
export async function enableDailyReminder(hour: number, minute: number): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: '¿Qué has gastado hoy?',
      body: 'Toca para apuntarlo en menos de 10 segundos.',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
}
