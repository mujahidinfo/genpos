import { Stack } from 'expo-router';

import { ProfileButton } from '@/components/profile-button';
import { tabStackOptions } from '@/constants/navigation';

export default function ProductsLayout() {
  return (
    <Stack screenOptions={tabStackOptions}>
      {/* The screen adds its own "Add" button next to the profile for editors. */}
      <Stack.Screen name="index" options={{ title: 'Products', headerRight: () => <ProfileButton /> }} />
      <Stack.Screen name="[id]" options={{ title: '', headerLargeTitle: false }} />
    </Stack>
  );
}
