import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreen, GoogleButton } from '@/components/auth-screen';
import { Button } from '@/components/button';
import { HeaderButton } from '@/components/header-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ApiError } from '@/lib/api-client';
import { API_URL } from '@/lib/config';
import { useSession } from '@/lib/session';

export default function SignInScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // Stack.Protected swaps to onboarding or the app automatically.
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 400
          ? 'Wrong email or password.'
          : e instanceof ApiError && e.status === 401 && e.message === 'Invalid credentials'
            ? 'Wrong email or password.'
            : e instanceof Error
              ? e.message
              : 'Something went wrong.',
      );
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      title="GenPOS"
      subtitle="Sign in to your shop"
      footer={
        <View style={styles.footer}>
          <View style={styles.switch}>
            <ThemedText themeColor="textSecondary">New to GenPOS?</ThemedText>
            <HeaderButton title="Create an account" onPress={() => router.replace('/sign-up')} />
          </View>
          {__DEV__ && (
            <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
              API: {API_URL}
            </ThemedText>
          )}
        </View>
      }>
      <GoogleButton onError={setError} />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      {error && (
        <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      )}
      <Button title="Sign in" onPress={onSubmit} loading={submitting} disabled={!canSubmit} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 16,
  },
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  center: {
    textAlign: 'center',
  },
});
