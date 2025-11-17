import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const initializeNotificationListeners = () => {
  messaging().onMessage(async (remoteMessage) => {
    const title = remoteMessage?.notification?.title || "Notificación";
    const body = remoteMessage?.notification?.body || "";
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  });
};

export const ensureNotificationPermissions = async () => {
  if (Platform.OS !== "android") return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      await Notifications.requestPermissionsAsync();
    }
  } catch {}
  try {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
    });
  } catch {}
  try {
    await messaging().requestPermission();
  } catch {}
};