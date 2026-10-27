import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CartLine } from '@/lib/cart';

/** One cart line: what it is, unit price, quantity stepper, line total. */
export function CartRow({
  line,
  highlighted,
  formatCurrency,
  onChangeQuantity,
}: {
  line: CartLine;
  /** Briefly true right after this line was scanned. */
  highlighted: boolean;
  formatCurrency: (n: number) => string;
  onChangeQuantity: (quantity: number) => void;
}) {
  const theme = useTheme();

  const step = (delta: number) => {
    void Haptics.selectionAsync();
    onChangeQuantity(line.quantity + delta);
  };

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: highlighted ? `${theme.primary}14` : theme.backgroundElement },
      ]}>
      <View style={styles.main}>
        <ThemedText numberOfLines={2}>{line.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {[line.variantName, formatCurrency(line.price)].filter(Boolean).join(' · ')}
        </ThemedText>
      </View>

      <View style={styles.side}>
        <ThemedText type="smallBold" style={styles.total}>
          {formatCurrency(line.price * line.quantity)}
        </ThemedText>
        <View style={[styles.stepper, { borderColor: theme.border }]}>
          <StepButton
            label={line.quantity === 1 ? 'Remove' : 'Decrease'}
            symbol={line.quantity === 1 ? '×' : '−'}
            danger={line.quantity === 1}
            onPress={() => step(-1)}
          />
          <ThemedText type="smallBold" style={styles.qty} accessibilityLabel={`Quantity ${line.quantity}`}>
            {line.quantity}
          </ThemedText>
          <StepButton label="Increase" symbol="+" onPress={() => step(1)} />
        </View>
      </View>
    </View>
  );
}

function StepButton({
  label,
  symbol,
  danger,
  onPress,
}: {
  label: string;
  symbol: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.stepButton, pressed && { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText style={[styles.stepSymbol, { color: danger ? theme.danger : theme.text }]}>
        {symbol}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 72,
  },
  main: {
    flex: 1,
    gap: Spacing.half,
  },
  side: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  total: {
    fontVariant: ['tabular-nums'],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.sm,
  },
  stepButton: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  stepSymbol: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: 600,
  },
  qty: {
    minWidth: 28,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
