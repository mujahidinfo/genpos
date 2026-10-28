import { Image } from 'expo-image';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase();
}

/** Circular profile picture, or the person's initials on a soft tint. */
export function Avatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${theme.primary}1A`,
        borderWidth: size >= 60 ? 2 : 1.5,
        borderColor: `${theme.primary}40`,
      }}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <ThemedText
          type="smallBold"
          themeColor="primary"
          style={{ fontSize: size * 0.36, lineHeight: size * 0.46 }}>
          {initialsOf(name)}
        </ThemedText>
      )}
    </View>
  );
}
