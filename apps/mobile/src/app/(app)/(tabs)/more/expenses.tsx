import { router, Stack } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { useExpenses, useExpenseTotal } from '@/api/queries';
import { Badge } from '@/components/badge';
import { HeaderButton } from '@/components/header-button';
import { ListRow, ListSeparator } from '@/components/list-row';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeDay, useFormatCurrency } from '@/lib/format';

/** This branch's spending, newest first; tap to edit. */
export default function ExpensesScreen() {
  const theme = useTheme();
  const formatCurrency = useFormatCurrency();
  const query = useExpenses();
  const summary = useExpenseTotal(30);
  const expenses = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => <HeaderButton title="Add" onPress={() => router.push('/expense-form')} />,
        }}
      />
      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1 }}
        ItemSeparatorComponent={ListSeparator}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => {
              void query.refetch();
              void summary.refetch();
            }}
            tintColor={theme.primary}
          />
        }
        ListHeaderComponent={
          summary.data ? (
            <View style={styles.summary}>
              <View style={styles.flex}>
                <ThemedText type="caption" themeColor="textSecondary">
                  Spent · last 30 days
                </ThemedText>
                <ThemedText type="subtitle">{formatCurrency(summary.data.totalExpenses)}</ThemedText>
              </View>
              <View style={styles.right}>
                <ThemedText type="caption" themeColor="textSecondary">
                  Sales − spending
                </ThemedText>
                <ThemedText type="subtitle" themeColor={summary.data.netProfit >= 0 ? 'success' : 'danger'}>
                  {formatCurrency(summary.data.netProfit)}
                </ThemedText>
              </View>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <ListRow
            href={{ pathname: '/expense-form', params: { id: item.id } }}
            title={item.title}
            subtitle={`${item.category.name} · ${formatRelativeDay(item.date)}`}
            value={formatCurrency(item.amount)}
            meta={
              item.status === 'PENDING' ? (
                <Badge label="Unpaid" tone="warning" />
              ) : item.status === 'CANCELLED' ? (
                <Badge label="Cancelled" tone="textSecondary" />
              ) : undefined
            }
          />
        )}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <QueryState
            isLoading={query.isLoading}
            error={query.error}
            onRetry={query.refetch}
            emptyTitle="No expenses yet"
            emptyMessage="Record rent, bills, transport and other spending to see what you really earn."
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
  flex: {
    flex: 1,
  },
  summary: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  right: {
    alignItems: 'flex-end',
  },
});
