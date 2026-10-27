import { StyleSheet, View } from 'react-native';

import type { OrderStatus } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Tone = Extract<ThemeColor, 'success' | 'warning' | 'danger' | 'primary' | 'textSecondary'>;

export function Badge({ label, tone }: { label: string; tone: Tone }) {
  const theme = useTheme();
  const color = theme[tone];

  return (
    // 1A = ~10% alpha tint of the tone color
    <View style={[styles.badge, { backgroundColor: `${color}1A` }]}>
      <ThemedText type="caption" style={{ color, fontWeight: 700 }}>
        {label}
      </ThemedText>
    </View>
  );
}

const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Pending', tone: 'warning' },
  PROCESSING: { label: 'Processing', tone: 'primary' },
  FULFILLED: { label: 'Completed', tone: 'success' },
  CANCELED: { label: 'Canceled', tone: 'textSecondary' },
  REFUNDED: { label: 'Refunded', tone: 'danger' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge {...ORDER_STATUS[status]} />;
}

const styles = StyleSheet.create({
  // No alignSelf: the parent decides (right in list rows, centered in heroes).
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
  },
});
