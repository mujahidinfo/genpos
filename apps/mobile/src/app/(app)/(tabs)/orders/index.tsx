import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { useOrders } from '@/api/queries';
import type { Order, OrderStatus, PaymentMethod } from '@/api/types';
import { OrderStatusBadge } from '@/components/badge';
import { FilterBar } from '@/components/filter-bar';
import type { IconName } from '@/components/icon';
import { Icon } from '@/components/icon';
import { IconTile, TINT } from '@/components/icon-tile';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeDay, useFormatCurrency } from '@/lib/format';

const BOTTOM_OFFSET = (process.env.EXPO_OS === 'ios' ? BottomTabInset : 0) + Spacing.three;
const CARD_SHADOW = '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.03)';

const FILTERS: { label: string; value?: OrderStatus }[] = [
  { label: 'All' },
  { label: 'Completed', value: 'FULFILLED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'Canceled', value: 'CANCELED' },
];

const PAYMENT: Record<PaymentMethod, { label: string; icon: IconName; tint: string }> = {
  CASH: { label: 'Cash', icon: 'money', tint: TINT.emerald },
  CARD: { label: 'Card', icon: 'receipt', tint: TINT.indigo },
  MOBILE_MONEY: { label: 'Mobile money', icon: 'phone', tint: TINT.violet },
  BANK_TRANSFER: { label: 'Bank transfer', icon: 'branches', tint: TINT.sky },
};

export default function OrdersScreen() {
  const theme = useTheme();
  const formatCurrency = useFormatCurrency();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const debouncedSearch = useDebouncedValue(search.trim());
  const query = useOrders({ search: debouncedSearch, status });

  // The API returns newest first; sort again so a page merge can never reorder.
  const orders = (query.data?.pages.flatMap((p) => p.items) ?? []).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  const filtered = Boolean(debouncedSearch || status);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Order # or customer"
        chips={FILTERS}
        selected={status}
        onSelect={setStatus}
      />
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          flexGrow: 1,
          padding: Spacing.three,
          paddingTop: Spacing.one,
          paddingBottom: BOTTOM_OFFSET,
          gap: Spacing.two + 2,
        }}
        renderItem={({ item }) => <OrderCard order={item} total={formatCurrency(item.total)} />}
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
            emptyTitle={filtered ? 'No matching orders' : 'No orders yet'}
            emptyMessage={filtered ? 'Try a different search or filter.' : 'Sales you ring up on the Sell tab show up here.'}
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
    </View>
  );
}

function OrderCard({ order, total }: { order: Order; total: string }) {
  const theme = useTheme();
  const count = order.items.reduce((n, i) => n + i.quantity, 0);
  const pay = PAYMENT[order.paymentMethod];
  // The first line names the sale when there's no customer ("Milk +2 more").
  const first = order.items[0]?.name;
  const title = order.customer?.name ?? 'Walk-in sale';
  const detail = [
    `${count} item${count === 1 ? '' : 's'}`,
    first && !order.customer ? first + (order.items.length > 1 ? ` +${order.items.length - 1}` : '') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${order.orderNumber}, ${total}`}
      onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}
      style={({ pressed }) => ({
        gap: Spacing.two + 2,
        padding: Spacing.three,
        borderRadius: Radius.lg + 4,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundElement,
        boxShadow: CARD_SHADOW,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <IconTile name={pay.icon} tint={pay.tint} size={44} />
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText type="smallBold" style={{ fontSize: 16 }} numberOfLines={1}>
            {title}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {detail}
          </ThemedText>
        </View>
        <ThemedText type="smallBold" style={{ fontSize: 16, fontVariant: ['tabular-nums'] }}>
          {total}
        </ThemedText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <OrderStatusBadge status={order.status} />
        <ThemedText type="caption" themeColor="textSecondary" style={{ flex: 1 }} numberOfLines={1}>
          {order.orderNumber} · {pay.label} · {formatRelativeDay(order.createdAt)}
        </ThemedText>
        <Icon name="chevronRight" size={14} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}
