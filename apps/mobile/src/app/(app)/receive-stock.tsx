import * as Haptics from 'expo-haptics';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentProps } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { findByBarcode, useCreatePurchase, useProducts, useSuppliers } from '@/api/queries';
import type { Product } from '@/api/types';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip, ChipGroup, Segmented } from '@/components/choice';
import { HeaderButton } from '@/components/header-button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api-client';
import { useFormatCurrency } from '@/lib/format';

type Line = {
  variantId: string;
  productId: string;
  name: string;
  quantity: string;
  unitCost: string;
};

type Payment = 'full' | 'later' | 'part';

const toNumber = (text: string) => Number(text.replace(/,/g, ''));

/**
 * Receive a delivery into the active branch: scan or search each item, set the
 * quantity and what it cost, and record how much the supplier was paid.
 */
export default function ReceiveStockScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const formatCurrency = useFormatCurrency();
  const params = useLocalSearchParams<{ supplierId?: string }>();
  const suppliers = useSuppliers();
  const createPurchase = useCreatePurchase();

  const [supplierId, setSupplierId] = useState<string | null>(params.supplierId ?? null);
  const [lines, setLines] = useState<Line[]>([]);
  const [scanning, setScanning] = useState(true);
  const [search, setSearch] = useState('');
  const [pickVariantOf, setPickVariantOf] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment>('full');
  const [partAmount, setPartAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const debounced = useDebouncedValue(search.trim(), 250);
  const results = useProducts(debounced);
  const matches = debounced ? (results.data?.pages[0]?.items.slice(0, 6) ?? []) : [];

  const total = lines.reduce((sum, l) => sum + (toNumber(l.quantity) || 0) * (toNumber(l.unitCost) || 0), 0);
  const linesValid =
    lines.length > 0 &&
    lines.every((l) => Number.isInteger(toNumber(l.quantity)) && toNumber(l.quantity) > 0 && toNumber(l.unitCost) >= 0);
  const paidAmount = !supplierId ? 0 : payment === 'full' ? total : payment === 'later' ? 0 : toNumber(partAmount) || 0;
  const paymentValid = payment !== 'part' || (paidAmount >= 0 && paidAmount <= total);

  const addVariant = (product: Product, variantId: string) => {
    const variant = product.variants.find((v) => v.id === variantId)!;
    setLines((current) => {
      const existing = current.find((l) => l.variantId === variantId);
      if (existing) {
        return current.map((l) =>
          l === existing ? { ...l, quantity: String((toNumber(l.quantity) || 0) + 1) } : l,
        );
      }
      return [
        {
          variantId,
          productId: product.id,
          name: variant.isDefault ? product.name : `${product.name} (${variant.name})`,
          quantity: '1',
          // Start from the last known cost; usually unchanged.
          unitCost: String(product.costPrice || ''),
        },
        ...current,
      ];
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const addProduct = (product: Product, matchedVariantId?: string | null) => {
    setNotFound(null);
    const variantId =
      matchedVariantId ?? (product.variants.length === 1 ? product.variants[0].id : null);
    if (variantId) addVariant(product, variantId);
    else setPickVariantOf(product);
  };

  const onScan = async (code: string) => {
    if (busy.current || pickVariantOf) return;
    busy.current = true;
    try {
      const product = await findByBarcode(code);
      if (product) addProduct(product, product.matchedVariantId);
      else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setNotFound(code);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Couldn’t look that up.');
    } finally {
      busy.current = false;
    }
  };

  const updateLine = (variantId: string, patch: Partial<Line>) =>
    setLines((current) => current.map((l) => (l.variantId === variantId ? { ...l, ...patch } : l)));

  const save = async () => {
    setError(null);
    try {
      await createPurchase.mutateAsync({
        supplierId: supplierId ?? undefined,
        items: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          quantity: toNumber(l.quantity),
          unitCost: toNumber(l.unitCost) || 0,
        })),
        paidAmount: Math.round(paidAmount * 100) / 100,
        paymentMethod: 'CASH',
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the delivery.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ChipGroup label="From supplier">
          <Chip label="No supplier" selected={supplierId === null} onPress={() => setSupplierId(null)} />
          {(suppliers.data ?? []).map((s) => (
            <Chip key={s.id} label={s.name} selected={supplierId === s.id} onPress={() => setSupplierId(s.id)} />
          ))}
          <Chip label="+ New" selected={false} onPress={() => router.push('/supplier-form')} />
        </ChipGroup>

        {scanning ? (
          <View style={styles.gap}>
            <BarcodeScanner active={isFocused && !pickVariantOf} height={170} onScan={onScan} />
            <HeaderButton title="Hide camera" onPress={() => setScanning(false)} />
          </View>
        ) : (
          <Button title="Scan items" variant="secondary" onPress={() => setScanning(true)} />
        )}

        {notFound && (
          <Card>
            <ThemedText type="smallBold">{notFound} isn’t in your products</ThemedText>
            <Button
              title="Add it as a new product"
              variant="secondary"
              onPress={() => {
                setNotFound(null);
                router.push({ pathname: '/new-product', params: { barcode: notFound } });
              }}
            />
          </Card>
        )}

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="…or search products by name"
          placeholderTextColor={theme.textSecondary}
          style={[styles.search, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        />
        {matches.length > 0 && (
          <Card>
            {matches.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                onPress={() => {
                  addProduct(p);
                  setSearch('');
                }}
                style={({ pressed }) => [styles.match, pressed && { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText style={styles.flex} numberOfLines={1}>
                  {p.name}
                </ThemedText>
                <ThemedText type="smallBold" themeColor="primary">
                  Add
                </ThemedText>
              </Pressable>
            ))}
          </Card>
        )}

        {pickVariantOf && (
          <Card title={`Which ${pickVariantOf.name}?`}>
            <ChipGroup>
              {pickVariantOf.variants.map((v) => (
                <Chip
                  key={v.id}
                  label={v.name}
                  selected={false}
                  onPress={() => {
                    addVariant(pickVariantOf, v.id);
                    setPickVariantOf(null);
                  }}
                />
              ))}
            </ChipGroup>
          </Card>
        )}

        {lines.length > 0 && (
          <Card title={`${lines.length} item${lines.length === 1 ? '' : 's'}`}>
            {lines.map((l) => (
              <View key={l.variantId} style={[styles.line, { borderColor: theme.border }]}>
                <View style={styles.lineHeader}>
                  <ThemedText style={styles.flex} numberOfLines={2}>
                    {l.name}
                  </ThemedText>
                  <HeaderButton
                    title="Remove"
                    tone="danger"
                    onPress={() => setLines((current) => current.filter((x) => x !== l))}
                  />
                </View>
                <View style={styles.lineInputs}>
                  <LabeledInput
                    label="Qty"
                    value={l.quantity}
                    onChangeText={(quantity) => updateLine(l.variantId, { quantity })}
                    keyboardType="number-pad"
                  />
                  <LabeledInput
                    label="Cost each"
                    value={l.unitCost}
                    onChangeText={(unitCost) => updateLine(l.variantId, { unitCost })}
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.lineTotal}>
                    <ThemedText type="caption" themeColor="textSecondary">
                      Total
                    </ThemedText>
                    <ThemedText type="smallBold">
                      {formatCurrency((toNumber(l.quantity) || 0) * (toNumber(l.unitCost) || 0))}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        )}

        {lines.length > 0 && supplierId && (
          <Card title="Payment to supplier">
            <Segmented
              options={[
                { value: 'full', label: 'Paid in full' },
                { value: 'part', label: 'Part paid' },
                { value: 'later', label: 'Pay later' },
              ]}
              value={payment}
              onChange={setPayment}
            />
            {payment === 'part' && (
              <LabeledInput label="Amount paid now" value={partAmount} onChangeText={setPartAmount} keyboardType="decimal-pad" />
            )}
            {payment !== 'full' && (
              <ThemedText type="small" themeColor="textSecondary">
                {formatCurrency(Math.max(total - paidAmount, 0))} will be added to what you owe.
              </ThemedText>
            )}
          </Card>
        )}

        {error && (
          <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            paddingBottom: Spacing.three + Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0),
          },
        ]}>
        <Button
          title={lines.length ? `Receive ${formatCurrency(total)}` : 'Scan or search items to receive'}
          onPress={save}
          loading={createPurchase.isPending}
          disabled={!linesValid || !paymentValid}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function LabeledInput({
  label,
  ...props
}: { label: string } & ComponentProps<typeof TextInput>) {
  const theme = useTheme();
  return (
    <View style={styles.flex}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        selectTextOnFocus
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  gap: {
    gap: Spacing.one,
    alignItems: 'center',
  },
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  match: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  line: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  lineInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
  },
  lineTotal: {
    flex: 1,
    alignItems: 'flex-end',
    paddingBottom: Spacing.two,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    fontSize: 16,
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
