import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet } from 'react-native';

import { useShop } from '@/api/queries';
import { Button } from '@/components/button';
import { Card, DetailRow } from '@/components/card';
import { ListRow } from '@/components/list-row';
import { Spacing } from '@/constants/theme';
import { API_URL } from '@/lib/config';
import { canEditCatalog, canManage, ROLE_LABEL } from '@/lib/roles';
import { useActiveShop, useCurrentUser, useSession } from '@/lib/session';

export default function AccountScreen() {
  const user = useCurrentUser();
  const active = useActiveShop();
  const { signOut, workspaces } = useSession();
  const { data: shop } = useShop();
  const [signingOut, setSigningOut] = useState(false);

  const branchCount = workspaces.reduce((n, w) => n + w.shops.length, 0);
  const isOwner = active.role === 'OWNER';

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
      <Card title="Working in">
        <DetailRow label="Business" value={active.businessName} emphasis />
        <DetailRow label="Branch" value={active.name} />
        <DetailRow label="Your role" value={ROLE_LABEL[active.role]} />
        {(branchCount > 1 || isOwner) && (
          <Button
            title={branchCount > 1 ? 'Switch branch' : 'Add a branch'}
            variant="secondary"
            onPress={() => router.push('/branches')}
          />
        )}
      </Card>

      {(canManage(active.role) || canEditCatalog(active.role)) && (
        <Card title="Manage" flush>
          {canEditCatalog(active.role) && (
            <ListRow href="/receive-stock" title="Receive stock" subtitle="Add delivered goods to this branch" />
          )}
          {canEditCatalog(active.role) && (
            <ListRow href="/account/suppliers" title="Suppliers" subtitle="Who you buy from and what you owe" />
          )}
          {canManage(active.role) && (
            <ListRow href="/account/expenses" title="Expenses" subtitle="Rent, bills and other spending" />
          )}
          {canManage(active.role) && (
            <ListRow href="/account/staff" title="Staff" subtitle="Accounts, roles and branches" />
          )}
        </Card>
      )}

      {shop && (
        <Card title="Shop">
          <DetailRow label="Currency" value={shop.currency} />
          <DetailRow label={shop.taxName} value={`${shop.taxRate}%`} />
          {shop.phone && <DetailRow label="Phone" value={shop.phone} />}
          {shop.address && <DetailRow label="Address" value={shop.address} />}
        </Card>
      )}

      <Card title="You">
        <DetailRow label="Name" value={user.name} emphasis />
        <DetailRow label="Email" value={user.email} />
      </Card>

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
