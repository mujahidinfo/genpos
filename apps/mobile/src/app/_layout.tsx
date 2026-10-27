import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/lib/query-client';
import { SessionProvider, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[scheme];

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider
          value={{
            ...base,
            colors: {
              ...base.colors,
              primary: colors.primary,
              background: colors.background,
              card: colors.backgroundElement,
              text: colors.text,
              border: colors.border,
            },
          }}>
          <SplashScreenController />
          <RootNavigator />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

/** Keep the splash up until we know whether a saved session is still valid. */
function SplashScreenController() {
  const { status } = useSession();
  if (status !== 'loading') SplashScreen.hide();
  return null;
}

/** signed out → auth screens · no business yet → onboarding · otherwise the app. */
function RootNavigator() {
  const { status } = useSession();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'ready'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'needsShop'}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      {/* Direct children (not a group) so the guard can always land on sign-in. */}
      <Stack.Protected guard={status === 'signedOut' || status === 'loading'}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}
