import { Stack } from 'expo-router';

import { ProfileButton } from '@/components/profile-button';
import { tabStackOptions } from '@/constants/navigation';

export default function MoreLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="index" options={{ title: 'More', headerRight: () => <ProfileButton /> }} />
      <Stack.Screen name="staff" options={{ title: 'Staff' }} />
      <Stack.Screen name="suppliers" options={{ title: 'Suppliers' }} />
      <Stack.Screen name="expenses" options={{ title: 'Expenses' }} />
      <Stack.Screen name="bills" options={{ title: 'Bills' }} />
      <Stack.Screen name="supplier/[id]" options={{ title: '', headerLargeTitle: false }} />
    </Stack>
  );
}
