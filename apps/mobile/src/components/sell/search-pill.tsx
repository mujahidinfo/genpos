import { Pressable, TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Rounded search field with a clear button. */
export function SearchPill({
  value,
  onChangeText,
  placeholder,
  onFocus,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onFocus?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.two,
        height: 44,
        paddingHorizontal: Spacing.three,
        borderRadius: Radius.md,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundElement,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
      }}>
      <Icon name="search" size={17} color={theme.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={placeholder}
        style={{ flex: 1, fontSize: 16, color: theme.text, paddingVertical: 0 }}
      />
      {value.length > 0 && (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => onChangeText('')}>
          <Icon name="clear" size={17} color={theme.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}
