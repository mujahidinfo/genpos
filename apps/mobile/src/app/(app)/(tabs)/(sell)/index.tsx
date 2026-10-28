import * as Haptics from 'expo-haptics';
import { router, useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, View } from 'react-native';

import { findByBarcode, useCategories, useProducts } from '@/api/queries';
import type { Product } from '@/api/types';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { CartRow } from '@/components/cart-row';
import { Chip } from '@/components/choice';
import { Icon } from '@/components/icon';
import { ListSeparator } from '@/components/list-row';
import { QueryState } from '@/components/query-state';
import { CartBar } from '@/components/sell/cart-bar';
import { ModeToggle, type SellMode } from '@/components/sell/mode-toggle';
import { ProductCard } from '@/components/sell/product-card';
import { SearchPill } from '@/components/sell/search-pill';
import { VariantSheet } from '@/components/sell/variant-sheet';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api-client';
import { lineFor, useCart } from '@/lib/cart';
import { useFormatCurrency } from '@/lib/format';
import { canEditCatalog } from '@/lib/roles';
import { secureStorage } from '@/lib/secure-storage';
import { useActiveShop } from '@/lib/session';

const MODE_KEY = 'genpos.sellMode';
const HIGHLIGHT_MS = 1200;
// The native tab bar floats over content on iOS.
const BOTTOM_OFFSET = (process.env.EXPO_OS === 'ios' ? BottomTabInset : 0) + Spacing.three;

type ScanStatus =
  | { kind: 'idle' }
  | { kind: 'looking'; code: string }
  | { kind: 'added'; name: string }
  | { kind: 'error'; message: string };

/** The single variant a tap should add, or null when the user must choose. */
function quickVariant(product: Product) {
  return (
    product.variants.find((v) => v.isDefault)?.id ??
    (product.variants.length === 1 ? product.variants[0].id : null)
  );
}

export default function SellScreen() {
  const theme = useTheme();
  const isFocused = useIsFocused();
  const shop = useActiveShop();
  const cart = useCart();
  const formatCurrency = useFormatCurrency();
  const canAddProducts = canEditCatalog(shop.role);

  const [mode, setMode] = useState<SellMode>('browse');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [status, setStatus] = useState<ScanStatus>({ kind: 'idle' });
  const [pickVariantOf, setPickVariantOf] = useState<Product | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanCache = useRef(new Map<string, Product & { matchedVariantId: string | null }>());
  const busy = useRef(false);

  const debounced = useDebouncedValue(search.trim(), 250);
  const showGrid = mode === 'browse' || debounced.length > 0;
  const products = useProducts(debounced, categoryId);
  const categories = useCategories();
  const items = products.data?.pages.flatMap((p) => p.items) ?? [];

  // Remember how this cashier likes to sell (scan vs. tap).
  useEffect(() => {
    void secureStorage.get(MODE_KEY).then((saved) => {
      if (saved === 'scan' || saved === 'browse') setMode(saved);
    });
  }, []);

  const changeMode = (next: SellMode) => {
    setMode(next);
    void secureStorage.set(MODE_KEY, next);
  };

  const add = (product: Product, variantId: string) => {
    cart.add(lineFor(product, variantId));
    setHighlighted(variantId);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlighted(null), HIGHLIGHT_MS);
  };

  const addProduct = (product: Product) => {
    const variantId = quickVariant(product);
    if (variantId) add(product, variantId);
    else setPickVariantOf(product);
  };

  const decreaseProduct = (product: Product) => {
    // Lines are newest-first, so this takes back the most recent addition.
    const line = cart.lines.find((l) => l.productId === product.id);
    if (line) cart.setQuantity(line.variantId, line.quantity - 1);
  };

  const quantityOf = (productId: string) =>
    cart.lines.reduce((n, l) => (l.productId === productId ? n + l.quantity : n), 0);

  const onScan = async (code: string) => {
    if (busy.current || pickVariantOf) return;
    busy.current = true;
    try {
      let product = scanCache.current.get(code);
      if (!product) {
        setStatus({ kind: 'looking', code });
        product = (await findByBarcode(code)) ?? undefined;
      }
      if (!product) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        if (canAddProducts) {
          setStatus({ kind: 'idle' });
          router.push({ pathname: '/new-product', params: { barcode: code, addToCart: '1' } });
        } else {
          setStatus({ kind: 'error', message: `${code} isn’t in your products. Ask a manager to add it.` });
        }
        return;
      }
      scanCache.current.set(code, product);
      if (product.matchedVariantId) {
        add(product, product.matchedVariantId);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStatus({ kind: 'added', name: product.name });
      } else {
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

  const bottomSpace = cart.lines.length ? 96 + BOTTOM_OFFSET : BOTTOM_OFFSET;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Search + mode */}
      <View style={{ flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two }}>
        <SearchPill
          value={search}
          onChangeText={setSearch}
          placeholder="Search products"
          // Typing means looking for something by name: show the grid.
          onFocus={() => mode === 'scan' && changeMode('browse')}
        />
        <ModeToggle value={mode} onChange={changeMode} />
      </View>

      {showGrid ? (
        <>
          {(categories.data?.length ?? 0) > 0 && !debounced && (
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing.two, paddingHorizontal: Spacing.three, paddingBottom: Spacing.two }}>
                <Chip label="All" selected={!categoryId} onPress={() => setCategoryId(undefined)} />
                {categories.data!.map((c) => (
                  <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
                ))}
              </ScrollView>
            </View>
          )}

          <FlatList
            data={items}
            numColumns={2}
            keyExtractor={(product) => product.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            columnWrapperStyle={{ gap: Spacing.three }}
            contentContainerStyle={{ flexGrow: 1, gap: Spacing.three, paddingHorizontal: Spacing.three, paddingTop: Spacing.one, paddingBottom: bottomSpace }}
            renderItem={({ item, index }) => {
              // Keep a lone last card half-width instead of stretching across.
              const lone = items.length % 2 === 1 && index === items.length - 1;
              const card = (
                <ProductCard
                  product={item}
                  quantity={quantityOf(item.id)}
                  formatCurrency={formatCurrency}
                  onAdd={() => addProduct(item)}
                  onDecrease={() => decreaseProduct(item)}
                />
              );
              return lone ? (
                <>
                  {card}
                  <View style={{ flex: 1 }} />
                </>
              ) : (
                card
              );
            }}
            onEndReached={() => products.hasNextPage && !products.isFetchingNextPage && products.fetchNextPage()}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              products.isLoading || products.error ? (
                <QueryState isLoading={products.isLoading} error={products.error} onRetry={products.refetch} />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.five }}>
                  <Icon name="box" size={34} color={theme.textSecondary} />
                  <ThemedText type="smallBold">{debounced ? `No “${debounced}” found` : 'No products here yet'}</ThemedText>
                  {canAddProducts && (
                    <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                      Add products from the Products tab.
                    </ThemedText>
                  )}
                </View>
              )
            }
            ListFooterComponent={
              products.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={{ padding: Spacing.three }} /> : undefined
            }
          />
        </>
      ) : (
        <FlatList
          data={cart.lines}
          keyExtractor={(l) => l.variantId}
          ItemSeparatorComponent={ListSeparator}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomSpace }}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: Spacing.three, paddingBottom: Spacing.three }}>
              <BarcodeScanner
                active={isFocused && !pickVariantOf}
                height={260}
                onScan={onScan}
                overlay={<StatusPill status={status} />}
              />
            </View>
          }
          renderItem={({ item }) => (
            <CartRow
              line={item}
              highlighted={highlighted === item.variantId}
              formatCurrency={formatCurrency}
              onChangeQuantity={(q) => cart.setQuantity(item.variantId, q)}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', gap: Spacing.one, padding: Spacing.four }}>
              <ThemedText type="smallBold">Point the camera at a barcode</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                Items without one? Switch to{' '}
                <ThemedText type="small" themeColor="primary" onPress={() => changeMode('browse')}>
                  Browse
                </ThemedText>
                .
              </ThemedText>
            </View>
          }
        />
      )}

      {cart.lines.length > 0 && (
        <View style={{ position: 'absolute', left: Spacing.three, right: Spacing.three, bottom: BOTTOM_OFFSET }}>
          <CartBar
            itemCount={cart.itemCount}
            total={formatCurrency(cart.subtotal)}
            onOpenCart={() => router.push('/cart')}
            onCharge={() => router.push('/checkout')}
          />
        </View>
      )}

      <VariantSheet
        product={pickVariantOf}
        formatCurrency={formatCurrency}
        onClose={() => setPickVariantOf(null)}
        onPick={(variantId) => {
          if (pickVariantOf) add(pickVariantOf, variantId);
          setPickVariantOf(null);
        }}
      />
    </View>
  );
}

function StatusPill({ status }: { status: ScanStatus }) {
  const theme = useTheme();
  const text =
    status.kind === 'looking'
      ? `Looking up ${status.code}…`
      : status.kind === 'added'
        ? `Added ${status.name}`
        : status.kind === 'error'
          ? status.message
          : 'Hold steady over the barcode';
  const background =
    status.kind === 'added' ? theme.success : status.kind === 'error' ? theme.danger : 'rgba(15, 23, 42, 0.6)';

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        maxWidth: '100%',
        paddingHorizontal: Spacing.three,
        paddingVertical: 6,
        borderRadius: Radius.lg,
        borderCurve: 'continuous',
        backgroundColor: background,
      }}>
      {status.kind === 'added' && <Icon name="check" size={15} color="#FFFFFF" />}
      {status.kind === 'looking' && <ActivityIndicator size="small" color="#FFFFFF" />}
      <ThemedText type="smallBold" numberOfLines={2} style={{ color: '#FFFFFF', textAlign: 'center', flexShrink: 1 }}>
        {text}
      </ThemedText>
    </View>
  );
}

