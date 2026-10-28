import { View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';

/** Soft palette for feature/setting icons. Hand-picked to sit well on white and slate. */
export const TINT = {
  indigo: '#6366F1',
  sky: '#0EA5E9',
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
  violet: '#8B5CF6',
  teal: '#14B8A6',
  slate: '#64748B',
} as const;

/** Rounded-square icon on a soft tint of its own colour. */
export function IconTile({ name, tint, size = 40 }: { name: IconName; tint: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        borderCurve: 'continuous',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${tint}1F`,
      }}>
      <Icon name={name} size={size * 0.5} color={tint} />
    </View>
  );
}
