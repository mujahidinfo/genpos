import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

/**
 * Google sign-in needs client IDs and a development/production build — the
 * native module isn't in Expo Go — so the button is only shown when both hold.
 */
export const isGoogleSignInAvailable =
  !!webClientId &&
  Platform.OS !== 'web' &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

/** Opens the native Google account picker. Resolves null if the user cancels. */
export async function getGoogleIdToken(): Promise<string | null> {
  // Loaded lazily so Expo Go never touches the missing native module.
  const { GoogleSignin, isSuccessResponse } = await import(
    '@react-native-google-signin/google-signin'
  );
  GoogleSignin.configure({ webClientId, iosClientId });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;
  if (!response.data.idToken) throw new Error('Google did not return an ID token');
  return response.data.idToken;
}
