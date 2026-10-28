import { router, Stack } from 'expo-router';
import { FlatList, RefreshControl } from 'react-native';

import { useSuppliers } from '@/api/queries';
import { HeaderButton } from '@/components/header-button';
import { ListRow, ListSeparator } from '@/components/list-row';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useFormatCurrency } from '@/lib/format';

export default function SuppliersScreen() {
  const theme = useTheme();
  const formatCurrency = useFormatCurrency();
  const query = useSuppliers();
  const totalDue = (query.data ?? []).reduce((sum, s) => sum + Math.max(s.due, 0), 0);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => <HeaderButton title="Add" onPress={() => router.push('/supplier-form')} />,
        }}
      />
      <FlatList
        data={query.data ?? []}
        keyExtractor={(s) => s.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1 }}
        ItemSeparatorComponent={ListSeparator}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={theme.primary}
          />
        }
        ListHeaderComponent={
          totalDue > 0 ? (
            <ThemedText type="smallBold" themeColor="danger" style={{ padding: 16 }}>
              You owe {formatCurrency(totalDue)} in total
            </ThemedText>
          ) : undefined
        }
        renderItem={({ item }) => (
          <ListRow
            href={{ pathname: '/account/supplier/[id]', params: { id: item.id } }}
            title={item.name}
            subtitle={item.phone ?? undefined}
            value={item.due > 0 ? formatCurrency(item.due) : undefined}
            meta={
              <ThemedText type="caption" themeColor={item.due > 0 ? 'danger' : 'textSecondary'}>
                {item.due > 0 ? 'Due' : 'Settled'}
              </ThemedText>
            }
          />
        )}
        ListEmptyComponent={
          <QueryState
            isLoading={query.isLoading}
            error={query.error}
            onRetry={query.refetch}
            emptyTitle="No suppliers yet"
            emptyMessage="Add the people you buy stock from to track what you owe them."
          />
        }
      />
    </>
  );
}
