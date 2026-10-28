import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = ViewProps & {
  title?: string;
  /** Children run edge to edge (e.g. list rows); only the title is padded. */
  flush?: boolean;
};

export function Card({ title, flush, style, children, ...rest }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        flush && styles.flush,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        style,
      ]}
      {...rest}>
      {title && (
        <ThemedText
          type="smallBold"
          themeColor="textSecondary"
          style={[styles.title, flush && styles.flushTitle]}>
          {title}
        </ThemedText>
      )}
      {children}
    </View>
  );
}

/** A "label ....... value" line used in detail screens. */
export function DetailRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.row}>
      <ThemedText type={emphasis ? 'smallBold' : 'small'} themeColor={emphasis ? 'text' : 'textSecondary'}>
        {label}
      </ThemedText>
      <ThemedText type={emphasis ? 'smallBold' : 'small'} style={styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  flush: {
    padding: 0,
    gap: 0,
    overflow: 'hidden',
  },
  flushTitle: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  title: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
