import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';

import { useShop, useUpdateShop } from '@/api/queries';
import { Icon } from '@/components/icon';
import { ListSeparator } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { CURRENCIES } from '@/constants/currencies';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Pick the currency prices are shown in. Prices already entered are not converted. */
export default function CurrencyScreen() {
  const theme = useTheme();
  const { data: shop } = useShop();
  const update = useUpdateShop();
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const term = search.trim().toLowerCase();
  const data = term
    ? CURRENCIES.filter((c) => c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term))
    : CURRENCIES;

  const choose = async (code: string) => {
    if (code === shop?.currency) return router.back();
    setError(null);
    try {
      await update.mutateAsync({ currency: code });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change the currency.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ padding: Spacing.three, gap: Spacing.two }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search currency"
          placeholderTextColor={theme.textSecondary}
          autoCorrect={false}
          accessibilityLabel="Search currency"
          style={{
            minHeight: 46,
            paddingHorizontal: Spacing.three,
            fontSize: 16,
            color: theme.text,
            borderRadius: Radius.md,
            borderCurve: 'continuous',
            backgroundColor: theme.backgroundElement,
          }}
        />
        <ThemedText type="caption" themeColor="textSecondary">
          Existing prices aren’t converted — only how amounts are shown changes.
        </ThemedText>
        {error && (
          <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        )}
      </View>
      <FlatList
        data={data}
        keyExtractor={(c) => c.code}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', padding: Spacing.five }}>
            No currency matches “{search}”.
          </ThemedText>
        }
        renderItem={({ item }) => {
          const selected = item.code === shop?.currency;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => choose(item.code)}
              disabled={update.isPending}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.three,
                minHeight: 60,
                paddingHorizontal: Spacing.three,
                backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
              })}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  borderCurve: 'continuous',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: selected ? `${theme.primary}1F` : theme.backgroundSelected,
                }}>
                <ThemedText type="smallBold" themeColor={selected ? 'primary' : 'text'} numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 14, paddingHorizontal: 2 }}>
                  {item.symbol}
                </ThemedText>
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontWeight: 600 }}>{item.code}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {item.name}
                </ThemedText>
              </View>
              {selected &&
                (update.isPending ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <Icon name="tick" size={18} color={theme.primary} weight="bold" />
                ))}
            </Pressable>
          );
        }}
      />
    </View>
  );
}
