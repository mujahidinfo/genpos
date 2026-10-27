import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet } from 'react-native';

import { useShop } from '@/api/queries';
import type { Role } from '@/api/types';
import { Button } from '@/components/button';
import { Card, DetailRow } from '@/components/card';
import { Spacing } from '@/constants/theme';
import { API_URL } from '@/lib/config';
import { useCurrentUser, useSession } from '@/lib/session';

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin',
  CASHIER: 'Cashier',
  INVENTORY_MANAGER: 'Inventory manager',
};

export default function AccountScreen() {
  const user = useCurrentUser();
  const { signOut } = useSession();
  const { data: shop } = useShop();
  const [signingOut, setSigningOut] = useState(false);

  const doSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  const confirmSignOut = () => {
    // Alert.alert has no buttons on web.
    if (Platform.OS === 'web') return void doSignOut();
    Alert.alert('Sign out?', 'You will need your email and password to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: doSignOut },
    ]);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Card title="You">
        <DetailRow label="Name" value={user.name} emphasis />
        <DetailRow label="Email" value={user.email} />
        <DetailRow label="Role" value={ROLE_LABEL[user.role]} />
      </Card>

      {shop && (
        <Card title="Shop">
          <DetailRow label="Name" value={shop.name} emphasis />
          <DetailRow label="Currency" value={shop.currency} />
          <DetailRow label={shop.taxName} value={`${shop.taxRate}%`} />
          {shop.phone && <DetailRow label="Phone" value={shop.phone} />}
          {shop.address && <DetailRow label="Address" value={shop.address} />}
        </Card>
      )}

      <Card title="App">
        <DetailRow label="Version" value={Constants.expoConfig?.version ?? '—'} />
        {__DEV__ && <DetailRow label="API" value={API_URL} />}
      </Card>

      <Button title="Sign out" variant="danger" onPress={confirmSignOut} loading={signingOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
});
