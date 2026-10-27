import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json. Google sign-in's native plugin is added only when its
 * client IDs are configured — the plugin throws without an iOS URL scheme.
 *
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID  (required for ID tokens on both platforms)
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID  (iOS)
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const plugins = [...(config.plugins ?? [])];

  if (iosClientId) {
    const id = iosClientId.replace('.apps.googleusercontent.com', '');
    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: `com.googleusercontent.apps.${id}` },
    ]);
  }

  return { ...config, name: config.name ?? 'GenPOS', slug: config.slug ?? 'genpos', plugins };
};
