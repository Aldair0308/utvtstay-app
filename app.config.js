const path = require("path");

module.exports = ({ config }) => {
  return {
    ...config,
    name: "utvtstay",
    slug: "utvtstay",
    version: "1.0.2",
    orientation: "portrait",
    icon: "./assets/splash-icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      icon: "./assets/splash-icon.png",
      adaptiveIcon: {
        foregroundImage: "./assets/splash-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.teamstay.utvtstay",
      googleServicesFile: path.resolve(__dirname, "google-services.json"),
      permissions: [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "WAKE_LOCK",
        "com.google.android.c2dm.permission.RECEIVE",
        "POST_NOTIFICATIONS",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    notification: {
      icon: "./assets/icon.png",
      color: "#FF6B35",
      androidMode: "default",
      androidCollapsedTitle: "utvstay",
    },
    plugins: [
      "expo-dev-client",
      "@react-native-firebase/app",
      [
        "@react-native-firebase/messaging",
        {
          android: {
            requestPermission: true,
          },
        },
      ],
      require("./plugins/overrideMessagingColor"),
    ],
    extra: {
      eas: {
        projectId: "130fdcf1-1771-47a8-99b5-726b2ff3eca4",
      },
      API_BASE_URL: "https://estadias-production.up.railway.app/api",
    },
  };
};