import { Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useOrder } from '@/api/queries';
import type { PaymentMethod } from '@/api/types';
import { OrderStatusBadge } from '@/components/badge';
import { Card, DetailRow } from '@/components/card';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, useFormatCurrency } from '@/lib/format';

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  MOBILE_MONEY: 'Mobile money',
  BANK_TRANSFER: 'Bank transfer',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const formatCurrency = useFormatCurrency();
  const { data: order, isLoading, error, refetch, isRefetching } = useOrder(id);

  if (!order) {
    return <QueryState isLoading={isLoading} error={error} onRetry={refetch} />;
  }

  const refunded = order.refunds.reduce((s, r) => s + r.amount, 0);

  return (
    <>
      <Stack.Screen options={{ title: order.orderNumber }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={theme.primary} />
        }>
        <View style={styles.hero}>
          <ThemedText type="title">
            {formatCurrency(order.total)}
          </ThemedText>
          <OrderStatusBadge status={order.status} />
          <ThemedText type="small" themeColor="textSecondary">
            {formatDateTime(order.createdAt)}
            {order.cashier ? ` · by ${order.cashier.name}` : ''}
          </ThemedText>
        </View>

        <Card title="Items">
          {order.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemMain}>
                <ThemedText type="small">{item.name}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {item.quantity} × {formatCurrency(item.price)}
                  {item.variant ? ` · ${item.variant.name}` : ''}
                </ThemedText>
              </View>
              <ThemedText type="small" style={styles.tabular}>
                {formatCurrency(item.total)}
              </ThemedText>
            </View>
          ))}
        </Card>

        <Card title="Summary">
          <DetailRow label="Subtotal" value={formatCurrency(order.subtotal)} />
          {order.discountAmt > 0 && (
            <DetailRow label="Discount" value={`−${formatCurrency(order.discountAmt)}`} />
          )}
          {order.taxAmt > 0 && (
            <DetailRow label={`Tax (${order.taxRate}%)`} value={formatCurrency(order.taxAmt)} />
          )}
          <DetailRow label="Total" value={formatCurrency(order.total)} emphasis />
          {refunded > 0 && <DetailRow label="Refunded" value={`−${formatCurrency(refunded)}`} />}
        </Card>

        <Card title="Details">
          <DetailRow label="Payment" value={PAYMENT_LABEL[order.paymentMethod]} />
          <DetailRow label="Type" value={order.type === 'WALK_IN' ? 'Walk-in' : 'Online'} />
          <DetailRow label="Customer" value={order.customer?.name ?? 'Walk-in customer'} />
          {order.customer?.phone && <DetailRow label="Phone" value={order.customer.phone} />}
          {order.note && <DetailRow label="Note" value={order.note} />}
        </Card>

        {order.refunds.length > 0 && (
          <Card title="Refunds">
            {order.refunds.map((r) => (
              <DetailRow
                key={r.id}
                label={[formatDateTime(r.createdAt), r.reason].filter(Boolean).join(' · ')}
                value={formatCurrency(r.amount)}
              />
            ))}
          </Card>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  itemMain: {
    flex: 1,
    gap: Spacing.half,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
