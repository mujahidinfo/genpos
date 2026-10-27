import { Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useProduct } from '@/api/queries';
import type { StockMovementType } from '@/api/types';
import { Badge } from '@/components/badge';
import { Card, DetailRow } from '@/components/card';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, totalStock, useFormatCurrency } from '@/lib/format';

const MOVEMENT_LABEL: Record<StockMovementType, string> = {
  IN: 'Stock in',
  OUT: 'Stock out',
  ADJUSTMENT: 'Set to',
  RETURN: 'Returned',
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const formatCurrency = useFormatCurrency();
  const { data: product, isLoading, error, refetch, isRefetching } = useProduct(id);

  if (!product) {
    return <QueryState isLoading={isLoading} error={error} onRetry={refetch} />;
  }

  const variantName = (variantId: string | null) =>
    product.variants.find((v) => v.id === variantId)?.name;

  return (
    <>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={theme.primary} />
        }>
        <View style={styles.hero}>
          <ThemedText type="subtitle">{product.name}</ThemedText>
          {product.category && (
            <ThemedText type="small" themeColor="textSecondary">
              {product.category.name}
            </ThemedText>
          )}
        </View>

        <Card title="Pricing">
          <DetailRow label="Price" value={formatCurrency(product.price)} emphasis />
          <DetailRow label="Cost" value={formatCurrency(product.costPrice)} />
          {product.sku && <DetailRow label="SKU" value={product.sku} />}
          {product.barcode && <DetailRow label="Barcode" value={product.barcode} />}
        </Card>

        {product.variants.length > 0 && (
          <Card title={`Stock · ${totalStock(product.variants)} total`}>
            {product.variants.map((v) => {
              const low = v.stock <= v.lowStock;
              return (
                <View key={v.id} style={styles.variant}>
                  <View style={styles.variantMain}>
                    <ThemedText type="small">{v.name}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {formatCurrency(v.price ?? product.price)} · alert at {v.lowStock}
                    </ThemedText>
                  </View>
                  {low ? (
                    <Badge label={v.stock === 0 ? 'Out' : `${v.stock} left`} tone="danger" />
                  ) : (
                    <ThemedText type="smallBold">{v.stock}</ThemedText>
                  )}
                </View>
              );
            })}
          </Card>
        )}

        {product.description ? (
          <Card title="Description">
            <ThemedText type="small">{product.description}</ThemedText>
          </Card>
        ) : null}

        {product.stockMovements.length > 0 && (
          <Card title="Recent stock activity">
            {product.stockMovements.map((m) => (
              <View key={m.id} style={styles.variant}>
                <View style={styles.variantMain}>
                  <ThemedText type="small">
                    {MOVEMENT_LABEL[m.type]} {m.quantity}
                    {variantName(m.variantId) ? ` · ${variantName(m.variantId)}` : ''}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {[formatDateTime(m.createdAt), m.note].filter(Boolean).join(' · ')}
                  </ThemedText>
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  hero: {
    gap: Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  variant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  variantMain: {
    flex: 1,
    gap: Spacing.half,
  },
});
