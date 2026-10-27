import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getGoogleIdToken, isGoogleSignInAvailable } from '@/lib/google-sign-in';
import { useSession } from '@/lib/session';

/** Shared frame for sign-in, sign-up and onboarding. */
export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <ThemedText type="title">{title}</ThemedText>
              <ThemedText themeColor="textSecondary">{subtitle}</ThemedText>
            </View>
            <View style={styles.form}>{children}</View>
            {footer}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

/** "Continue with Google" — renders nothing where Google sign-in can't run. */
export function GoogleButton({ onError }: { onError: (message: string) => void }) {
  const { signInWithGoogle } = useSession();
  const [loading, setLoading] = useState(false);

  if (!isGoogleSignInAvailable) return null;

  const onPress = async () => {
    setLoading(true);
    try {
      const idToken = await getGoogleIdToken();
      if (idToken) await signInWithGoogle(idToken);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button title="Continue with Google" variant="secondary" onPress={onPress} loading={loading} />
      <ThemedText type="caption" themeColor="textSecondary" style={styles.or}>
        or use your email
      </ThemedText>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.five,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.one,
  },
  form: {
    gap: Spacing.three,
  },
  or: {
    textAlign: 'center',
  },
});
