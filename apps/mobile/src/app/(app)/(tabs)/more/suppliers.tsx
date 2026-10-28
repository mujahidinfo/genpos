import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { useSuppliers } from '@/api/queries';
import type { Supplier } from '@/api/types';
import { Avatar } from '@/components/avatar';
import { Badge } from '@/components/badge';
import { Fab, FAB_CLEARANCE } from '@/components/fab';
import { FilterBar } from '@/components/filter-bar';
import { IconTile, TINT } from '@/components/icon-tile';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { useFormatCurrency } from '@/lib/format';

type Filter = 'due';

/** Who you buy from, with what you owe each of them front and centre. */
export default function SuppliersScreen() {
  const theme = useTheme();
  const formatCurrency = useFormatCurrency();
  const query = useSuppliers();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter | undefined>();
  const needle = useDebouncedValue(search.trim().toLowerCase(), 150);

  const all = query.data ?? [];
  const owed = all.filter((s) => s.due > 0);
  const totalDue = owed.reduce((sum, s) => sum + s.due, 0);
  const shown = all
    .filter((s) => (filter === 'due' ? s.due > 0 : true))
    .filter((s) => !needle || s.name.toLowerCase().includes(needle) || (s.phone ?? '').includes(needle))
    // Biggest debt first, then alphabetical.
    .sort((a, b) => b.due - a.due || a.name.localeCompare(b.name));

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Search suppliers"
        chips={[{ label: 'All' }, { label: owed.length ? `You owe (${owed.length})` : 'You owe', value: 'due' as Filter }]}
        selected={filter}
        onSelect={setFilter}
      />
      <FlatList
        data={shown}
        keyExtractor={(s) => s.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, padding: Spacing.three, paddingTop: Spacing.one, paddingBottom: FAB_CLEARANCE, gap: Spacing.two + 2 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={theme.primary} />}
        ListHeaderComponent={
          totalDue > 0 && !needle && !filter ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.three,
                padding: Spacing.three,
                marginBottom: Spacing.one,
                borderRadius: Radius.lg + 4,
                borderCurve: 'continuous',
                backgroundColor: `${TINT.rose}14`,
              }}>
              <IconTile name="wallet" tint={TINT.rose} size={44} />
              <View style={{ flex: 1 }}>
                <ThemedText type="caption" themeColor="textSecondary">
                  You owe in total
                </ThemedText>
                <ThemedText style={{ fontSize: 26, lineHeight: 32, fontWeight: 700, fontVariant: ['tabular-nums'] }} themeColor="danger">
                  {formatCurrency(totalDue)}
                </ThemedText>
              </View>
              <ThemedText type="caption" themeColor="textSecondary">
                {owed.length} supplier{owed.length === 1 ? '' : 's'}
              </ThemedText>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => <SupplierCard supplier={item} due={formatCurrency(item.due)} bought={formatCurrency(item.totalPurchased)} />}
        ListEmptyComponent={
          <QueryState
            isLoading={query.isLoading}
            error={query.error}
            onRetry={query.refetch}
            emptyTitle={needle || filter ? 'No matching suppliers' : 'No suppliers yet'}
            emptyMessage={needle || filter ? 'Try a different search or filter.' : 'Add the people you buy stock from to track what you owe them.'}
          />
        }
      />
      <Fab label="Add supplier" onPress={() => router.push('/supplier-form')} />
    </View>
  );
}

function SupplierCard({ supplier, due, bought }: { supplier: Supplier; due: string; bought: string }) {
  const theme = useTheme();
  const owed = supplier.due > 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${supplier.name}, ${owed ? `you owe ${due}` : 'settled'}`}
      onPress={() => router.push({ pathname: '/more/supplier/[id]', params: { id: supplier.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        padding: Spacing.three,
        borderRadius: Radius.lg + 4,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundElement,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.03)',
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <Avatar name={supplier.name} size={46} />
      <View style={{ flex: 1, gap: 3 }}>
        <ThemedText type="smallBold" style={{ fontSize: 16 }} numberOfLines={1}>
          {supplier.name}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {supplier.phone ? `${supplier.phone} · ` : ''}
          {supplier.totalPurchased > 0 ? `Bought ${bought}` : 'No deliveries yet'}
        </ThemedText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        {owed ? (
          <>
            <ThemedText type="smallBold" themeColor="danger" style={{ fontSize: 16, fontVariant: ['tabular-nums'] }}>
              {due}
            </ThemedText>
            <Badge label="Due" tone="danger" />
          </>
        ) : (
          <Badge label="Settled" tone="success" />
        )}
      </View>
    </Pressable>
  );
}
