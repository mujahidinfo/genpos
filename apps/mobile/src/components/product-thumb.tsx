import { Image } from 'expo-image';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** Soft tints for products without a photo; picked from the name so it's stable. */
const TINTS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

function tintFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

function initials(name: string) {
  const words = name.trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

/**
 * Product photo, or a tinted monogram when there is none — so a grid of
 * products without photos still looks intentional.
 */
export function ProductThumb({
  name,
  imageUrl,
  size,
  radius = 12,
}: {
  name: string;
  imageUrl?: string | null;
  /** Square side in points; omit to fill the parent (use with aspectRatio). */
  size?: number;
  radius?: number;
}) {
  const theme = useTheme();
  const box = size ? { width: size, height: size } : { width: '100%' as const, aspectRatio: 1 };
  const frame = { ...box, borderRadius: radius, borderCurve: 'continuous' as const, overflow: 'hidden' as const };

  if (imageUrl) {
    return (
      <View style={[frame, { backgroundColor: theme.backgroundSelected }]}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={150}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  const tint = tintFor(name);
  return (
    <View style={[frame, { backgroundColor: `${tint}1F`, alignItems: 'center', justifyContent: 'center' }]}>
      <ThemedText
        style={{
          color: tint,
          fontWeight: 700,
          fontSize: size ? Math.max(size * 0.36, 12) : 28,
          lineHeight: size ? Math.max(size * 0.44, 16) : 34,
        }}>
        {initials(name)}
      </ThemedText>
    </View>
  );
}
