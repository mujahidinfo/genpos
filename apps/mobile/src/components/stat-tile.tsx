import { Pressable, View } from 'react-native';

import type { IconName } from '@/components/icon';
import { IconTile } from '@/components/icon-tile';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** KPI card: tinted icon, big number, label; optionally a tap target ("Reorder ›"). */
export function StatTile({
  label,
  value,
  icon,
  tint,
  alert,
  onPress,
  actionLabel,
}: {
  label: string;
  value: string;
  icon: IconName;
  tint: string;
  /** Paints the value in the danger colour — pair with a label that states the condition. */
  alert?: boolean;
  /** Makes the tile a button (e.g. “Reorder”). */
  onPress?: () => void;
  actionLabel?: string;
}) {
  const theme = useTheme();
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
      style={{
        flexBasis: '47%',
        flexGrow: 1,
        gap: Spacing.three,
        padding: Spacing.three,
        borderRadius: Radius.lg + 4,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundElement,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06), 0 6px 16px rgba(15, 23, 42, 0.04)',
      }}>
      <IconTile name={icon} tint={tint} size={40} />
      <View style={{ gap: 2 }}>
        <ThemedText
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontSize: 26,
            lineHeight: 32,
            fontWeight: 700,
            fontVariant: ['tabular-nums'],
            color: alert ? theme.danger : theme.text,
          }}>
          {value}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
      {onPress && actionLabel && (
        <ThemedText type="caption" themeColor="primary" style={{ fontWeight: 700, marginTop: -Spacing.one }}>
          {actionLabel} ›
        </ThemedText>
      )}
    </Container>
  );
}
