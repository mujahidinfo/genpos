import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { SalesChartPoint } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CHART_HEIGHT = 120;
const MAX_BAR_WIDTH = 24;

/**
 * Single-series daily revenue columns. Tap a column to read its exact value in
 * the header (the mobile stand-in for a hover tooltip); the latest day is
 * selected by default. One hue, so no legend — the card title names the series.
 */
export function RevenueBars({
  data,
  formatValue,
}: {
  data: SalesChartPoint[];
  formatValue: (n: number) => string;
}) {
  const theme = useTheme();
  const [selected, setSelected] = useState(data.length - 1);
  const max = Math.max(...data.map((d) => d.revenue), 0);
  const point = data[selected] ?? data[data.length - 1];

  if (!point) return null;

  return (
    <View style={styles.container}>
      <View>
        <ThemedText type="caption" themeColor="textSecondary">
          {selected === data.length - 1 ? 'Today' : point.date}
        </ThemedText>
        <ThemedText type="subtitle">{formatValue(point.revenue)}</ThemedText>
      </View>

      <View style={[styles.plot, { borderBottomColor: theme.border }]}>
        {data.map((d, i) => {
          const isSelected = i === selected;
          // Keep zero days visible as a hairline so the baseline reads as data.
          const height = max > 0 ? Math.max((d.revenue / max) * CHART_HEIGHT, 2) : 2;
          return (
            <Pressable
              key={d.date}
              onPress={() => setSelected(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${d.date}: ${formatValue(d.revenue)}`}
              style={styles.slot}>
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: theme.primary,
                    opacity: isSelected ? 1 : 0.45,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.axis}>
        {data.map((d, i) => (
          <ThemedText
            key={d.date}
            type="caption"
            themeColor={i === selected ? 'text' : 'textSecondary'}
            style={styles.tick}
            numberOfLines={1}>
            {/* "Oct 27" → "27": the header carries the full date */}
            {d.date.split(' ')[1] ?? d.date}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  plot: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  slot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    maxWidth: MAX_BAR_WIDTH,
    // Rounded data-end, square at the baseline.
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  axis: {
    flexDirection: 'row',
    gap: 2,
    marginTop: -Spacing.two,
  },
  tick: {
    flex: 1,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
