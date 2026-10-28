import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { useRecurringBills } from '@/api/queries';
import type { RecurringBill } from '@/api/types';
import { Fab, FAB_CLEARANCE } from '@/components/fab';
import { IconTile, TINT } from '@/components/icon-tile';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dueLabel, useFormatCurrency } from '@/lib/format';

/** Bills that repeat — rent, internet, subscriptions. Pay one when it falls due. */
export default function BillsScreen() {
  const theme = useTheme();
  const formatCurrency = useFormatCurrency();
  const query = useRecurringBills();
  const bills = query.data ?? [];
  const monthly = bills
    .filter((b) => b.isActive)
    .reduce((sum, b) => sum + (b.frequency === 'WEEKLY' ? b.amount * 4.33 : b.amount), 0);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={bills}
        keyExtractor={(b) => b.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1, padding: Spacing.three, paddingBottom: FAB_CLEARANCE, gap: Spacing.two + 2 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={theme.primary} />}
        ListHeaderComponent={
          bills.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={{ paddingHorizontal: Spacing.one, paddingBottom: Spacing.one }}>
              About {formatCurrency(monthly)} a month in repeating bills
            </ThemedText>
          ) : undefined
        }
        renderItem={({ item }) => <BillCard bill={item} amount={formatCurrency(item.amount)} />}
        ListEmptyComponent={
          <QueryState
            isLoading={query.isLoading}
            error={query.error}
            onRetry={query.refetch}
            emptyTitle="No repeating bills"
            emptyMessage="Add rent, internet or any bill that comes every week or month. We’ll remind you when it’s due."
          />
        }
      />
      <Fab label="Add bill" onPress={() => router.push('/recurring-form')} />
    </View>
  );
}

function BillCard({ bill, amount }: { bill: RecurringBill; amount: string }) {
  const theme = useTheme();
  const overdue = bill.isActive && bill.daysUntil < 0;
  const soon = bill.isActive && bill.daysUntil <= 3;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/recurring-form', params: { id: bill.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        padding: Spacing.three,
        borderRadius: Radius.lg + 4,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundElement,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.03)',
        opacity: bill.isActive ? 1 : 0.55,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <IconTile name="repeat" tint={overdue ? TINT.rose : soon ? TINT.amber : TINT.violet} size={44} />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="smallBold" style={{ fontSize: 16 }} numberOfLines={1}>
          {bill.title}
        </ThemedText>
        <ThemedText type="caption" style={{ color: overdue ? theme.danger : theme.textSecondary }} numberOfLines={1}>
          {bill.isActive ? dueLabel(bill.daysUntil) : 'Paused'} · {bill.frequency === 'WEEKLY' ? 'every week' : 'every month'}
        </ThemedText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <ThemedText type="smallBold" style={{ fontSize: 16, fontVariant: ['tabular-nums'] }}>
          {amount}
        </ThemedText>
        {bill.isActive && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pay ${bill.title}`}
            hitSlop={8}
            onPress={() => router.push({ pathname: '/pay-bill', params: { kind: 'BILL', id: bill.id } })}
            style={{ paddingHorizontal: Spacing.three, paddingVertical: 5, borderRadius: 999, backgroundColor: `${theme.primary}1A` }}>
            <ThemedText type="smallBold" themeColor="primary">
              Pay
            </ThemedText>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
