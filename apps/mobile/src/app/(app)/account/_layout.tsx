import { Stack } from 'expo-router';

import { tabStackOptions } from '@/constants/navigation';

export default function AccountLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="index" options={{ title: 'Account' }} />
    </Stack>
  );
}
