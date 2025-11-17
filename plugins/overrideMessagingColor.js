const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withOverrideMessagingColor(config) {
  return withAndroidManifest(config, (conf) => {
    const manifest = conf.modResults;
    manifest.manifest.$ = manifest.manifest.$ || {};
    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const application = manifest.manifest.application && manifest.manifest.application[0];
    if (application) {
      application['meta-data'] = application['meta-data'] || [];

      // Ensure our meta-data exists or update existing one
      const KEY = 'com.google.firebase.messaging.default_notification_color';
      let item = application['meta-data'].find((m) => m.$ && m.$['android:name'] === KEY);
      if (!item) {
        item = {
          $: {
            'android:name': KEY,
            'android:resource': '@color/notification_icon_color',
          },
        };
        application['meta-data'].push(item);
      }
      // Force replacement to avoid manifest merge conflict
      item.$['tools:replace'] = 'android:resource';
    }

    return conf;
  });
};