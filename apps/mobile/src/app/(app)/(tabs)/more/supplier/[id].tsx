import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { useSupplier } from '@/api/queries';
import type { PaymentMethod, SupplierDetail } from '@/api/types';
import { Avatar } from '@/components/avatar';
import { HeaderButton } from '@/components/header-button';
import type { IconName } from '@/components/icon';
import { IconTile, TINT } from '@/components/icon-tile';
import { Panel } from '@/components/panel';
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

type Entry = {
  key: string;
  kind: 'delivery' | 'payment';
  title: string;
  subtitle: string;
  amount: number;
  at: string;
};

/** Deliveries and payments in one newest-first timeline. */
function timeline(supplier: SupplierDetail): Entry[] {
  return [
    ...supplier.purchases.map<Entry>((p) => ({
      key: `p-${p.id}`,
      kind: 'delivery',
      title: 'Delivery',
      subtitle: `${formatDateTime(p.createdAt)} · ${p.shop.name}`,
      amount: p.total,
      at: p.createdAt,
    })),
    ...supplier.payments.map<Entry>((p) => ({
      key: `pay-${p.id}`,
      kind: 'payment',
      title: 'Payment',
      subtitle: [formatDateTime(p.createdAt), METHOD_LABEL[p.paymentMethod], p.note].filter(Boolean).join(' · '),
      amount: p.amount,
      at: p.createdAt,
    })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export default function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const active = useActiveShop();
  const formatCurrency = useFormatCurrency();
  const { data: supplier, isLoading, error, refetch, isRefetching } = useSupplier(id);

  if (!supplier) return <QueryState isLoading={isLoading} error={error} onRetry={refetch} />;

  const owed = supplier.due > 0;
  const paidShare = supplier.totalPurchased > 0 ? Math.min(supplier.totalPaid / supplier.totalPurchased, 1) : 0;
  const entries = timeline(supplier);

  return (
    <>
      <Stack.Screen
        options={{
          title: supplier.name,
          headerRight: () => (
            <HeaderButton title="Edit" onPress={() => router.push({ pathname: '/supplier-form', params: { id: supplier.id } })} />
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={theme.primary} />}>
        <Panel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <Avatar name={supplier.name} size={52} />
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="small" themeColor="textSecondary">
                {owed ? 'You owe' : 'All settled'}
              </ThemedText>
              <ThemedText
                style={{ fontSize: 32, lineHeight: 38, fontWeight: 700, fontVariant: ['tabular-nums'] }}
                themeColor={owed ? 'danger' : 'success'}>
                {formatCurrency(Math.max(supplier.due, 0))}
              </ThemedText>
            </View>
          </View>
          {supplier.totalPurchased > 0 && (
            <View style={{ gap: 6 }}>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.backgroundSelected, overflow: 'hidden' }}>
                <View style={{ width: `${paidShare * 100}%`, height: '100%', borderRadius: 4, backgroundColor: TINT.emerald }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText type="caption" themeColor="textSecondary">
                  Paid {formatCurrency(supplier.totalPaid)}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  Bought {formatCurrency(supplier.totalPurchased)}
                </ThemedText>
              </View>
            </View>
          )}
        </Panel>

        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <Action
            icon="receive"
            tint={TINT.emerald}
            label="Receive"
            onPress={() => router.push({ pathname: '/receive-stock', params: { supplierId: supplier.id } })}
          />
          {canManage(active.role) && (
            <Action
              icon="money"
              tint={TINT.indigo}
              label="Pay"
              disabled={!owed}
              onPress={() => router.push({ pathname: '/supplier-payment', params: { supplierId: supplier.id } })}
            />
          )}
          <Action
            icon="reorder"
            tint={TINT.amber}
            label="Reorder"
            onPress={() => router.push({ pathname: '/receive-stock', params: { supplierId: supplier.id, reorder: '1' } })}
          />
          {supplier.phone && <Action icon="phone" tint={TINT.sky} label="Call" onPress={() => Linking.openURL(`tel:${supplier.phone}`)} />}
        </View>

        {(supplier.address || supplier.notes) && (
          <Panel icon="info" tint={TINT.slate} title="Details">
            {supplier.address && <Line label="Address" value={supplier.address} />}
            {supplier.notes && <Line label="Notes" value={supplier.notes} />}
          </Panel>
        )}

        <Panel icon="history" tint={TINT.violet} title="Activity">
          {entries.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No deliveries or payments yet. Tap Receive when stock arrives.
            </ThemedText>
          ) : (
            entries.map((e) => (
              <View key={e.key} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                <IconTile name={e.kind === 'delivery' ? 'receive' : 'money'} tint={e.kind === 'delivery' ? TINT.emerald : TINT.indigo} size={36} />
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText type="smallBold">{e.title}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
                    {e.subtitle}
                  </ThemedText>
                </View>
                <ThemedText
                  type="smallBold"
                  style={{ fontVariant: ['tabular-nums'] }}
                  themeColor={e.kind === 'payment' ? 'success' : 'text'}>
                  {e.kind === 'payment' ? '−' : '+'}
                  {formatCurrency(e.amount)}
                </ThemedText>
              </View>
            ))
          )}
        </Panel>
      </ScrollView>
    </>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small" selectable>
        {value}
      </ThemedText>
    </View>
  );
}

/** Round icon button with a label under it. */
function Action({
  icon,
  tint,
  label,
  onPress,
  disabled,
}: {
  icon: IconName;
  tint: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        gap: 6,
        paddingVertical: Spacing.three,
        borderRadius: 18,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundElement,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
        opacity: disabled ? 0.4 : 1,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      })}>
      <IconTile name={icon} tint={tint} size={40} />
      <ThemedText type="caption" style={{ fontWeight: 600 }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
