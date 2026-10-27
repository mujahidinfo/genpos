import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Tappable list row: title/subtitle on the left, value/meta on the right. */
export function ListRow({
  href,
  title,
  subtitle,
  value,
  meta,
}: {
  href: Href;
  title: string;
  subtitle?: ReactNode;
  value?: string;
  meta?: ReactNode;
}) {
  const theme = useTheme();

  // A plain Pressable rather than <Link asChild>: Link's slot doesn't resolve a
  // function `style` on native, which silently drops every row style.
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}>
      <View style={styles.main}>
        <ThemedText numberOfLines={1}>{title}</ThemedText>
        {typeof subtitle === 'string' ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : (
          subtitle
        )}
      </View>
      <View style={styles.side}>
        {value && (
          <ThemedText type="smallBold" style={styles.value}>
            {value}
          </ThemedText>
        )}
        {meta}
      </View>
    </Pressable>
  );
}

export function ListSeparator() {
  const theme = useTheme();
  return <View style={[styles.separator, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    minHeight: 64,
  },
  main: {
    flex: 1,
    gap: Spacing.half,
  },
  side: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  value: {
    fontVariant: ['tabular-nums'],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.three,
  },
});
