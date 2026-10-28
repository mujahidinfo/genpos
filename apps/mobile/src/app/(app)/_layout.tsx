import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { CartProvider } from '@/lib/cart';

/**
 * Signed-in app: the tab bar plus POS sheets that open above it. The cart lives
 * here so the scanner, product search, quick-add and checkout all share it.
 */
export default function AppLayout() {
  const modalPresentation = Platform.OS === 'ios' ? 'modal' : 'card';

  return (
    <CartProvider>
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-item"
          options={{ presentation: modalPresentation, title: 'Add item' }}
        />
        <Stack.Screen
          name="new-product"
          options={{ presentation: modalPresentation, title: 'New product' }}
        />
        <Stack.Screen
          name="checkout"
          options={{ presentation: modalPresentation, title: 'Checkout' }}
        />
        <Stack.Screen
          name="branches"
          options={{ presentation: modalPresentation, title: 'Branches' }}
        />
        <Stack.Screen
          name="receive-stock"
          options={{ presentation: modalPresentation, title: 'Receive stock' }}
        />
        <Stack.Screen
          name="member-form"
          options={{ presentation: modalPresentation, title: 'Staff member' }}
        />
        <Stack.Screen
          name="supplier-form"
          options={{ presentation: modalPresentation, title: 'Supplier' }}
        />
        <Stack.Screen
          name="supplier-payment"
          options={{ presentation: modalPresentation, title: 'Pay supplier' }}
        />
      </Stack>
    </CartProvider>
  );
}
