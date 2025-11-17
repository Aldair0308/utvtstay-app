import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import apiClient from "../services/api";

type RegisterPayload = {
  token: string;
  device_id: string;
  platform: "android" | "ios" | "web";
  device_name?: string;
  app_version?: string;
  metadata?: any;
};

const getFCMTokenAuto = async (): Promise<string | null> => {
  try {
    const messaging = require("@react-native-firebase/messaging").default;
    await messaging().requestPermission();
    const token = await messaging().getToken();
    if (token) return token;
  } catch {}
  try {
    const Notifications = require("expo-notifications");
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return null;
    const res = await Notifications.getDevicePushTokenAsync();
    const token = res?.data || null;
    return token;
  } catch {
    return null;
  }
};

const getAppVersion = (): string | undefined => {
  try {
    const pkg = require("../../package.json");
    return pkg?.version;
  } catch {
    return undefined;
  }
};

const ensureStableSuffix = async (): Promise<string> => {
  const key = "deviceStableSuffix";
  const existing = await AsyncStorage.getItem(key);
  if (existing) return existing;
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  const suffix = `${rand}-${ts}`;
  await AsyncStorage.setItem(key, suffix);
  return suffix;
};

export const useDeviceRegistration = () => {
  const registerDevice = useCallback(async (fcmToken?: string) => {
    const token = await AsyncStorage.getItem("userToken");
    const userRaw = await AsyncStorage.getItem("userData");
    if (!token || !userRaw) throw new Error("No autenticado");

    const user = JSON.parse(userRaw || "{}");
    const userId = String(user?.id || "unknown");

    const resolvedToken = fcmToken || (await getFCMTokenAuto());
    if (!resolvedToken) throw new Error("No se obtuvo FCM token");

    const suffix = await ensureStableSuffix();
    const platform = (Platform.OS as "android" | "ios" | "web") || "android";
    const deviceId = `${platform}-${userId}-${suffix}`;

    const deviceName = platform === "android" ? "Android Device" : platform === "ios" ? "iOS Device" : "Web Device";
    const appVersion = getAppVersion();

    const payload: RegisterPayload = {
      token: resolvedToken,
      device_id: deviceId,
      platform,
      device_name: deviceName,
      app_version: appVersion,
      metadata: {
        timestamp: new Date().toISOString(),
        sdkVersion: (require("../../package.json")?.dependencies?.expo as string) || "unknown",
        deviceInfo: {
          brand: platform === "android" ? "Android" : platform === "ios" ? "Apple" : "Web",
          modelName: "",
          osName: platform === "android" ? "Android" : platform === "ios" ? "iOS" : "Web",
          osVersion: String(Platform.Version),
        },
        registeredAt: new Date().toISOString(),
      },
    };

    const res = await apiClient.post("/devices", payload);
    const success = !!res?.data?.success;
    if (!success) throw new Error("Registro de dispositivo fallido");
    await AsyncStorage.setItem("deviceRegistered", "true");
    return res?.data?.device;
  }, []);

  const ensureRegistered = useCallback(async () => {
    const registered = await AsyncStorage.getItem("deviceRegistered");
    if (registered === "true") return;
    await registerDevice();
  }, [registerDevice]);

  return { registerDevice, ensureRegistered };
};

export default useDeviceRegistration;