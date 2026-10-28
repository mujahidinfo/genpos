import { router, Stack } from 'expo-router';
import { Alert, FlatList, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CartRow } from '@/components/cart-row';
import { HeaderButton } from '@/components/header-button';
import { ListSeparator } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/lib/cart';
import { useFormatCurrency } from '@/lib/format';

/** Review the current sale before charging. */
export default function CartScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const formatCurrency = useFormatCurrency();

  const confirmClear = () => {
    const clear = () => {
      cart.clear();
      router.back();
    };
    if (Platform.OS === 'web') return clear();
    Alert.alert('Clear this sale?', 'All items will be removed from the cart.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          title: `Cart · ${cart.itemCount}`,
          headerRight: cart.lines.length
            ? () => <HeaderButton title="Clear" tone="danger" onPress={confirmClear} />
            : undefined,
        }}
      />
      <FlatList
        data={cart.lines}
        keyExtractor={(l) => l.variantId}
        ItemSeparatorComponent={ListSeparator}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1 }}
        renderItem={({ item }) => (
          <CartRow
            line={item}
            highlighted={false}
            formatCurrency={formatCurrency}
            onChangeQuantity={(q) => cart.setQuantity(item.variantId, q)}
          />
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.five }}>
            <ThemedText type="smallBold">The cart is empty</ThemedText>
            <Button title="Keep selling" variant="secondary" onPress={() => router.back()} />
          </View>
        }
      />
      {cart.lines.length > 0 && (
        <View
          style={{
            gap: Spacing.three,
            padding: Spacing.three,
            paddingBottom: Spacing.three + Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0),
            borderTopWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.backgroundElement,
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <ThemedText themeColor="textSecondary">
              {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}
            </ThemedText>
            <ThemedText type="subtitle" style={{ fontVariant: ['tabular-nums'] }}>
              {formatCurrency(cart.subtotal)}
            </ThemedText>
          </View>
          <Button title="Charge" onPress={() => router.replace('/checkout')} />
        </View>
      )}
    </View>
  );
}
