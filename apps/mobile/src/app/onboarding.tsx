import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { Button } from '@/components/button';
import { HeaderButton } from '@/components/header-button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCurrentUser, useSession } from '@/lib/session';

const CURRENCIES = [
  { code: 'BDT', label: '৳ BDT' },
  { code: 'INR', label: '₹ INR' },
  { code: 'PKR', label: '₨ PKR' },
  { code: 'USD', label: '$ USD' },
];

/** One screen from sign-up to selling: name the shop, pick currency, go. */
export default function OnboardingScreen() {
  const theme = useTheme();
  const user = useCurrentUser();
  const { createBusiness, signOut } = useSession();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await createBusiness({ name: name.trim(), phone: phone.trim() || undefined, currency });
      // The guard opens the app on the Sell tab.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your shop.');
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      title={`Welcome, ${user.name.split(' ')[0]}`}
      subtitle="Set up your shop — you can change this later."
      footer={
        <View style={styles.footer}>
          <HeaderButton title="Use a different account" onPress={signOut} />
        </View>
      }>
      <TextField
        label="Shop name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Rahim Store"
        autoCapitalize="words"
        autoFocus
        returnKeyType="next"
      />
      <TextField
        label="Shop phone (optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="Printed on receipts"
      />
      <View style={styles.currency}>
        <ThemedText type="small" themeColor="textSecondary">
          Currency
        </ThemedText>
        <View style={styles.options}>
          {CURRENCIES.map((c) => {
            const selected = c.code === currency;
            return (
              <Pressable
                key={c.code}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCurrency(c.code)}
                style={[
                  styles.option,
                  {
                    backgroundColor: selected ? theme.primary : theme.backgroundElement,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}>
                <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimary : theme.text }}>
                  {c.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
      {error && (
        <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      )}
      <Button title="Start selling" onPress={onSubmit} loading={submitting} disabled={!name.trim()} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  currency: {
    gap: Spacing.one,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  option: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  footer: {
    alignItems: 'center',
  },
});
