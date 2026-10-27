import { Stack } from 'expo-router';

import { tabStackOptions } from '@/constants/navigation';

export default function DashboardLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="index" options={{ title: 'Today' }} />
    </Stack>
  );
}
