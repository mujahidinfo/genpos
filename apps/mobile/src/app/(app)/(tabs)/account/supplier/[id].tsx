import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useSupplier } from '@/api/queries';
import type { PaymentMethod } from '@/api/types';
import { Button } from '@/components/button';
import { Card, DetailRow } from '@/components/card';
import { HeaderButton } from '@/components/header-button';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, useFormatCurrency } from '@/lib/format';
import { canManage } from '@/lib/roles';
import { useActiveShop } from '@/lib/session';

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  MOBILE_MONEY: 'Mobile money',
  BANK_TRANSFER: 'Bank transfer',
};

export default function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const active = useActiveShop();
  const formatCurrency = useFormatCurrency();
  const { data: supplier, isLoading, error, refetch, isRefetching } = useSupplier(id);

  if (!supplier) return <QueryState isLoading={isLoading} error={error} onRetry={refetch} />;

  return (
    <>
      <Stack.Screen
        options={{
          title: supplier.name,
          headerRight: () => (
            <HeaderButton
              title="Edit"
              onPress={() => router.push({ pathname: '/supplier-form', params: { id: supplier.id } })}
            />
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={theme.primary} />
        }>
        <View style={styles.hero}>
          <ThemedText type="small" themeColor="textSecondary">
            {supplier.due > 0 ? 'You owe' : 'Balance'}
          </ThemedText>
          <ThemedText type="title" themeColor={supplier.due > 0 ? 'danger' : 'text'}>
            {formatCurrency(Math.max(supplier.due, 0))}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Bought {formatCurrency(supplier.totalPurchased)} · Paid {formatCurrency(supplier.totalPaid)}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Button
            title="Receive stock"
            style={styles.flex}
            onPress={() => router.push({ pathname: '/receive-stock', params: { supplierId: supplier.id } })}
          />
          {canManage(active.role) && supplier.due > 0 && (
            <Button
              title="Pay"
              variant="secondary"
              style={styles.flex}
              onPress={() => router.push({ pathname: '/supplier-payment', params: { supplierId: supplier.id } })}
            />
          )}
        </View>

        <Button
          title="Reorder low stock from them"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/receive-stock', params: { supplierId: supplier.id, reorder: '1' } })
          }
        />

        {(supplier.phone || supplier.address || supplier.notes) && (
          <Card title="Contact">
            {supplier.phone && (
              <View style={styles.row}>
                <View style={styles.flex}>
                  <DetailRow label="Phone" value={supplier.phone} />
                </View>
                <HeaderButton title="Call" onPress={() => Linking.openURL(`tel:${supplier.phone}`)} />
              </View>
            )}
            {supplier.address && <DetailRow label="Address" value={supplier.address} />}
            {supplier.notes && <DetailRow label="Notes" value={supplier.notes} />}
          </Card>
        )}

        {supplier.purchases.length > 0 && (
          <Card title="Recent deliveries">
            {supplier.purchases.map((p) => (
              <DetailRow
                key={p.id}
                label={`${formatDateTime(p.createdAt)} · ${p.shop.name}`}
                value={formatCurrency(p.total)}
              />
            ))}
          </Card>
        )}

        {supplier.payments.length > 0 && (
          <Card title="Payments">
            {supplier.payments.map((p) => (
              <DetailRow
                key={p.id}
                label={[formatDateTime(p.createdAt), METHOD_LABEL[p.paymentMethod], p.note].filter(Boolean).join(' · ')}
                value={`−${formatCurrency(p.amount)}`}
              />
            ))}
          </Card>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
