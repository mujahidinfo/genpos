import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useCreateProduct } from '@/api/queries';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { lineFor, useCart } from '@/lib/cart';

/** Parse a typed amount; "" → undefined, junk → NaN. Accepts "1,250.50". */
const toNumber = (text: string) => (text.trim() === '' ? undefined : Number(text.replace(/,/g, '')));

/**
 * Quick-add a product. Opened by the scanner for an unknown barcode
 * (`addToCart=1`: save also puts it in the sale), or from the Products tab to
 * import stock shelf by shelf ("Save & scan next").
 */
export default function NewProductScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ barcode?: string; addToCart?: string }>();
  const addToCart = params.addToCart === '1';
  const cart = useCart();
  const createProduct = useCreateProduct();

  const [barcode, setBarcode] = useState(params.barcode ?? '');
  const [scanning, setScanning] = useState(!params.barcode && !addToCart);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);

  const priceValue = toNumber(price);
  const costValue = toNumber(cost);
  const stockValue = toNumber(stock);
  const valid =
    name.trim().length > 0 &&
    priceValue !== undefined &&
    !Number.isNaN(priceValue) &&
    priceValue >= 0 &&
    (costValue === undefined || (!Number.isNaN(costValue) && costValue >= 0)) &&
    (stockValue === undefined || Number.isInteger(stockValue));

  const reset = () => {
    setBarcode('');
    setName('');
    setPrice('');
    setCost('');
    setStock('');
    setScanning(true);
  };

  const save = async (next: 'close' | 'another') => {
    if (!valid || createProduct.isPending) return;
    setError(null);
    try {
      const product = await createProduct.mutateAsync({
        name: name.trim(),
        price: priceValue!,
        costPrice: costValue,
        barcode: barcode.trim() || undefined,
        stock: stockValue ?? 0,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (addToCart) cart.add(lineFor(product, product.variants[0].id));
      if (next === 'another') {
        setSavedCount((n) => n + 1);
        reset();
      } else {
        router.back();
      }
    } catch (e) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e instanceof Error ? e.message : 'Could not save this product.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {addToCart && (
          <ThemedText themeColor="textSecondary">
            This barcode isn’t in your products yet. Add it once and it scans straight into the cart from now on.
          </ThemedText>
        )}
        {savedCount > 0 && (
          <ThemedText type="smallBold" themeColor="success">
            ✓ {savedCount} product{savedCount === 1 ? '' : 's'} added. Scan the next one.
          </ThemedText>
        )}

        {scanning ? (
          <View style={styles.scanner}>
            <BarcodeScanner
              active
              height={180}
              onScan={(code) => {
                void Haptics.selectionAsync();
                setBarcode(code);
                setScanning(false);
                // Barcode captured: go straight to the name.
                setTimeout(() => nameRef.current?.focus(), 50);
              }}
            />
            <Button title="No barcode — skip" variant="secondary" onPress={() => setScanning(false)} />
          </View>
        ) : (
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField
                label="Barcode"
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Optional"
                keyboardType="number-pad"
              />
            </View>
            <Button title="Scan" variant="secondary" style={styles.scanButton} onPress={() => setScanning(true)} />
          </View>
        )}

        <TextField
          ref={nameRef}
          label="Product name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Mojo 250ml"
          autoFocus={!!params.barcode}
          autoCapitalize="words"
          returnKeyType="next"
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label="Selling price"
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label="Cost price (optional)"
              value={cost}
              onChangeText={setCost}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <TextField
          label="Stock on hand"
          value={stock}
          onChangeText={setStock}
          placeholder="0"
          keyboardType="number-pad"
        />

        {error && (
          <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        )}

        <Button
          title={addToCart ? 'Save & add to sale' : 'Save'}
          onPress={() => save('close')}
          loading={createProduct.isPending}
          disabled={!valid}
        />
        {!addToCart && (
          <Button
            title="Save & scan next"
            variant="secondary"
            onPress={() => save('another')}
            disabled={!valid || createProduct.isPending}
          />
        )}
      </ScrollView>
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
  scanner: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
  },
  scanButton: {
    minWidth: 88,
  },
});
