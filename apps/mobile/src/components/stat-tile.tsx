import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function StatTile({
  label,
  value,
  tone,
  onPress,
  actionLabel,
}: {
  label: string;
  value: string;
  /** Status tone for the value — pair with a label that states the condition. */
  tone?: Extract<ThemeColor, 'danger' | 'warning' | 'success'>;
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
      style={[styles.tile, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText type="subtitle" themeColor={tone ?? 'text'} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
      {onPress && actionLabel && (
        <ThemedText type="caption" themeColor="primary" style={styles.action}>
          {actionLabel} ›
        </ThemedText>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  action: {
    fontWeight: 700,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
