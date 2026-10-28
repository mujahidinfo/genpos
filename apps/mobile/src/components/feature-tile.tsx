import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/badge';
import type { IconName } from '@/components/icon';
import { IconTile } from '@/components/icon-tile';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BadgeProps = React.ComponentProps<typeof Badge>;

/** A square-ish card on the More hub: tinted icon, title, one line of context. */
export function FeatureTile({
  icon,
  tint,
  title,
  subtitle,
  href,
  badge,
}: {
  icon: IconName;
  tint: string;
  title: string;
  subtitle: string;
  href: Href;
  badge?: BadgeProps;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={() => router.push(href)}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 132,
        padding: Spacing.three,
        gap: Spacing.three,
        borderRadius: Radius.lg + 4,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundElement,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06), 0 6px 16px rgba(15, 23, 42, 0.04)',
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <IconTile name={icon} tint={tint} size={44} />
        {badge && <Badge {...badge} />}
      </View>
      <View style={{ gap: 2 }}>
        <ThemedText type="smallBold" style={{ fontSize: 16 }} numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
          {subtitle}
        </ThemedText>
      </View>
    </Pressable>
  );
}
