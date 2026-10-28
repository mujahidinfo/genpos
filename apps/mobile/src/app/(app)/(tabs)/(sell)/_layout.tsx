import { Stack } from 'expo-router';

import { ProfileButton } from '@/components/profile-button';
import { ShopTitle } from '@/components/shop-title';

export default function SellLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Sell',
          // Shop identity on the left, profile on the right; no centered title.
          headerTitle: '',
          headerLeft: () => <ShopTitle />,
          headerRight: () => <ProfileButton />,
        }}
      />
    </Stack>
  );
}
