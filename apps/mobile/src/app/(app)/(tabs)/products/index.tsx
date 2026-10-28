import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { useAnalyticsOverview, useProducts } from '@/api/queries';
import { Badge } from '@/components/badge';
import { HeaderButton } from '@/components/header-button';
import { ListRow, ListSeparator } from '@/components/list-row';
import { ListSearch } from '@/components/list-search';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { isLowStock, totalStock, useFormatCurrency } from '@/lib/format';
import { canEditCatalog } from '@/lib/roles';
import { useActiveShop } from '@/lib/session';

export default function ProductsScreen() {
  const theme = useTheme();
  const shop = useActiveShop();
  const formatCurrency = useFormatCurrency();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const query = useProducts(debouncedSearch);
  const lowStockCount = useAnalyticsOverview(1).data?.lowStockCount ?? 0;
  const showReorder = lowStockCount > 0 && canEditCatalog(shop.role) && !debouncedSearch;

  const products = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      {canEditCatalog(shop.role) && (
        <Stack.Screen
          options={{
            headerLeft: () => <HeaderButton title="Receive" onPress={() => router.push('/receive-stock')} />,
            headerRight: () => <HeaderButton title="Add" onPress={() => router.push('/new-product')} />,
          }}
        />
      )}
      <ListSearch placeholder="Name, SKU or barcode" onChangeText={setSearch} />
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1 }}
        ListHeaderComponent={
          showReorder ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/receive-stock', params: { reorder: '1' } })}
              style={({ pressed }) => [
                styles.banner,
                { backgroundColor: `${theme.danger}14`, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText type="smallBold" themeColor="danger" style={{ flex: 1 }}>
                {lowStockCount} item{lowStockCount === 1 ? '' : 's'} running low
              </ThemedText>
              <ThemedText type="smallBold" themeColor="primary">
                Reorder ›
              </ThemedText>
            </Pressable>
          ) : undefined
        }
        ItemSeparatorComponent={ListSeparator}
        renderItem={({ item }) => {
          const stock = totalStock(item.variants);
          const hasVariants = item.variants.length > 0;
          return (
            <ListRow
              href={{ pathname: '/products/[id]', params: { id: item.id } }}
              title={item.name}
              subtitle={[item.category?.name, item.sku].filter(Boolean).join(' · ') || undefined}
              value={formatCurrency(item.price)}
              meta={
                // "Low" means at least one variant is at/below its alert level,
                // so don't pair it with the product-wide total.
                hasVariants && isLowStock(item.variants) ? (
                  <Badge label={stock === 0 ? 'Out of stock' : 'Low stock'} tone="danger" />
                ) : hasVariants ? (
                  <ThemedText type="caption" themeColor="textSecondary">
                    {stock} in stock
                  </ThemedText>
                ) : null
              }
            />
          );
        }}
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
            emptyTitle={debouncedSearch ? 'No matching products' : 'No products yet'}
            emptyMessage={
              debouncedSearch
                ? `Nothing matches “${debouncedSearch}”.`
                : 'Tap Add, or scan a new item on the Sell tab.'
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
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    margin: Spacing.three,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
});
