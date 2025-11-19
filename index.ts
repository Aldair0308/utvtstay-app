import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

(globalThis as any).RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

if (Platform.OS !== 'web') {
  (async () => {
    try {
      const messagingModule = await import('@react-native-firebase/messaging');
      const appModule = await import('@react-native-firebase/app');
      const messagingInstance = messagingModule.getMessaging(appModule.getApp());
      await messagingModule.setBackgroundMessageHandler(messagingInstance, async () => {});
    } catch {}
  })();
}
