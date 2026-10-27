import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useOrders } from '@/api/queries';
import type { OrderStatus } from '@/api/types';
import { OrderStatusBadge } from '@/components/badge';
import { ListRow, ListSeparator } from '@/components/list-row';
import { ListSearch } from '@/components/list-search';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeDay, useFormatCurrency } from '@/lib/format';

const FILTERS: { label: string; value?: OrderStatus }[] = [
  { label: 'All' },
  { label: 'Completed', value: 'FULFILLED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'Canceled', value: 'CANCELED' },
];

export default function OrdersScreen() {
  const theme = useTheme();
  const formatCurrency = useFormatCurrency();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const debouncedSearch = useDebouncedValue(search.trim());
  const query = useOrders({ search: debouncedSearch, status });

  const orders = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <ListSearch placeholder="Order # or customer" onChangeText={setSearch} />
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1 }}
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}>
            {FILTERS.map((f) => {
              const selected = f.value === status;
              return (
                <Pressable
                  key={f.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setStatus(f.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? theme.primary : theme.backgroundElement,
                      borderColor: selected ? theme.primary : theme.border,
                    },
                  ]}>
                  <ThemedText type="small" style={{ color: selected ? theme.onPrimary : theme.text }}>
                    {f.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        }
        ItemSeparatorComponent={ListSeparator}
        renderItem={({ item }) => {
          const itemCount = item.items.reduce((n, i) => n + i.quantity, 0);
          return (
            <ListRow
              href={{ pathname: '/orders/[id]', params: { id: item.id } }}
              title={item.customer?.name ?? 'Walk-in customer'}
              subtitle={`${item.orderNumber} · ${itemCount} item${itemCount === 1 ? '' : 's'} · ${formatRelativeDay(item.createdAt)}`}
              value={formatCurrency(item.total)}
              meta={<OrderStatusBadge status={item.status} />}
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
            emptyTitle={debouncedSearch || status ? 'No matching orders' : 'No orders yet'}
            emptyMessage={debouncedSearch || status ? 'Try a different search or filter.' : undefined}
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
  filters: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
});
