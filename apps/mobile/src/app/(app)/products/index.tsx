import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import { useProducts } from '@/api/queries';
import { Badge } from '@/components/badge';
import { ListRow, ListSeparator } from '@/components/list-row';
import { ListSearch } from '@/components/list-search';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { isLowStock, totalStock, useFormatCurrency } from '@/lib/format';

export default function ProductsScreen() {
  const theme = useTheme();
  const formatCurrency = useFormatCurrency();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const query = useProducts(debouncedSearch);

  const products = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <ListSearch placeholder="Name, SKU or barcode" onChangeText={setSearch} />
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1 }}
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
              debouncedSearch ? `Nothing matches “${debouncedSearch}”.` : 'Add products from the web dashboard.'
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
