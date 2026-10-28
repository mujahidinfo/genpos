import { Stack } from 'expo-router';

import { ProfileButton } from '@/components/profile-button';
import { tabStackOptions } from '@/constants/navigation';

export default function OrdersLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="index" options={{ title: 'Orders', headerRight: () => <ProfileButton /> }} />
      <Stack.Screen name="[id]" options={{ title: '', headerLargeTitle: false }} />
    </Stack>
  );
}
