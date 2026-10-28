import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChangePassword } from '@/api/queries';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api-client';

const MIN_PASSWORD = 8;

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && confirm !== next;
  const valid = next.length >= MIN_PASSWORD && next === confirm;

  const submit = async () => {
    if (!valid) return;
    setError(null);
    try {
      await change.mutateAsync({ currentPassword: current || undefined, newPassword: next });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
      if (Platform.OS !== 'web') Alert.alert('Password updated', 'Use your new password next time you sign in.');
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? 'Your current password isn’t right.'
          : e instanceof Error
            ? e.message
            : 'Could not change the password.',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three }}>
        <TextField
          label="Current password"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          autoComplete="current-password"
          placeholder="Leave empty if you signed in with Google"
          autoFocus
        />
        <TextField
          label="New password"
          value={next}
          onChangeText={setNext}
          secureTextEntry
          autoComplete="new-password"
        />
        <ThemedText
          type="caption"
          themeColor={next.length > 0 && next.length < MIN_PASSWORD ? 'danger' : 'textSecondary'}>
          At least {MIN_PASSWORD} characters
        </ThemedText>
        <TextField
          label="Repeat new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        {mismatch && (
          <ThemedText type="caption" themeColor="danger">
            The two passwords don’t match.
          </ThemedText>
        )}
        {error && (
          <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite" selectable>
            {error}
          </ThemedText>
        )}
      </ScrollView>
      <View
        style={{
          padding: Spacing.three,
          paddingBottom: Spacing.three + Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0),
          borderTopWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.backgroundElement,
        }}>
        <Button title="Update password" onPress={submit} loading={change.isPending} disabled={!valid} />
      </View>
    </KeyboardAvoidingView>
  );
}
