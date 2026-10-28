import { Stack } from 'expo-router';

import { CartProvider } from '@/lib/cart';

/**
 * Signed-in app: the tab bar plus POS sheets that open above it. The cart lives
 * here so the scanner, product search, quick-add and checkout all share it.
 */
export default function AppLayout() {
  return (
    <CartProvider>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-item"
          options={{ presentation: 'modal', title: 'Add item' }}
        />
        <Stack.Screen
          name="new-product"
          options={{ presentation: 'modal', title: 'New product' }}
        />
        <Stack.Screen name="checkout" options={{ presentation: 'modal', title: 'Checkout' }} />
        <Stack.Screen name="branches" options={{ presentation: 'modal', title: 'Branches' }} />
        <Stack.Screen name="receive-stock" options={{ presentation: 'modal', title: 'Receive stock' }} />
        <Stack.Screen name="member-form" options={{ presentation: 'modal', title: 'Staff member' }} />
        <Stack.Screen name="supplier-form" options={{ presentation: 'modal', title: 'Supplier' }} />
        <Stack.Screen name="supplier-payment" options={{ presentation: 'modal', title: 'Pay supplier' }} />
      </Stack>
    </CartProvider>
  );
}
