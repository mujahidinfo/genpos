import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { useAnalyticsOverview, useCategories, useProducts } from '@/api/queries';
import type { Product } from '@/api/types';
import { Fab, FAB_CLEARANCE } from '@/components/fab';
import { FilterBar } from '@/components/filter-bar';
import { Icon } from '@/components/icon';
import { IconTile, TINT } from '@/components/icon-tile';
import { ProductThumb } from '@/components/product-thumb';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { isLowStock, totalStock, useFormatCurrency } from '@/lib/format';
import { canEditCatalog } from '@/lib/roles';
import { useActiveShop } from '@/lib/session';

const CARD_SHADOW = '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.03)';

export default function ProductsScreen() {
  const theme = useTheme();
  const shop = useActiveShop();
  const formatCurrency = useFormatCurrency();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const debouncedSearch = useDebouncedValue(search.trim());
  const categories = useCategories();
  const query = useProducts(debouncedSearch, categoryId);
  const lowStockCount = useAnalyticsOverview(1).data?.lowStockCount ?? 0;

  const canAdd = canEditCatalog(shop.role);
  const filtered = Boolean(debouncedSearch || categoryId);
  const showReorder = lowStockCount > 0 && canAdd && !filtered;

  const products = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Name, SKU or barcode"
        chips={[{ label: 'All' }, ...(categories.data ?? []).map((c) => ({ label: c.name, value: c.id }))]}
        selected={categoryId}
        onSelect={setCategoryId}
      />
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          flexGrow: 1,
          padding: Spacing.three,
          paddingTop: Spacing.one,
          // Room for the floating button so the last row is never hidden.
          paddingBottom: canAdd ? FAB_CLEARANCE : Spacing.five,
          gap: Spacing.two + 2,
        }}
        ListHeaderComponent={
          showReorder ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/receive-stock', params: { reorder: '1' } })}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.three,
                padding: Spacing.three,
                marginBottom: Spacing.one,
                borderRadius: Radius.lg + 4,
                borderCurve: 'continuous',
                backgroundColor: `${TINT.rose}14`,
                opacity: pressed ? 0.7 : 1,
              })}>
              <IconTile name="alert" tint={TINT.rose} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText type="smallBold" themeColor="danger">
                  {lowStockCount} item{lowStockCount === 1 ? '' : 's'} running low
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  Restock before you run out
                </ThemedText>
              </View>
              <ThemedText type="smallBold" themeColor="primary">
                Reorder ›
              </ThemedText>
            </Pressable>
          ) : undefined
        }
        renderItem={({ item }) => <ProductCard product={item} price={formatCurrency(item.price)} />}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
            tintColor={theme.primary}
          />
        }
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <QueryState
            isLoading={query.isLoading}
            error={query.error}
            onRetry={query.refetch}
            emptyTitle={filtered ? 'No matching products' : 'No products yet'}
            emptyMessage={
              filtered
                ? 'Try a different search or category.'
                : canAdd
                  ? 'Tap + to put your first product on the shelf.'
                  : undefined
            }
          />
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View style={{ padding: Spacing.three }}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : undefined
        }
      />

      {canAdd && <Fab label="Add product" onPress={() => router.push('/new-product')} />}
    </View>
  );
}

function ProductCard({ product, price }: { product: Product; price: string }) {
  const theme = useTheme();
  const hasVariants = product.variants.length > 0;
  const stock = totalStock(product.variants);
  const out = hasVariants && stock === 0;
  const low = hasVariants && isLowStock(product.variants);
  const stockColor = out || low ? theme.danger : theme.success;
  const subtitle = [product.category?.name, product.sku].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${price}`}
      onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        padding: Spacing.two + 2,
        borderRadius: Radius.lg + 4,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundElement,
        boxShadow: CARD_SHADOW,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <ProductThumb name={product.name} imageUrl={product.imageUrl} size={56} radius={14} />
      <View style={{ flex: 1, gap: 3 }}>
        <ThemedText type="smallBold" style={{ fontSize: 16 }} numberOfLines={1}>
          {product.name}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
        {hasVariants && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: stockColor }} />
            <ThemedText type="caption" style={{ color: stockColor, fontWeight: 600 }}>
              {out ? 'Out of stock' : low ? `Low · ${stock} left` : `${stock} in stock`}
            </ThemedText>
          </View>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <ThemedText type="smallBold" style={{ fontSize: 16, fontVariant: ['tabular-nums'] }}>
          {price}
        </ThemedText>
        <Icon name="chevronRight" size={14} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}
