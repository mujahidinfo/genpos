import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { UpcomingItem } from '@/api/types';
import { IconTile, TINT } from '@/components/icon-tile';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dueLabel, useFormatCurrency } from '@/lib/format';

/** A bill or salary that needs paying, with a one-tap Pay. */
export function UpcomingRow({ item }: { item: UpcomingItem }) {
  const theme = useTheme();
  const formatCurrency = useFormatCurrency();
  const overdue = item.daysUntil < 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 }}>
      <IconTile name={item.kind === 'SALARY' ? 'team' : 'repeat'} tint={item.kind === 'SALARY' ? TINT.emerald : TINT.violet} size={36} />
      <View style={{ flex: 1 }}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {item.title}
        </ThemedText>
        <ThemedText type="caption" style={{ color: overdue ? theme.danger : theme.textSecondary }} numberOfLines={1}>
          {dueLabel(item.daysUntil)} · {item.subtitle}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" style={{ fontVariant: ['tabular-nums'] }}>
        {formatCurrency(item.amount)}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Pay ${item.title}`}
        onPress={() => router.push({ pathname: '/pay-bill', params: { kind: item.kind, id: item.id } })}
        style={({ pressed }) => ({
          paddingHorizontal: Spacing.three,
          paddingVertical: 7,
          borderRadius: 999,
          backgroundColor: theme.primary,
          opacity: pressed ? 0.8 : 1,
        })}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          Pay
        </ThemedText>
      </Pressable>
    </View>
  );
}
