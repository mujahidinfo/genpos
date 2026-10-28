import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { useExpenses, useFinanceOverview, useUpcoming } from '@/api/queries';
import type { Expense, ExpenseSource, PaymentMethod } from '@/api/types';
import { Badge } from '@/components/badge';
import { Chip } from '@/components/choice';
import { Fab, FAB_CLEARANCE } from '@/components/fab';
import { Icon, type IconName } from '@/components/icon';
import { IconTile, TINT } from '@/components/icon-tile';
import { Panel } from '@/components/panel';
import { UpcomingRow } from '@/components/upcoming-row';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDayLabel, useFormatCurrency } from '@/lib/format';

const PERIODS = [
  { label: 'Today', days: 1, phrase: 'today' },
  { label: '7 days', days: 7, phrase: 'last 7 days' },
  { label: '30 days', days: 30, phrase: 'last 30 days' },
] as const;

const METHOD: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  MOBILE_MONEY: 'Mobile',
  BANK_TRANSFER: 'Bank',
};

/** Icon + tint for where an expense came from. */
const SOURCE: Record<ExpenseSource, { icon: IconName; tint: string }> = {
  MANUAL: { icon: 'money', tint: TINT.rose },
  SALARY: { icon: 'team', tint: TINT.emerald },
  SUPPLIER_PAYMENT: { icon: 'truck', tint: TINT.sky },
  RECURRING: { icon: 'repeat', tint: TINT.violet },
};

type Row =
  | { type: 'day'; key: string; label: string; total: number }
  | { type: 'expense'; key: string; expense: Expense };

/** Everything the business pays out: summary, what's due, where it goes, and the full ledger. */
export default function ExpensesScreen() {
  const theme = useTheme();
  const formatCurrency = useFormatCurrency();
  const [days, setDays] = useState<number>(30);
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const overview = useFinanceOverview(days);
  const upcoming = useUpcoming(7);
  const query = useExpenses({ days, categoryId });

  const period = PERIODS.find((p) => p.days === days) ?? PERIODS[2];
  const rows = useMemo(() => groupByDay(query.data?.pages.flatMap((p) => p.items) ?? []), [query.data]);
  const categories = overview.data?.expensesByCategory ?? [];
  const top = categories.slice(0, 5);
  const spent = overview.data?.totalExpenses ?? 0;

  const refresh = () => {
    void query.refetch();
    void overview.refetch();
    void upcoming.refetch();
  };

  const header = (
    <View style={{ gap: Spacing.three, paddingBottom: Spacing.two }}>
      {/* Period */}
      <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: theme.backgroundSelected }}>
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

      {/* Money out hero */}
      <Panel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
          <IconTile name="arrowUp" tint={TINT.rose} size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <ThemedText type="small" themeColor="textSecondary">
              Money out · {period.phrase}
            </ThemedText>
            <ThemedText
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{ fontSize: 34, lineHeight: 40, fontWeight: 700, fontVariant: ['tabular-nums'] }}>
              {overview.data ? formatCurrency(spent) : '–'}
            </ThemedText>
          </View>
        </View>
        {overview.data && (
          <View style={{ flexDirection: 'row', gap: Spacing.three }}>
            <MiniStat label="Sales in" value={formatCurrency(overview.data.totalIncome)} />
            <MiniStat
              label="Left over"
              value={formatCurrency(overview.data.netProfit)}
              color={overview.data.netProfit >= 0 ? theme.success : theme.danger}
            />
          </View>
        )}
      </Panel>

      {/* Due soon */}
      {upcoming.data && upcoming.data.items.length > 0 && (
        <Panel
          icon="calendar"
          tint={TINT.amber}
          title={
            upcoming.data.overdueCount > 0
              ? `${upcoming.data.overdueCount} overdue · ${upcoming.data.items.length} to pay`
              : `${upcoming.data.items.length} to pay soon`
          }
          action="All bills"
          onAction={() => router.push('/more/bills')}>
          {upcoming.data.items.slice(0, 3).map((item) => (
            <UpcomingRow key={item.kind + item.id} item={item} />
          ))}
          {upcoming.data.items.length > 3 && (
            <ThemedText type="caption" themeColor="textSecondary">
              +{upcoming.data.items.length - 3} more · {formatCurrency(upcoming.data.total)} in total
            </ThemedText>
          )}
        </Panel>
      )}

      {/* Shortcuts */}
      <View style={{ flexDirection: 'row', gap: Spacing.three }}>
        <Shortcut icon="repeat" tint={TINT.violet} title="Bills" subtitle="Rent, internet…" href="/more/bills" />
        <Shortcut icon="team" tint={TINT.emerald} title="Salaries" subtitle="Pay your team" href="/more/staff" />
      </View>

      {/* Where it goes */}
      {top.length > 0 && spent > 0 && (
        <Panel icon="grid" tint={TINT.indigo} title="Where it goes">
          {top.map((c) => (
            <Pressable
              key={c.categoryId}
              accessibilityRole="button"
              onPress={() => setCategoryId(categoryId === c.categoryId ? undefined : c.categoryId)}
              style={{ gap: 6, opacity: categoryId && categoryId !== c.categoryId ? 0.45 : 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two }}>
                <ThemedText type="small" numberOfLines={1} style={{ flex: 1 }}>
                  {c.name}
                </ThemedText>
                <ThemedText type="smallBold" style={{ fontVariant: ['tabular-nums'] }}>
                  {formatCurrency(c.amount)}
                </ThemedText>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.backgroundSelected, overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${Math.max((c.amount / spent) * 100, 3)}%`,
                    height: '100%',
                    borderRadius: 4,
                    backgroundColor: c.color,
                  }}
                />
              </View>
            </Pressable>
          ))}
        </Panel>
      )}

      {/* Filter */}
      {categories.length > 1 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
          <Chip label="All" selected={!categoryId} onPress={() => setCategoryId(undefined)} />
          {categories.map((c) => (
            <Chip key={c.categoryId} label={c.name} selected={categoryId === c.categoryId} onPress={() => setCategoryId(c.categoryId)} />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1, padding: Spacing.three, paddingBottom: FAB_CLEARANCE }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={refresh}
            tintColor={theme.primary}
          />
        }
        ListHeaderComponent={header}
        renderItem={({ item }) =>
          item.type === 'day' ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.three, paddingBottom: Spacing.two, paddingHorizontal: Spacing.one }}>
              <ThemedText type="caption" themeColor="textSecondary" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                {item.label}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" style={{ fontVariant: ['tabular-nums'] }}>
                {formatCurrency(item.total)}
              </ThemedText>
            </View>
          ) : (
            <ExpenseRow expense={item.expense} amount={formatCurrency(item.expense.amount)} />
          )
        }
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <QueryState
            isLoading={query.isLoading}
            error={query.error}
            onRetry={query.refetch}
            emptyTitle="Nothing spent yet"
            emptyMessage={
              categoryId
                ? 'No spending in this category for the period.'
                : 'Tap + to record rent, bills, transport or any other spending. Salaries and supplier payments show up here too.'
            }
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
      <Fab label="Add expense" onPress={() => router.push('/expense-form')} />
    </View>
  );
}

function groupByDay(expenses: Expense[]): Row[] {
  const rows: Row[] = [];
  let current: Extract<Row, { type: 'day' }> | null = null;
  let currentKey = '';
  for (const expense of expenses) {
    const key = new Date(expense.date).toDateString();
    if (key !== currentKey) {
      currentKey = key;
      current = { type: 'day', key: `day-${key}`, label: formatDayLabel(expense.date), total: 0 };
      rows.push(current);
    }
    if (expense.status !== 'CANCELLED') current!.total += expense.amount;
    rows.push({ type: 'expense', key: expense.id, expense });
  }
  return rows;
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, gap: 2, padding: Spacing.two + 2, borderRadius: Radius.md, backgroundColor: theme.background }}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold" numberOfLines={1} adjustsFontSizeToFit style={{ color: color ?? theme.text, fontVariant: ['tabular-nums'] }}>
        {value}
      </ThemedText>
    </View>
  );
}

function Shortcut({
  icon,
  tint,
  title,
  subtitle,
  href,
}: {
  icon: IconName;
  tint: string;
  title: string;
  subtitle: string;
  href: '/more/bills' | '/more/staff';
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two + 2,
        padding: Spacing.two + 2,
        borderRadius: Radius.lg,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundElement,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}>
      <IconTile name={icon} tint={tint} size={36} />
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {subtitle}
        </ThemedText>
      </View>
      <Icon name="chevronRight" size={14} color={theme.textSecondary} />
    </Pressable>
  );
}

function ExpenseRow({ expense, amount }: { expense: Expense; amount: string }) {
  const theme = useTheme();
  const src = SOURCE[expense.source] ?? SOURCE.MANUAL;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${expense.title}, ${amount}`}
      onPress={() => router.push({ pathname: '/expense-form', params: { id: expense.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        padding: Spacing.two + 2,
        marginBottom: Spacing.two,
        borderRadius: Radius.lg,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundElement,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
        opacity: expense.status === 'CANCELLED' ? 0.5 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <IconTile name={src.icon} tint={src.tint} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {expense.title}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {expense.category.name} · {METHOD[expense.paymentMethod]}
        </ThemedText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <ThemedText type="smallBold" style={{ fontVariant: ['tabular-nums'] }}>
          {amount}
        </ThemedText>
        {expense.status === 'PENDING' && <Badge label="Unpaid" tone="warning" />}
        {expense.status === 'CANCELLED' && <Badge label="Cancelled" tone="textSecondary" />}
      </View>
    </Pressable>
  );
}
