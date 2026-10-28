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
          name="cart"
          options={{ presentation: modalPresentation, title: 'Cart' }}
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
        {/* Profile is a normal push (back arrow); its edit forms are sheets. */}
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="currency" options={{ title: 'Currency' }} />
        <Stack.Screen
          name="shop-form"
          options={{ presentation: modalPresentation, title: 'Shop details' }}
        />
        <Stack.Screen
          name="change-password"
          options={{ presentation: modalPresentation, title: 'Change password' }}
        />
        <Stack.Screen
          name="pay-bill"
          options={{ presentation: modalPresentation, title: 'Record payment' }}
        />
        <Stack.Screen
          name="recurring-form"
          options={{ presentation: modalPresentation, title: 'Repeating bill' }}
        />
        <Stack.Screen
          name="employee-form"
          options={{ presentation: modalPresentation, title: 'Payroll' }}
        />
        <Stack.Screen
          name="expense-form"
          options={{ presentation: modalPresentation, title: 'Expense' }}
        />
      </Stack>
    </CartProvider>
  );
}
