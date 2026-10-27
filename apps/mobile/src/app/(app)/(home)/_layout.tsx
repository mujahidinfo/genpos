import { Stack } from 'expo-router';

import { tabStackOptions } from '@/constants/navigation';

export default function HomeLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      <Stack.Screen name="index" options={{ title: 'Today' }} />
    </Stack>
  );
}
