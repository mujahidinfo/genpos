import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useShop, useUpdateShop } from '@/api/queries';
import type { Shop } from '@/api/types';
import { Button } from '@/components/button';
import { QueryState } from '@/components/query-state';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useActiveShop, useSession } from '@/lib/session';

/** Edit the shop's name, phone, address and email (shown on receipts). */
export default function ShopFormScreen() {
  const query = useShop();
  if (!query.data) return <QueryState isLoading={query.isLoading} error={query.error} onRetry={query.refetch} />;
  return <ShopForm shop={query.data} />;
}

function ShopForm({ shop }: { shop: Shop }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const active = useActiveShop();
  const { workspaces, refreshWorkspaces } = useSession();
  const update = useUpdateShop();

  const [name, setName] = useState(shop.name);
  const [phone, setPhone] = useState(shop.phone ?? '');
  const [address, setAddress] = useState(shop.address ?? '');
  const [email, setEmail] = useState(shop.email ?? '');
  const [error, setError] = useState<string | null>(null);

  // A one-outlet business has one name; keep the business and the outlet in step.
  const singleBranch = workspaces.find((w) => w.id === active.businessId)?.shops.length === 1;
  const emailOk = email.trim() === '' || /^\S+@\S+\.\S+$/.test(email.trim());
  const valid = name.trim().length > 0 && emailOk;

  const submit = async () => {
    if (!valid) return;
    setError(null);
    try {
      await update.mutateAsync({
        name: name.trim(),
        ...(singleBranch && { businessName: name.trim() }),
        phone: phone.trim(),
        address: address.trim(),
        // The API rejects an empty email; leave it unchanged instead of clearing.
        ...(email.trim() && { email: email.trim() }),
      });
      await refreshWorkspaces();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the shop details.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three }}>
        <TextField label="Shop name" value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="next" />
        <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Printed on receipts" />
        <TextField label="Address" value={address} onChangeText={setAddress} placeholder="Street, area, city" multiline />
        <TextField
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {!emailOk && (
          <ThemedText type="caption" themeColor="danger">
            That email doesn’t look right.
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
        <Button title="Save" onPress={submit} loading={update.isPending} disabled={!valid} />
      </View>
    </KeyboardAvoidingView>
  );
}
