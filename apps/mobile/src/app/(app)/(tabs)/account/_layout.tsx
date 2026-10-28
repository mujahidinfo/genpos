import { Stack } from 'expo-router';

import { tabStackOptions } from '@/constants/navigation';

export default function AccountLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="index" options={{ title: 'More' }} />
      <Stack.Screen name="staff" options={{ title: 'Staff' }} />
      <Stack.Screen name="suppliers" options={{ title: 'Suppliers' }} />
      <Stack.Screen name="supplier/[id]" options={{ title: '', headerLargeTitle: false }} />
    </Stack>
  );
}
