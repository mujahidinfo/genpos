import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import type { IconName } from '@/components/icon';
import { IconTile } from '@/components/icon-tile';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const CARD_SHADOW = '0 1px 2px rgba(15, 23, 42, 0.06), 0 6px 16px rgba(15, 23, 42, 0.04)';

/** White rounded card, optionally with an icon-led heading and a text action on the right. */
export function Panel({
  icon,
  tint,
  title,
  action,
  onAction,
  children,
  style,
}: {
  icon?: IconName;
  tint?: string;
  title?: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          gap: Spacing.three,
          padding: Spacing.three,
          borderRadius: Radius.lg + 4,
          borderCurve: 'continuous',
          backgroundColor: theme.backgroundElement,
          boxShadow: CARD_SHADOW,
        },
        style,
      ]}>
      {title && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          {icon && tint && <IconTile name={icon} tint={tint} size={28} />}
          <ThemedText type="smallBold" style={{ flex: 1 }}>
            {title}
          </ThemedText>
          {action && onAction && (
            <Pressable accessibilityRole="button" hitSlop={10} onPress={onAction}>
              <ThemedText type="smallBold" themeColor="primary">
                {action}
              </ThemedText>
            </Pressable>
          )}
        </View>
      )}
      {children}
    </View>
  );
}
