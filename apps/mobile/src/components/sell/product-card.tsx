import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import type { Product } from '@/api/types';
import { Icon } from '@/components/icon';
import { ProductThumb } from '@/components/product-thumb';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { totalStock } from '@/lib/format';

/**
 * Grid card for the Browse mode. Tap adds one; once in the cart, a −/+ pill
 * appears on the photo so quantities change without leaving the grid.
 */
export function ProductCard({
  product,
  quantity,
  formatCurrency,
  onAdd,
  onDecrease,
}: {
  product: Product;
  /** How many of this product are in the cart (all variants). */
  quantity: number;
  formatCurrency: (n: number) => string;
  onAdd: () => void;
  onDecrease: () => void;
}) {
  const theme = useTheme();
  const stock = totalStock(product.variants);
  const tracked = product.variants.length > 0;
  const out = tracked && stock <= 0;
  const low = tracked && !out && product.variants.some((v) => v.stock <= v.lowStock);

  const tap = (fn: () => void) => () => {
    if (process.env.EXPO_OS === 'ios') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn();
  };

  return (
    <Pressable
      onPress={tap(onAdd)}
      accessibilityRole="button"
      accessibilityLabel={`Add ${product.name}, ${formatCurrency(product.price)}`}
      accessibilityHint={quantity ? `${quantity} in cart` : undefined}
      style={({ pressed }) => ({
        flex: 1,
        padding: Spacing.two,
        gap: Spacing.two,
        borderRadius: Radius.lg,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundElement,
        boxShadow: quantity
          ? `0 0 0 2px ${theme.primary}`
          : '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.04)',
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}>
      <View>
        <ProductThumb name={product.name} imageUrl={product.imageUrl} radius={Radius.md} />

        {quantity > 0 && (
          <View
            style={{
              position: 'absolute',
              left: Spacing.one,
              right: Spacing.one,
              bottom: Spacing.one,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 36,
              paddingHorizontal: 4,
              borderRadius: 999,
              backgroundColor: theme.primary,
            }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove one ${product.name}`}
              hitSlop={8}
              onPress={tap(onDecrease)}
              style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="minus" size={15} color={theme.onPrimary} weight="bold" />
            </Pressable>
            <ThemedText type="smallBold" style={{ color: theme.onPrimary, fontVariant: ['tabular-nums'] }}>
              {quantity}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add one ${product.name}`}
              hitSlop={8}
              onPress={tap(onAdd)}
              style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={15} color={theme.onPrimary} weight="bold" />
            </Pressable>
          </View>
        )}
      </View>

      <View style={{ gap: 2, paddingHorizontal: 2 }}>
        <ThemedText type="small" numberOfLines={2} style={{ minHeight: 40 }}>
          {product.name}
        </ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 4 }}>
          <ThemedText type="smallBold" style={{ fontSize: 15, fontVariant: ['tabular-nums'] }}>
            {formatCurrency(product.price)}
          </ThemedText>
          {tracked && (
            <ThemedText type="caption" themeColor={out || low ? 'danger' : 'textSecondary'}>
              {out ? 'Out' : `${stock} left`}
            </ThemedText>
          )}
        </View>
      </View>
    </Pressable>
  );
}
