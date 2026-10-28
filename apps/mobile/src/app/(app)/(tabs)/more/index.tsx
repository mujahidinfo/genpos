import { Children, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { useAnalyticsOverview, useSuppliers, useUpcoming } from '@/api/queries';
import { FeatureTile } from '@/components/feature-tile';
import { Icon } from '@/components/icon';
import { TINT } from '@/components/icon-tile';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFormatCurrency } from '@/lib/format';
import { canEditCatalog, canManage } from '@/lib/roles';
import { useActiveShop, useSession } from '@/lib/session';

/**
 * The rest of the business: stock, suppliers, expenses, staff and branches.
 * Tiles appear only for roles that can use them.
 */
export default function MoreScreen() {
  const theme = useTheme();
  const active = useActiveShop();
  const { workspaces } = useSession();
  const formatCurrency = useFormatCurrency();

  const editor = canEditCatalog(active.role);
  const manager = canManage(active.role);
  const branchCount = workspaces.reduce((n, w) => n + w.shops.length, 0);
  const showBranches = branchCount > 1 || active.role === 'OWNER';

  const lowStock = useAnalyticsOverview(1).data?.lowStockCount ?? 0;
  const suppliers = useSuppliers(editor);
  const totalDue = (suppliers.data ?? []).reduce((sum, s) => sum + Math.max(s.due, 0), 0);

  const upcoming = useUpcoming(7, manager);
  const dueCount = upcoming.data?.items.length ?? 0;

  const sections: { title: string; tiles: ReactNode[] }[] = [
    {
      title: 'Stock',
      tiles: editor
        ? [
            <FeatureTile
              key="receive"
              icon="receive"
              tint={TINT.emerald}
              title="Receive stock"
              subtitle="Add goods that were delivered"
              href="/receive-stock"
            />,
            <FeatureTile
              key="reorder"
              icon="reorder"
              tint={TINT.amber}
              title="Reorder"
              subtitle={lowStock > 0 ? `${lowStock} item${lowStock === 1 ? '' : 's'} running low` : 'Nothing running low'}
              href={{ pathname: '/receive-stock', params: { reorder: '1' } }}
              badge={lowStock > 0 ? { label: String(lowStock), tone: 'danger' } : undefined}
            />,
            <FeatureTile
              key="suppliers"
              icon="truck"
              tint={TINT.sky}
              title="Suppliers"
              subtitle={totalDue > 0 ? `You owe ${formatCurrency(totalDue)}` : 'Who you buy from'}
              href="/more/suppliers"
            />,
          ]
        : [],
    },
    {
      title: 'Money',
      tiles: manager
        ? [
            <FeatureTile
              key="expenses"
              icon="money"
              tint={TINT.rose}
              title="Expenses"
              subtitle={dueCount > 0 ? `${dueCount} to pay soon` : 'Everything you spend'}
              href="/more/expenses"
              badge={upcoming.data && upcoming.data.overdueCount > 0 ? { label: `${upcoming.data.overdueCount} overdue`, tone: 'danger' } : undefined}
            />,
            <FeatureTile
              key="bills"
              icon="repeat"
              tint={TINT.violet}
              title="Bills"
              subtitle="Rent, internet — repeating"
              href="/more/bills"
            />,
          ]
        : [],
    },
    {
      title: 'Team & shops',
      tiles: [
        ...(manager
          ? [
              <FeatureTile
                key="staff"
                icon="team"
                tint={TINT.violet}
                title="Staff & salaries"
                subtitle="Access, pay and payroll"
                href="/more/staff"
              />,
            ]
          : []),
        ...(showBranches
          ? [
              <FeatureTile
                key="branches"
                icon="branches"
                tint={TINT.teal}
                title="Branches"
                subtitle={branchCount > 1 ? `${branchCount} outlets · switch or add` : 'Add another outlet'}
                href="/branches"
              />,
            ]
          : []),
      ],
    },
  ].filter((section) => section.tiles.length > 0);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: Spacing.three, gap: Spacing.four, paddingBottom: Spacing.six }}>
      {sections.length === 0 ? (
        <View
          style={{
            alignItems: 'center',
            gap: Spacing.two,
            padding: Spacing.five,
            borderRadius: Radius.lg,
            borderCurve: 'continuous',
            backgroundColor: theme.backgroundElement,
          }}>
          <Icon name="profile" size={34} color={theme.textSecondary} />
          <ThemedText type="smallBold">Nothing extra for your role</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            Your profile and settings are under the picture at the top right.
          </ThemedText>
        </View>
      ) : (
        sections.map((section) => (
          <View key={section.title} style={{ gap: Spacing.two }}>
            <ThemedText
              type="caption"
              themeColor="textSecondary"
              style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, paddingHorizontal: Spacing.one }}>
              {section.title}
            </ThemedText>
            <TileGrid>{section.tiles}</TileGrid>
          </View>
        ))
      )}
    </ScrollView>
  );
}

/** Two tiles per row; a lone last tile keeps half width instead of stretching. */
function TileGrid({ children }: { children: ReactNode }) {
  const tiles = Children.toArray(children);
  const rows: ReactNode[][] = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));

  return (
    <View style={{ gap: Spacing.three }}>
      {rows.map((row, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: Spacing.three }}>
          {row}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}
