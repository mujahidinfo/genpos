import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Product } from '@/api/types';
import { ProductThumb } from '@/components/product-thumb';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Pick a size/colour for a product with several variants. */
export function VariantSheet({
  product,
  formatCurrency,
  onPick,
  onClose,
}: {
  product: Product | null;
  formatCurrency: (n: number) => string;
  onPick: (variantId: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={!!product} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        accessibilityLabel="Close"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
      />
      {product && (
        <View
          style={{
            padding: Spacing.four,
            paddingBottom: Spacing.four + insets.bottom,
            gap: Spacing.three,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderCurve: 'continuous',
            backgroundColor: theme.backgroundElement,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <ProductThumb name={product.name} imageUrl={product.imageUrl} size={52} />
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle" numberOfLines={1}>
                {product.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Choose one to add
              </ThemedText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
            {product.variants.map((v) => (
              <Pressable
                key={v.id}
                accessibilityRole="button"
                accessibilityLabel={`${v.name}, ${v.stock} in stock`}
                onPress={() => onPick(v.id)}
                style={({ pressed }) => ({
                  minWidth: 88,
                  alignItems: 'center',
                  gap: 2,
                  paddingVertical: 12,
                  paddingHorizontal: Spacing.three,
                  borderRadius: Radius.md,
                  borderCurve: 'continuous',
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: pressed ? theme.backgroundSelected : theme.background,
                })}>
                <ThemedText type="smallBold">{v.name}</ThemedText>
                <ThemedText type="caption" themeColor={v.stock <= 0 ? 'danger' : 'textSecondary'}>
                  {formatCurrency(v.price ?? product.price)} · {v.stock}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </Modal>
  );
}
