import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateOrder, useCustomerLookup, useFindOrCreateCustomer, useShop } from '@/api/queries';
import type { Order, PaymentMethod } from '@/api/types';
import { Button } from '@/components/button';
import { Card, DetailRow } from '@/components/card';
import { Chip, Segmented } from '@/components/choice';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/lib/cart';
import { formatDateTime, useFormatCurrency } from '@/lib/format';

const round2 = (n: number) => Math.round(n * 100) / 100;

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'bKash / Mobile' },
  { value: 'CARD', label: 'Card' },
];

/** Round-up amounts a customer is likely to hand over. */
function quickCash(total: number) {
  const steps = [10, 50, 100, 500, 1000];
  const options = new Set<number>([total]);
  for (const step of steps) {
    const rounded = Math.ceil(total / step) * step;
    if (rounded > total) options.add(rounded);
  }
  return [...options].slice(0, 4);
}

export default function CheckoutScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const formatCurrency = useFormatCurrency();
  const { data: shop } = useShop();
  const createOrder = useCreateOrder();
  const findOrCreateCustomer = useFindOrCreateCustomer();

  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [cash, setCash] = useState('');
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [discountText, setDiscountText] = useState('');
  const [showCustomer, setShowCustomer] = useState(false);
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Order | null>(null);

  const lookup = useCustomerLookup(showCustomer ? phone : '');
  const knownCustomer = lookup.data ?? null;

  // Same math as the API (orders.service.ts) so the screen and receipt agree.
  const taxRate = shop?.taxRate ?? 0;
  const subtotal = cart.subtotal;
  const discountValue = Number(discountText.replace(/,/g, '')) || 0;
  const discountAmt = round2(
    Math.min(
      discountType === 'percentage' ? subtotal * (Math.min(discountValue, 100) / 100) : discountValue,
      subtotal,
    ),
  );
  const taxAmt = round2((subtotal - discountAmt) * (taxRate / 100));
  const total = round2(subtotal - discountAmt + taxAmt);

  const cashValue = cash.trim() === '' ? undefined : Number(cash.replace(/,/g, ''));
  const change = cashValue !== undefined && !Number.isNaN(cashValue) ? round2(cashValue - total) : null;
  const cashShort = method === 'CASH' && change !== null && change < 0;

  const charge = async () => {
    if (createOrder.isPending || cashShort || cart.lines.length === 0) return;
    setError(null);
    try {
      let customerId = knownCustomer?.id;
      if (!customerId && showCustomer && phone.trim() && customerName.trim()) {
        customerId = (
          await findOrCreateCustomer.mutateAsync({ phone: phone.trim(), name: customerName.trim() })
        ).id;
      }
      const order = await createOrder.mutateAsync({
        items: cart.lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          name: l.variantName ? `${l.name} (${l.variantName})` : l.name,
          sku: l.sku ?? undefined,
          price: l.price,
          quantity: l.quantity,
        })),
        paymentMethod: method,
        amountTendered: method === 'CASH' ? (cashValue ?? total) : undefined,
        ...(discountAmt > 0 && { discountType, discountValue }),
        taxRate,
        customerId,
        status: 'FULFILLED',
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCompleted(order);
    } catch (e) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e instanceof Error ? e.message : 'Could not complete the sale.');
    }
  };

  const newSale = () => {
    cart.clear();
    router.back();
  };

  if (completed) {
    const tendered = completed.amountTendered;
    const changeGiven = tendered !== null ? round2(tendered - completed.total) : null;
    const shareReceipt = () =>
      Share.share({
        message: [
          shop?.businessName ?? shop?.name,
          `${completed.orderNumber} · ${formatDateTime(completed.createdAt)}`,
          '',
          ...completed.items.map((i) => `${i.quantity} × ${i.name}  ${formatCurrency(i.total)}`),
          '',
          completed.discountAmt > 0 ? `Discount  −${formatCurrency(completed.discountAmt)}` : null,
          completed.taxAmt > 0 ? `Tax  ${formatCurrency(completed.taxAmt)}` : null,
          `Total  ${formatCurrency(completed.total)}`,
          tendered !== null ? `Paid  ${formatCurrency(tendered)}` : null,
          changeGiven ? `Change  ${formatCurrency(changeGiven)}` : null,
          '',
          'Thank you!',
        ]
          .filter((l) => l !== null)
          .join('\n'),
      });

    return (
      <View
        style={[
          styles.flex,
          styles.done,
          {
            backgroundColor: theme.background,
            paddingBottom: Spacing.four + Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0),
          },
        ]}>
        <Stack.Screen options={{ title: 'Paid', headerBackVisible: false, gestureEnabled: false }} />
        <View style={[styles.check, { backgroundColor: theme.success }]}>
          <ThemedText style={styles.checkMark}>✓</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {completed.orderNumber}
        </ThemedText>
        <ThemedText type="title">{formatCurrency(completed.total)}</ThemedText>
        {changeGiven !== null && changeGiven > 0 && (
          <View style={[styles.changeBox, { backgroundColor: `${theme.success}1A` }]}>
            <ThemedText type="small" themeColor="textSecondary">
              Give change
            </ThemedText>
            <ThemedText type="subtitle" themeColor="success">
              {formatCurrency(changeGiven)}
            </ThemedText>
          </View>
        )}
        <View style={styles.doneActions}>
          <Button title="New sale" onPress={newSale} />
          <Button title="Share receipt" variant="secondary" onPress={shareReceipt} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Spacing.four }]} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <ThemedText type="small" themeColor="textSecondary">
            {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'} · Total
          </ThemedText>
          <ThemedText style={styles.total} adjustsFontSizeToFit numberOfLines={1}>
            {formatCurrency(total)}
          </ThemedText>
        </View>

        <Segmented options={METHODS} value={method} onChange={setMethod} />

        {method === 'CASH' && (
          <Card>
            <TextField
              label="Cash received"
              value={cash}
              onChangeText={setCash}
              placeholder={String(total)}
              keyboardType="decimal-pad"
            />
            <View style={styles.chips}>
              {quickCash(total).map((amount) => (
                <Chip
                  key={amount}
                  label={amount === total ? 'Exact' : formatCurrency(amount)}
                  selected={cashValue === amount}
                  onPress={() => setCash(String(amount))}
                />
              ))}
            </View>
            {change !== null && (
              <DetailRow
                label={cashShort ? 'Still due' : 'Change'}
                value={formatCurrency(Math.abs(change))}
                emphasis
              />
            )}
          </Card>
        )}

        <Card>
          <DetailRow label="Subtotal" value={formatCurrency(subtotal)} />
          {discountAmt > 0 && <DetailRow label="Discount" value={`−${formatCurrency(discountAmt)}`} />}
          {taxAmt > 0 && (
            <DetailRow label={`${shop?.taxName ?? 'Tax'} (${taxRate}%)`} value={formatCurrency(taxAmt)} />
          )}
          <DetailRow label="Total" value={formatCurrency(total)} emphasis />
        </Card>

        {showDiscount ? (
          <Card title="Discount">
            <Segmented
              options={[
                { value: 'fixed', label: 'Amount' },
                { value: 'percentage', label: 'Percent' },
              ]}
              value={discountType}
              onChange={setDiscountType}
            />
            <TextField
              label={discountType === 'percentage' ? 'Discount %' : 'Discount amount'}
              value={discountText}
              onChangeText={setDiscountText}
              placeholder="0"
              keyboardType="decimal-pad"
              autoFocus
            />
          </Card>
        ) : (
          <Button title="Add discount" variant="secondary" onPress={() => setShowDiscount(true)} />
        )}

        {showCustomer ? (
          <Card title="Customer (optional)">
            <TextField
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="01XXXXXXXXX"
              keyboardType="phone-pad"
              autoFocus
            />
            {knownCustomer ? (
              <ThemedText type="smallBold" themeColor="success">
                ✓ {knownCustomer.name}
              </ThemedText>
            ) : (
              phone.trim().length >= 6 &&
              !lookup.isFetching && (
                <TextField
                  label="New customer name"
                  value={customerName}
                  onChangeText={setCustomerName}
                  autoCapitalize="words"
                />
              )
            )}
          </Card>
        ) : (
          <Button title="Add customer" variant="secondary" onPress={() => setShowCustomer(true)} />
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
          title={`Charge ${formatCurrency(total)}`}
          onPress={charge}
          loading={createOrder.isPending || findOrCreateCustomer.isPending}
          disabled={cashShort || cart.lines.length === 0}
        />
      </View>
    </KeyboardAvoidingView>
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
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  total: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: 700,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  done: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  check: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: 700,
  },
  changeBox: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    marginTop: Spacing.two,
  },
  doneActions: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
});
