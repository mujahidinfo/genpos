import { Pressable } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const FAB_SIZE = 56;
/** Gap under floating controls; the native tab bar floats over content on iOS. */
export const FLOAT_BOTTOM = (process.env.EXPO_OS === 'ios' ? BottomTabInset : 0) + Spacing.three;
/** Bottom padding that keeps the last list row clear of the floating button. */
export const FAB_CLEARANCE = FAB_SIZE + FLOAT_BOTTOM + Spacing.three;

/** Round floating action button, bottom right. Place inside a `flex: 1` container. */
export function Fab({
  label,
  icon = 'plus',
  onPress,
  bottom = FLOAT_BOTTOM,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  bottom?: number;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        position: 'absolute',
        right: Spacing.three,
        bottom,
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary,
        boxShadow: '0 6px 16px rgba(77, 79, 239, 0.35), 0 2px 4px rgba(15, 23, 42, 0.12)',
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}>
      <Icon name={icon} size={26} color={theme.onPrimary} weight="semibold" />
    </Pressable>
  );
}
