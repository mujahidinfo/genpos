import * as Haptics from 'expo-haptics';
import { router, Stack, useIsFocused } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { findByBarcode } from '@/api/queries';
import type { ScannedProduct } from '@/api/types';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { Button } from '@/components/button';
import { CartRow } from '@/components/cart-row';
import { HeaderButton } from '@/components/header-button';
import { ListSeparator } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api-client';
import { lineFor, useCart } from '@/lib/cart';
import { useFormatCurrency } from '@/lib/format';
import { canEditCatalog } from '@/lib/roles';
import { useActiveShop } from '@/lib/session';

type ScanStatus =
  | { kind: 'idle' }
  | { kind: 'looking'; code: string }
  | { kind: 'added'; name: string }
  | { kind: 'error'; message: string };

const HIGHLIGHT_MS = 1200;

export default function SellScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const shop = useActiveShop();
  const cart = useCart();
  const formatCurrency = useFormatCurrency();

  const [status, setStatus] = useState<ScanStatus>({ kind: 'idle' });
  const [pickVariantOf, setPickVariantOf] = useState<ScannedProduct | null>(null);
  // Codes already looked up this session: repeat scans are instant and work offline.
  const cache = useRef(new Map<string, ScannedProduct>());
  const busy = useRef(false);
  // Briefly tint the line that was just scanned so the cashier sees where it went.
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToCart = (product: ScannedProduct, variantId: string) => {
    cart.add(lineFor(product, variantId));
    setHighlighted(variantId);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlighted(null), HIGHLIGHT_MS);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStatus({ kind: 'added', name: product.name });
  };

  const onScan = async (code: string) => {
    if (busy.current || pickVariantOf) return;
    busy.current = true;
    try {
      let product = cache.current.get(code);
      if (!product) {
        setStatus({ kind: 'looking', code });
        product = (await findByBarcode(code)) ?? undefined;
      }

      if (!product) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        if (canEditCatalog(shop.role)) {
          setStatus({ kind: 'idle' });
          // New item on the shelf: add it to the catalog and the cart in one step.
          router.push({ pathname: '/new-product', params: { barcode: code, addToCart: '1' } });
        } else {
          setStatus({ kind: 'error', message: `${code} isn’t in your products. Ask a manager to add it.` });
        }
        return;
      }

      cache.current.set(code, product);
      if (product.matchedVariantId) {
        addToCart(product, product.matchedVariantId);
      } else {
        // A product-level barcode on a product with sizes/colours: ask which one.
        setStatus({ kind: 'idle' });
        setPickVariantOf(product);
      }
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus({
        kind: 'error',
        message: error instanceof ApiError ? error.message : 'Couldn’t look that up. Try again.',
      });
    } finally {
      busy.current = false;
    }
  };

  const confirmClear = () => {
    if (Platform.OS === 'web') return cart.clear();
    Alert.alert('Clear this sale?', 'All items will be removed from the cart.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: cart.clear },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerLeft: cart.lines.length
            ? () => <HeaderButton title="Clear" tone="danger" onPress={confirmClear} />
            : undefined,
          headerRight: () => <HeaderButton title="Search" onPress={() => router.push('/add-item')} />,
        }}
      />

      <View style={styles.scannerWrap}>
        <BarcodeScanner
          active={isFocused}
          onScan={onScan}
          overlay={<StatusPill status={status} />}
        />
      </View>

      {pickVariantOf && (
        <View style={[styles.picker, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="smallBold">Which {pickVariantOf.name}?</ThemedText>
          <View style={styles.pickerOptions}>
            {pickVariantOf.variants.map((v) => (
              <Pressable
                key={v.id}
                accessibilityRole="button"
                onPress={() => {
                  addToCart(pickVariantOf, v.id);
                  setPickVariantOf(null);
                }}
                style={({ pressed }) => [
                  styles.option,
                  { borderColor: theme.border },
                  pressed && { backgroundColor: theme.backgroundSelected },
                ]}>
                <ThemedText type="smallBold">{v.name}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {v.stock} in stock
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <Button title="Cancel" variant="secondary" onPress={() => setPickVariantOf(null)} />
        </View>
      )}

      <FlatList
        data={cart.lines}
        keyExtractor={(l) => l.variantId}
        style={styles.list}
        contentContainerStyle={cart.lines.length ? undefined : styles.emptyContainer}
        ItemSeparatorComponent={ListSeparator}
        renderItem={({ item }) => (
          <CartRow
            line={item}
            highlighted={highlighted === item.variantId}
            formatCurrency={formatCurrency}
            onChangeQuantity={(q) => cart.setQuantity(item.variantId, q)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText type="subtitle">Ready to sell</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              Scan a barcode, or search for items without one.
            </ThemedText>
            <Button title="Search products" variant="secondary" onPress={() => router.push('/add-item')} />
          </View>
        }
      />

      {cart.lines.length > 0 && (
        <View
          style={[
            styles.footer,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            // The tab bar sits below on native; on web leave room for the home indicator.
            Platform.OS === 'web' && { paddingBottom: Spacing.three + insets.bottom },
          ]}>
          <View style={styles.footerTotals}>
            <ThemedText type="small" themeColor="textSecondary">
              {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}
            </ThemedText>
            <ThemedText type="subtitle">{formatCurrency(cart.subtotal)}</ThemedText>
          </View>
          <Button title="Charge" style={styles.charge} onPress={() => router.push('/checkout')} />
        </View>
      )}
    </View>
  );
}

function StatusPill({ status }: { status: ScanStatus }) {
  const theme = useTheme();
  const text =
    status.kind === 'looking'
      ? `Looking up ${status.code}…`
      : status.kind === 'added'
        ? `✓ Added ${status.name}`
        : status.kind === 'error'
          ? status.message
          : 'Point the camera at a barcode';
  const background =
    status.kind === 'added' ? theme.success : status.kind === 'error' ? theme.danger : 'rgba(0,0,0,0.55)';

  return (
    <View style={[styles.pill, { backgroundColor: background }]} accessibilityLiveRegion="polite">
      <ThemedText type="smallBold" style={styles.pillText} numberOfLines={2}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scannerWrap: {
    padding: Spacing.three,
    paddingBottom: Spacing.two,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  picker: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pickerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  option: {
    minWidth: 72,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerTotals: {
    flex: 1,
  },
  charge: {
    minWidth: 140,
  },
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    maxWidth: '100%',
  },
  pillText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
