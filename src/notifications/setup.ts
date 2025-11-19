import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const initializeNotificationListeners = async () => {
  if (Platform.OS === "web") return;
  try {
    const messagingModule = await import("@react-native-firebase/messaging");
    const appModule = await import("@react-native-firebase/app");
    const messagingInstance = messagingModule.getMessaging(appModule.getApp());
    messagingModule.onMessage(messagingInstance, async (remoteMessage: any) => {
      const title = remoteMessage?.notification?.title || "Notificación";
      const body = remoteMessage?.notification?.body || "";
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: null,
      });
    });
  } catch {}
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
    const messagingModule = await import("@react-native-firebase/messaging");
    const appModule = await import("@react-native-firebase/app");
    const messagingInstance = messagingModule.getMessaging(appModule.getApp());
    await messagingModule.requestPermission(messagingInstance);
  } catch {}
};