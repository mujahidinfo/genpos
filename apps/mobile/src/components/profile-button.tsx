import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Avatar } from '@/components/avatar';
import { useSession } from '@/lib/session';

/** Avatar in the top bar; opens Profile & settings. */
export function ProfileButton() {
  const { user } = useSession();
  // The header can render for a frame while signing out.
  if (!user) return null;

  return (
    <Pressable
      onPress={() => router.push('/profile')}
      accessibilityRole="button"
      accessibilityLabel="Profile and settings"
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Avatar name={user.name} avatarUrl={user.avatarUrl} size={36} />
    </Pressable>
  );
}
