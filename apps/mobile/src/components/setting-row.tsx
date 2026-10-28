import { Children, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { IconTile } from '@/components/icon-tile';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A grouped list: rounded white card, hairline dividers inset past the icons. */
export function SettingGroup({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  const theme = useTheme();
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={{ gap: Spacing.two }}>
      {title && (
        <ThemedText
          type="caption"
          themeColor="textSecondary"
          style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, paddingHorizontal: Spacing.three }}>
          {title}
        </ThemedText>
      )}
      <View
        style={{
          borderRadius: Radius.lg,
          borderCurve: 'continuous',
          backgroundColor: theme.backgroundElement,
          overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
        }}>
        {rows.map((row, index) => (
          <View key={index}>
            {index > 0 && <View style={{ height: 1, marginLeft: 66, backgroundColor: theme.border, opacity: 0.7 }} />}
            {row}
          </View>
        ))}
      </View>
      {footer && (
        <ThemedText type="caption" themeColor="textSecondary" style={{ paddingHorizontal: Spacing.three }}>
          {footer}
        </ThemedText>
      )}
    </View>
  );
}

/**
 * One row of a SettingGroup: icon tile, title (+ subtitle), then either a
 * `value` with a chevron (tappable) or any `right` control such as a Switch.
 */
export function SettingRow({
  icon,
  tint,
  title,
  subtitle,
  value,
  right,
  onPress,
  danger,
}: {
  icon: IconName;
  tint: string;
  title: string;
  subtitle?: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const theme = useTheme();
  const body = (pressed: boolean) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        minHeight: 58,
        paddingHorizontal: Spacing.three,
        paddingVertical: 10,
        backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
      }}>
      <IconTile name={icon} tint={tint} size={34} />
      <View style={{ flex: 1, gap: 1 }}>
        <ThemedText style={{ fontWeight: 600, color: danger ? theme.danger : theme.text }} numberOfLines={1}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      {value && (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={{ maxWidth: '45%' }}>
          {value}
        </ThemedText>
      )}
      {right}
      {onPress && !right && <Icon name="chevronRight" size={14} color={theme.textSecondary} weight="semibold" />}
    </View>
  );

  if (!onPress) return body(false);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={value ? `${title}, ${value}` : title} onPress={onPress}>
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}
