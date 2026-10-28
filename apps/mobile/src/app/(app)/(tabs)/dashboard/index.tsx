import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { useAnalyticsOverview, useSalesChart, useShop, useTopProducts } from '@/api/queries';
import { Icon } from '@/components/icon';
import { IconTile, TINT } from '@/components/icon-tile';
import { CARD_SHADOW, Panel } from '@/components/panel';
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
  { label: 'Today', days: 1, phrase: 'today' },
  { label: '7 days', days: 7, phrase: 'last 7 days' },
  { label: '30 days', days: 30, phrase: 'last 30 days' },
] as const;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

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

  const period = PERIODS.find((p) => p.days === days) ?? PERIODS[0];
  const lowStock = overview.data?.lowStockCount ?? 0;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.five }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
      <View style={{ paddingHorizontal: Spacing.one, gap: 2 }}>
        <ThemedText type="small" themeColor="textSecondary">
          {greeting()}, {user.name.split(' ')[0]}
        </ThemedText>
        <ThemedText style={{ fontSize: 22, lineHeight: 28, fontWeight: 700 }} numberOfLines={1}>
          {shop?.name ?? active.name}
        </ThemedText>
      </View>

      {/* Revenue hero with the period switch built in */}
      <View
        style={{
          gap: Spacing.three,
          padding: Spacing.three,
          borderRadius: Radius.lg + 4,
          borderCurve: 'continuous',
          backgroundColor: theme.backgroundElement,
          boxShadow: CARD_SHADOW,
        }}>
        <View
          style={{
            flexDirection: 'row',
            padding: 3,
            borderRadius: 999,
            backgroundColor: theme.backgroundSelected,
          }}>
          {PERIODS.map((p) => {
            const selected = p.days === days;
            return (
              <Pressable
                key={p.days}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setDays(p.days)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: selected ? theme.backgroundElement : 'transparent',
                  boxShadow: selected ? '0 1px 2px rgba(15, 23, 42, 0.12)' : undefined,
                }}>
                <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
                  {p.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
          <IconTile name="trend" tint={TINT.indigo} size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText type="small" themeColor="textSecondary">
              Revenue · {period.phrase}
            </ThemedText>
            {overview.data ? (
              <ThemedText
                adjustsFontSizeToFit
                numberOfLines={1}
                style={{ fontSize: 36, lineHeight: 42, fontWeight: 700, fontVariant: ['tabular-nums'] }}>
                {formatCurrency(overview.data.totalRevenue)}
              </ThemedText>
            ) : (
              <ThemedText style={{ fontSize: 36, lineHeight: 42, fontWeight: 700 }} themeColor="textSecondary">
                –
              </ThemedText>
            )}
          </View>
        </View>
      </View>

      {overview.data ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three }}>
          <StatTile icon="receipt" tint={TINT.emerald} label="Completed sales" value={String(overview.data.fulfilledOrders)} />
          <StatTile icon="bag" tint={TINT.sky} label="All orders" value={String(overview.data.totalOrders)} />
          <StatTile
            icon="alert"
            tint={lowStock > 0 ? TINT.rose : TINT.slate}
            label="Low-stock items"
            value={String(lowStock)}
            alert={lowStock > 0}
            {...(lowStock > 0 &&
              canEditCatalog(active.role) && {
                actionLabel: 'Reorder',
                onPress: () => router.push({ pathname: '/receive-stock', params: { reorder: '1' } }),
              })}
          />
          <StatTile icon="team" tint={TINT.violet} label="Customers" value={String(overview.data.totalCustomers)} />
        </View>
      ) : (
        <View style={{ minHeight: 120 }}>
          <QueryState isLoading={overview.isLoading} error={overview.error} onRetry={overview.refetch} />
        </View>
      )}

      <Panel icon="trend" tint={TINT.indigo} title="Last 7 days">
        {chart.data ? (
          <RevenueBars data={chart.data} formatValue={formatCurrency} />
        ) : (
          <View style={{ minHeight: 120 }}>
            <QueryState isLoading={chart.isLoading} error={chart.error} onRetry={chart.refetch} />
          </View>
        )}
      </Panel>

      <Panel icon="star" tint={TINT.amber} title={`Top sellers · ${period.phrase}`}>
        {topProducts.data && topProducts.data.length > 0 ? (
          topProducts.data.map((p, i) => (
            <View
              key={p.productId + p.name}
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.one }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: i === 0 ? `${TINT.amber}26` : theme.backgroundSelected,
                }}>
                <ThemedText
                  type="smallBold"
                  style={{ color: i === 0 ? TINT.amber : theme.textSecondary, fontVariant: ['tabular-nums'] }}>
                  {i + 1}
                </ThemedText>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText type="small" style={{ fontWeight: 600 }} numberOfLines={1}>
                  {p.name}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {p.totalQty} sold
                </ThemedText>
              </View>
              <ThemedText type="smallBold" style={{ fontVariant: ['tabular-nums'] }}>
                {formatCurrency(p.totalRevenue)}
              </ThemedText>
            </View>
          ))
        ) : topProducts.isLoading ? (
          <QueryState isLoading />
        ) : (
          <View style={{ alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three }}>
            <Icon name="receipt" size={24} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              No completed sales {period.phrase}.
            </ThemedText>
          </View>
        )}
      </Panel>
    </ScrollView>
  );
}
