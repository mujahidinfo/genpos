import { Pressable, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Floating summary of the current sale on a clean white card. The left side
 * opens the cart to review; Charge goes straight to checkout.
 */
export function CartBar({
  itemCount,
  total,
  onOpenCart,
  onCharge,
}: {
  itemCount: number;
  total: string;
  onOpenCart: () => void;
  onCharge: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        padding: 6,
        borderRadius: Radius.lg + 4,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.backgroundElement,
        boxShadow: '0 8px 28px rgba(15, 23, 42, 0.14), 0 1px 3px rgba(15, 23, 42, 0.06)',
      }}>
      <Pressable
        onPress={onOpenCart}
        accessibilityRole="button"
        accessibilityLabel={`Review cart, ${itemCount} items, ${total}`}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.three,
          paddingLeft: Spacing.two,
          opacity: pressed ? 0.7 : 1,
        })}>
        <View>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${theme.primary}14`,
            }}>
            <Icon name="bag" size={18} color={theme.primary} />
          </View>
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -6,
              minWidth: 20,
              height: 20,
              paddingHorizontal: 5,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: theme.backgroundElement,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.primary,
            }}>
            <ThemedText type="caption" style={{ color: theme.onPrimary, fontWeight: 700, fontSize: 11, fontVariant: ['tabular-nums'] }}>
              {itemCount}
            </ThemedText>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="caption" themeColor="textSecondary">
            Total
          </ThemedText>
          <ThemedText
            type="smallBold"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ fontSize: 18, fontVariant: ['tabular-nums'] }}>
            {total}
          </ThemedText>
        </View>
      </Pressable>
      <Pressable
        onPress={onCharge}
        accessibilityRole="button"
        accessibilityLabel={`Charge ${total}`}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 48,
          paddingHorizontal: Spacing.four,
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          backgroundColor: theme.primary,
          opacity: pressed ? 0.85 : 1,
        })}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary, fontSize: 16 }}>
          Charge
        </ThemedText>
        <Icon name="chevronRight" size={14} color={theme.onPrimary} weight="bold" />
      </Pressable>
    </View>
  );
}
