import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from "react-native";
import { Medication } from "./storage";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {

  let token: string | null = null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const response = await Notifications.getExpoPushTokenAsync();
    token = response.data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1a8e2d",
      });
    }

    return token;
  } catch (error) {
    console.error("Error al obtener el token push:", error);
    return null;
  }
}

//prueba

export async function scheduleMedicationReminder(
  medication: Medication
): Promise<string | undefined> {
  if (!medication.reminderEnabled) return;

  try {
    let lastIdentifier: string | undefined;

    for (const time of medication.times) {
      const [hours, minutes] = time.split(":").map(Number);
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      // Usamos una lógica que TypeScript pueda validar fácilmente
      let trigger: Notifications.NotificationTriggerInput;

      if (Platform.OS === 'ios') {
        trigger = {
          type: SchedulableTriggerInputTypes.CALENDAR, // Agregamos el type que pedía el error
          hour: hours,
          minute: minutes,
          repeats: true,
        };
      } else {
        trigger = {
          type: SchedulableTriggerInputTypes.DAILY, // Cambiamos a DAILY para Android
          hour: hours,
          minute: minutes,
        };
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Recordatorio de Medicación",
          body: `Es hora de tomar ${medication.name} (${medication.dosage})`,
          data: { medicationId: medication.id },
        },
        trigger,  
      });

      lastIdentifier = identifier;
    }

    return lastIdentifier;
  } catch (error) {
    console.error("Error scheduling medication reminder:", error);
    return undefined;
  }
}

export async function scheduleRefillReminder(
  medication: Medication
): Promise<string | undefined> {
  if (!medication.refillReminder) return;

  try {
    // Programa una notificación cuando la cantidad del medicamento sea bajo.
    if (medication.currentSupply <= medication.refillAt) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Refill Reminder",
          body: `Your ${medication.name} supply is running low. Current supply: ${medication.currentSupply}`,
          data: { medicationId: medication.id, type: "refill" },
        },
        trigger: null, // Mostrar inmediatamente
      });

      return identifier;
    }
  } catch (error) {
    console.error("Error scheduling refill reminder:", error);
    return undefined;
  }
}

export async function cancelMedicationReminders(
  medicationId: string
): Promise<void> {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      const data = notification.content.data as {
        medicationId?: string;
      } | null;
      if (data?.medicationId === medicationId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  } catch (error) {
    console.error("Error canceling medication reminders:", error);
  }
}

export async function updateMedicationReminders(
  medication: Medication
): Promise<void> {

  try {
    // Cancelar recordatorios existentes
    await cancelMedicationReminders(medication.id);

    // Programar nuevos recordatorios
    await scheduleMedicationReminder(medication);
    await scheduleRefillReminder(medication);
  } catch (error) {
    console.error("Error updating medication reminders:", error);
  }
}
