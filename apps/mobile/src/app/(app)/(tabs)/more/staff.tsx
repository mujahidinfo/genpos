import { router, Stack } from 'expo-router';
import { FlatList, RefreshControl, View } from 'react-native';

import { useMembers } from '@/api/queries';
import { Badge } from '@/components/badge';
import { HeaderButton } from '@/components/header-button';
import { ListRow, ListSeparator } from '@/components/list-row';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ROLE_LABEL } from '@/lib/roles';
import { useCurrentUser } from '@/lib/session';

/** Everyone with access to this business; tap to change role, branch or access. */
export default function StaffScreen() {
  const theme = useTheme();
  const me = useCurrentUser();
  const query = useMembers();

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => <HeaderButton title="Add" onPress={() => router.push('/member-form')} />,
        }}
      />
      <FlatList
        data={query.data ?? []}
        keyExtractor={(m) => m.id}
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
        renderItem={({ item }) => (
          <ListRow
            href={{ pathname: '/member-form', params: { id: item.id } }}
            title={item.user.id === me.id ? `${item.user.name} (you)` : item.user.name}
            subtitle={`${item.user.email} · ${item.shop?.name ?? 'All branches'}`}
            meta={
              item.isActive ? (
                <Badge label={ROLE_LABEL[item.role]} tone={item.role === 'OWNER' ? 'primary' : 'textSecondary'} />
              ) : (
                <Badge label="No access" tone="danger" />
              )
            }
          />
        )}
        ListEmptyComponent={<QueryState isLoading={query.isLoading} error={query.error} onRetry={query.refetch} />}
        ListFooterComponent={
          query.data?.length ? (
            <View style={{ padding: Spacing.three }}>
              <ThemedText type="caption" themeColor="textSecondary">
                Cashiers can sell and see orders. Inventory managers also add products, receive stock and
                manage suppliers. Managers can do everything except manage owners.
              </ThemedText>
            </View>
          ) : undefined
        }
      />
    </>
  );
}
