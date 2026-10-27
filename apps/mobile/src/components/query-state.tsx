import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Full-area loading / error / empty placeholder for query-driven screens. */
export function QueryState({
  isLoading,
  error,
  onRetry,
  emptyTitle,
  emptyMessage,
}: {
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
}) {
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <ThemedText type="smallBold">Couldn’t load this</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
          {error.message}
        </ThemedText>
        {onRetry && <Button title="Try again" variant="secondary" onPress={onRetry} />}
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <ThemedText type="smallBold">{emptyTitle ?? 'Nothing here yet'}</ThemedText>
      {emptyMessage && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
          {emptyMessage}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.two,
  },
  message: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
});
