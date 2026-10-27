import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useProducts } from '@/api/queries';
import type { Product } from '@/api/types';
import { HeaderButton } from '@/components/header-button';
import { ListSeparator } from '@/components/list-row';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { lineFor, useCart } from '@/lib/cart';
import { useFormatCurrency } from '@/lib/format';
import { canEditCatalog } from '@/lib/roles';
import { useActiveShop } from '@/lib/session';

/**
 * Find and add items that have no barcode (loose produce, services…). Tapping
 * adds and keeps the sheet open, so several items can be picked in a row.
 */
export default function AddItemScreen() {
  const theme = useTheme();
  const shop = useActiveShop();
  const cart = useCart();
  const formatCurrency = useFormatCurrency();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 250);
  const query = useProducts(debounced);
  const products = query.data?.pages.flatMap((p) => p.items) ?? [];

  const inCart = (variantId: string) => cart.lines.find((l) => l.variantId === variantId)?.quantity ?? 0;

  const add = (product: Product, variantId: string) => {
    cart.add(lineFor(product, variantId));
    void Haptics.selectionAsync();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerRight: () => <HeaderButton title="Done" onPress={() => router.back()} />,
        }}
      />
      <View style={styles.searchWrap}>
        <TextInput
          autoFocus
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, SKU or barcode"
          placeholderTextColor={theme.textSecondary}
          returnKeyType="search"
          style={[
            styles.search,
            { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        />
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        ItemSeparatorComponent={ListSeparator}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        renderItem={({ item }) => (
          <View style={[styles.product, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText numberOfLines={1}>{item.name}</ThemedText>
            {/* One tappable row per sellable variant; simple products have one. */}
            {item.variants.map((v) => {
              const count = inCart(v.id);
              return (
                <Pressable
                  key={v.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.name}${v.isDefault ? '' : ` ${v.name}`}`}
                  onPress={() => add(item, v.id)}
                  style={({ pressed }) => [
                    styles.variant,
                    { borderColor: theme.border },
                    pressed && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText type="small" style={styles.variantName} numberOfLines={1}>
                    {v.isDefault ? `${v.stock} in stock` : `${v.name} · ${v.stock} in stock`}
                  </ThemedText>
                  <ThemedText type="smallBold">{formatCurrency(v.price ?? item.price)}</ThemedText>
                  <View style={[styles.addBadge, { backgroundColor: count ? theme.primary : theme.backgroundSelected }]}>
                    <ThemedText type="smallBold" style={{ color: count ? theme.onPrimary : theme.text }}>
                      {count ? `×${count}` : '+'}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <QueryState
            isLoading={query.isLoading}
            error={query.error}
            onRetry={query.refetch}
            emptyTitle={debounced ? 'No matching products' : 'No products yet'}
            emptyMessage={canEditCatalog(shop.role) ? 'Scan a new item on the Sell tab to add it.' : undefined}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  searchWrap: {
    padding: Spacing.three,
  },
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  product: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  variant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    minHeight: 48,
  },
  variantName: {
    flex: 1,
  },
  addBadge: {
    minWidth: 40,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
});
