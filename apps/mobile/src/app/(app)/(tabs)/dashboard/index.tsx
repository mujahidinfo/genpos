import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useAnalyticsOverview, useSalesChart, useShop, useTopProducts } from '@/api/queries';
import { Card } from '@/components/card';
import { QueryState } from '@/components/query-state';
import { RevenueBars } from '@/components/revenue-bars';
import { StatTile } from '@/components/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormatCurrency } from '@/lib/format';
import { canEditCatalog } from '@/lib/roles';
import { useActiveShop, useCurrentUser } from '@/lib/session';

const PERIODS = [
  { label: 'Today', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
] as const;

export default function HomeScreen() {
  const user = useCurrentUser();
  const active = useActiveShop();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const formatCurrency = useFormatCurrency();
  const [days, setDays] = useState<number>(1);

  const { data: shop } = useShop();
  const overview = useAnalyticsOverview(days);
  const chart = useSalesChart(7);
  const topProducts = useTopProducts(days);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['analytics'] });
    setRefreshing(false);
  };

  const periodLabel = PERIODS.find((p) => p.days === days)?.label.toLowerCase();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
      <ThemedText themeColor="textSecondary" style={styles.greeting}>
        Hi {user.name.split(' ')[0]}
        {shop ? ` — here's ${shop.name}` : ''}
      </ThemedText>

      <View style={[styles.segmented, { backgroundColor: theme.backgroundSelected }]}>
        {PERIODS.map((p) => {
          const selected = p.days === days;
          return (
            <Pressable
              key={p.days}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setDays(p.days)}
              style={[styles.segment, selected && { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
                {p.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {overview.data ? (
        <>
          <View style={styles.hero}>
            <ThemedText type="small" themeColor="textSecondary">
              Revenue {periodLabel === 'today' ? 'today' : `· last ${periodLabel}`}
            </ThemedText>
            <ThemedText style={styles.heroValue} adjustsFontSizeToFit numberOfLines={1}>
              {formatCurrency(overview.data.totalRevenue)}
            </ThemedText>
          </View>
          <View style={styles.grid}>
            <StatTile label="Completed sales" value={String(overview.data.fulfilledOrders)} />
            <StatTile label="All orders" value={String(overview.data.totalOrders)} />
            <StatTile
              label="Low-stock items"
              value={String(overview.data.lowStockCount)}
              tone={overview.data.lowStockCount > 0 ? 'danger' : undefined}
              {...(overview.data.lowStockCount > 0 &&
                canEditCatalog(active.role) && {
                  actionLabel: 'Reorder',
                  onPress: () => router.push({ pathname: '/receive-stock', params: { reorder: '1' } }),
                })}
            />
            <StatTile label="Customers" value={String(overview.data.totalCustomers)} />
          </View>
        </>
      ) : (
        <View style={styles.placeholder}>
          <QueryState isLoading={overview.isLoading} error={overview.error} onRetry={overview.refetch} />
        </View>
      )}

      <Card title="Revenue · last 7 days">
        {chart.data ? (
          <RevenueBars data={chart.data} formatValue={formatCurrency} />
        ) : (
          <View style={styles.placeholder}>
            <QueryState isLoading={chart.isLoading} error={chart.error} onRetry={chart.refetch} />
          </View>
        )}
      </Card>

      <Card title={`Top sellers · ${periodLabel}`}>
        {topProducts.data && topProducts.data.length > 0 ? (
          topProducts.data.map((p, i) => (
            <View key={p.productId + p.name} style={styles.topRow}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.rank}>
                {i + 1}
              </ThemedText>
              <View style={styles.topMain}>
                <ThemedText type="small" numberOfLines={1}>
                  {p.name}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {p.totalQty} sold
                </ThemedText>
              </View>
              <ThemedText type="smallBold" style={styles.tabular}>
                {formatCurrency(p.totalRevenue)}
              </ThemedText>
            </View>
          ))
        ) : topProducts.isLoading ? (
          <QueryState isLoading />
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            No completed sales in this period.
          </ThemedText>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  greeting: {
    paddingHorizontal: Spacing.one,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
  },
  hero: {
    paddingHorizontal: Spacing.one,
    gap: Spacing.half,
  },
  heroValue: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: 700,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  placeholder: {
    minHeight: 120,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  rank: {
    width: 16,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  topMain: {
    flex: 1,
    gap: Spacing.half,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
