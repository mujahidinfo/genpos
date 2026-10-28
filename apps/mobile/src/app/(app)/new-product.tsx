import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCategories, useCreateCategory, useCreateProduct } from '@/api/queries';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { Button } from '@/components/button';
import { Chip, ChipGroup } from '@/components/choice';
import { Icon } from '@/components/icon';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { lineFor, useCart } from '@/lib/cart';
import { pickProductPhoto, uploadProductPhoto, type PhotoSource } from '@/lib/product-photo';

/** Parse a typed amount; "" → undefined, junk → NaN. Accepts "1,250.50". */
const toNumber = (text: string) => (text.trim() === '' ? undefined : Number(text.replace(/,/g, '')));

type Photo =
  | { status: 'none' }
  | { status: 'uploading'; uri: string }
  | { status: 'ready'; uri: string; url: string }
  | { status: 'failed'; uri: string };

/**
 * Add a product. Photo, name, price and stock up front — everything else is
 * optional under "More details".
 *
 *   ?barcode=  prefilled (opened from the scanner for an unknown code)
 *   ?name=     prefilled (opened from an empty search)
 *   ?addToCart=1  saving also adds it to the current sale
 */
export default function NewProductScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ barcode?: string; name?: string; addToCart?: string }>();
  const addToCart = params.addToCart === '1';
  const cart = useCart();
  const createProduct = useCreateProduct();
  const categories = useCategories();
  const createCategory = useCreateCategory();

  const [photo, setPhoto] = useState<Photo>({ status: 'none' });
  const [name, setName] = useState(params.name ?? '');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [cost, setCost] = useState('');
  const [barcode, setBarcode] = useState(params.barcode ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(!!params.barcode);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);
  // Ignore results of an upload the user has since replaced or removed.
  const uploadId = useRef(0);

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
  const uploading = photo.status === 'uploading';

  const upload = async (uri: string) => {
    const id = ++uploadId.current;
    setPhoto({ status: 'uploading', uri });
    try {
      const url = await uploadProductPhoto(uri);
      if (id === uploadId.current) setPhoto({ status: 'ready', uri, url });
    } catch {
      if (id === uploadId.current) setPhoto({ status: 'failed', uri });
    }
  };

  const choosePhoto = async (source: PhotoSource) => {
    try {
      const uri = await pickProductPhoto(source);
      if (uri) void upload(uri);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the photo.');
    }
  };

  const askPhotoSource = () => {
    const removable = photo.status !== 'none';
    if (process.env.EXPO_OS === 'ios') {
      const options = ['Take photo', 'Choose from library', ...(removable ? ['Remove photo'] : []), 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: removable ? 2 : undefined },
        (index) => {
          if (index === 0) void choosePhoto('camera');
          if (index === 1) void choosePhoto('library');
          if (removable && index === 2) removePhoto();
        },
      );
      return;
    }
    Alert.alert('Product photo', undefined, [
      { text: 'Take photo', onPress: () => void choosePhoto('camera') },
      { text: 'Choose from gallery', onPress: () => void choosePhoto('library') },
      removable
        ? { text: 'Remove', style: 'destructive', onPress: removePhoto }
        : { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removePhoto = () => {
    uploadId.current++;
    setPhoto({ status: 'none' });
  };

  const addCategory = async () => {
    const label = newCategory?.trim();
    if (!label) return;
    try {
      const created = await createCategory.mutateAsync({ name: label });
      setCategoryId(created.id);
      setNewCategory(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the category.');
    }
  };

  const reset = () => {
    removePhoto();
    setName('');
    setPrice('');
    setStock('');
    setCost('');
    setBarcode('');
  };

  const save = async (next: 'close' | 'another') => {
    if (!valid || uploading || createProduct.isPending) return;
    setError(null);
    try {
      const product = await createProduct.mutateAsync({
        name: name.trim(),
        price: priceValue!,
        costPrice: costValue,
        barcode: barcode.trim() || undefined,
        stock: stockValue ?? 0,
        categoryId: categoryId ?? undefined,
        imageUrl: photo.status === 'ready' ? photo.url : undefined,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (addToCart) cart.add(lineFor(product, product.variants[0].id));
      if (next === 'another') {
        setSavedCount((n) => n + 1);
        reset();
        nameRef.current?.focus();
      } else {
        router.back();
      }
    } catch (e) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e instanceof Error ? e.message : 'Could not save this product.');
    }
  };

  const saveTitle = uploading ? 'Uploading photo…' : addToCart ? 'Save & add to sale' : 'Save product';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'New product' }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: Spacing.four, gap: Spacing.four }}>
        {savedCount > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Icon name="check" size={16} color={theme.success} />
            <ThemedText type="smallBold" themeColor="success">
              {savedCount} product{savedCount === 1 ? '' : 's'} added — next one
            </ThemedText>
          </View>
        )}

        {/* Photo */}
        <View style={{ alignItems: 'center' }}>
          <PhotoTile photo={photo} onPress={askPhotoSource} onRetry={() => photo.status === 'failed' && upload(photo.uri)} />
        </View>

        {/* Essentials */}
        <TextField
          ref={nameRef}
          label="Product name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Miniket Rice 1kg"
          autoCapitalize="words"
          autoFocus={!!params.barcode || !!params.name}
          returnKeyType="next"
        />
        <View style={{ flexDirection: 'row', gap: Spacing.three }}>
          <View style={{ flex: 3 }}>
            <TextField
              label="Selling price"
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              keyboardType="decimal-pad"
              style={{ fontSize: 20, fontWeight: 700 }}
            />
          </View>
          <View style={{ flex: 2 }}>
            <TextField label="In stock" value={stock} onChangeText={setStock} placeholder="0" keyboardType="number-pad" />
          </View>
        </View>

        {/* Optional */}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: showMore }}
          onPress={() => setShowMore((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one }}>
          <ThemedText type="smallBold" themeColor="primary" style={{ flex: 1 }}>
            {showMore ? 'Fewer details' : 'More details'}
            <ThemedText type="small" themeColor="textSecondary">
              {showMore ? '' : '  ·  cost, barcode, category'}
            </ThemedText>
          </ThemedText>
          <View style={{ transform: [{ rotate: showMore ? '180deg' : '0deg' }] }}>
            <Icon name="chevronDown" size={16} color={theme.primary} />
          </View>
        </Pressable>

        {showMore && (
          <View style={{ gap: Spacing.four }}>
            <TextField label="Cost price" value={cost} onChangeText={setCost} placeholder="What you paid" keyboardType="decimal-pad" />

            {scanning ? (
              <View style={{ gap: Spacing.two }}>
                <BarcodeScanner
                  active
                  height={170}
                  onScan={(code) => {
                    void Haptics.selectionAsync();
                    setBarcode(code);
                    setScanning(false);
                  }}
                />
                <Button title="Cancel scan" variant="secondary" onPress={() => setScanning(false)} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two }}>
                <View style={{ flex: 1 }}>
                  <TextField label="Barcode" value={barcode} onChangeText={setBarcode} placeholder="Optional" keyboardType="number-pad" />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Scan barcode"
                  onPress={() => setScanning(true)}
                  style={({ pressed }) => ({
                    width: 50,
                    height: 50,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: Radius.md,
                    borderCurve: 'continuous',
                    backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
                    borderWidth: 1,
                    borderColor: theme.border,
                  })}>
                  <Icon name="scan" size={22} color={theme.primary} />
                </Pressable>
              </View>
            )}

            <ChipGroup label="Category">
              {(categories.data ?? []).map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  selected={categoryId === c.id}
                  onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
                />
              ))}
              {newCategory === null && <Chip label="+ New" selected={false} onPress={() => setNewCategory('')} />}
            </ChipGroup>
            {newCategory !== null && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="New category"
                    value={newCategory}
                    onChangeText={setNewCategory}
                    placeholder="e.g. Grocery"
                    autoFocus
                    autoCapitalize="words"
                    onSubmitEditing={addCategory}
                  />
                </View>
                <Button
                  title="Add"
                  variant="secondary"
                  onPress={addCategory}
                  loading={createCategory.isPending}
                  disabled={!newCategory.trim()}
                />
              </View>
            )}
          </View>
        )}

        {error && (
          <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite" selectable>
            {error}
          </ThemedText>
        )}
      </ScrollView>

      <View
        style={{
          gap: Spacing.two,
          padding: Spacing.three,
          paddingBottom: Spacing.three + Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0),
          borderTopWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.backgroundElement,
        }}>
        <Button
          title={saveTitle}
          onPress={() => save('close')}
          loading={createProduct.isPending}
          disabled={!valid || uploading}
        />
        {!addToCart && (
          <Button
            title="Save & add another"
            variant="secondary"
            onPress={() => save('another')}
            disabled={!valid || uploading || createProduct.isPending}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

/** Big square photo target. Shows upload progress and a retry on failure. */
function PhotoTile({ photo, onPress, onRetry }: { photo: Photo; onPress: () => void; onRetry: () => void }) {
  const theme = useTheme();
  const size = 156;

  if (photo.status === 'none') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a product photo"
        onPress={onPress}
        style={({ pressed }) => ({
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.two,
          borderRadius: 28,
          borderCurve: 'continuous',
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: `${theme.primary}66`,
          backgroundColor: pressed ? `${theme.primary}1A` : `${theme.primary}0D`,
        })}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.primary,
            boxShadow: `0 6px 16px ${theme.primary}40`,
          }}>
          <Icon name="addPhoto" size={24} color={theme.onPrimary} />
        </View>
        <ThemedText type="smallBold" themeColor="primary">
          Add photo
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={photo.status === 'failed' ? 'Photo upload failed, tap to retry' : 'Change photo'}
        onPress={photo.status === 'failed' ? onRetry : onPress}
        style={{
          width: size,
          height: size,
          borderRadius: 28,
          borderCurve: 'continuous',
          overflow: 'hidden',
          backgroundColor: theme.backgroundSelected,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.14)',
        }}>
        <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        {photo.status !== 'ready' && (
          <View
            style={{
              position: 'absolute',
              inset: 0,
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.one,
              backgroundColor: photo.status === 'failed' ? 'rgba(239, 68, 68, 0.55)' : 'rgba(15, 23, 42, 0.35)',
            }}>
            {photo.status === 'uploading' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText type="smallBold" style={{ color: '#FFFFFF', textAlign: 'center' }}>
                Upload failed{'\n'}Tap to retry
              </ThemedText>
            )}
          </View>
        )}
      </Pressable>
      {/* Change/remove */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Photo options"
        onPress={onPress}
        hitSlop={8}
        style={{
          position: 'absolute',
          right: -6,
          bottom: -6,
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.backgroundElement,
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)',
        }}>
        <Icon name="camera" size={17} color={theme.primary} />
      </Pressable>
    </View>
  );
}
