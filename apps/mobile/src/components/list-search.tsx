import { Stack } from 'expo-router';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Search for list screens: the native header search bar on iOS/Android, an inline
 * field on web (where native-stack has no search bar).
 */
export function ListSearch({
  placeholder,
  onChangeText,
}: {
  placeholder: string;
  onChangeText: (text: string) => void;
}) {
  const theme = useTheme();

  if (Platform.OS !== 'web') {
    return (
      <Stack.SearchBar
        placeholder={placeholder}
        onChangeText={(e) => onChangeText(e.nativeEvent.text)}
        onCancelButtonPress={() => onChangeText('')}
        hideWhenScrolling={false}
      />
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        onChangeText={onChangeText}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});
