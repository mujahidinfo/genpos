import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SellMode = 'scan' | 'browse';

const MODES: { value: SellMode; icon: IconName; label: string }[] = [
  { value: 'scan', icon: 'scan', label: 'Scan barcodes' },
  { value: 'browse', icon: 'grid', label: 'Browse products' },
];

/** Compact icon segmented control: scan vs. pick from the product grid. */
export function ModeToggle({ value, onChange }: { value: SellMode; onChange: (mode: SellMode) => void }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        height: 44,
        padding: 3,
        gap: 2,
        borderRadius: Radius.md,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundSelected,
      }}>
      {MODES.map((m) => {
        const selected = m.value === value;
        return (
          <Pressable
            key={m.value}
            accessibilityRole="tab"
            accessibilityLabel={m.label}
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              if (process.env.EXPO_OS === 'ios') void Haptics.selectionAsync();
              onChange(m.value);
            }}
            style={{
              width: 46,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: Radius.sm,
              borderCurve: 'continuous',
              backgroundColor: selected ? theme.backgroundElement : 'transparent',
              boxShadow: selected ? '0 1px 3px rgba(15, 23, 42, 0.12)' : undefined,
            }}>
            <Icon name={m.icon} size={19} color={selected ? theme.primary : theme.textSecondary} />
          </Pressable>
        );
      })}
    </View>
  );
}
