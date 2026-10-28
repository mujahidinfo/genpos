import { Stack } from 'expo-router';

import { ProfileButton } from '@/components/profile-button';
import { tabStackOptions } from '@/constants/navigation';

export default function DashboardLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="index" options={{ title: 'Today', headerRight: () => <ProfileButton /> }} />
    </Stack>
  );
}
