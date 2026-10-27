import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreen, GoogleButton } from '@/components/auth-screen';
import { Button } from '@/components/button';
import { HeaderButton } from '@/components/header-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ApiError } from '@/lib/api-client';
import { useSession } from '@/lib/session';

const MIN_PASSWORD = 8;

export default function SignUpScreen() {
  const { signUp } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailLooksValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const canSubmit =
    name.trim().length > 0 && emailLooksValid && password.length >= MIN_PASSWORD && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signUp(name.trim(), email.trim().toLowerCase(), password);
      // New accounts have no shop yet → the guard opens onboarding.
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 429
          ? 'Too many attempts. Wait a minute and try again.'
          : e instanceof Error
            ? e.message
            : 'Something went wrong.',
      );
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Free to start. Set up your shop in a minute."
      footer={
        <View style={styles.switch}>
          <ThemedText themeColor="textSecondary">Already have an account?</ThemedText>
          <HeaderButton title="Sign in" onPress={() => router.replace('/sign-in')} />
        </View>
      }>
      <GoogleButton onError={setError} />
      <TextField
        label="Your name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
      />
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
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      <ThemedText
        type="caption"
        themeColor={password.length > 0 && password.length < MIN_PASSWORD ? 'danger' : 'textSecondary'}>
        At least {MIN_PASSWORD} characters
      </ThemedText>
      {error && (
        <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      )}
      <Button title="Create account" onPress={onSubmit} loading={submitting} disabled={!canSubmit} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});
