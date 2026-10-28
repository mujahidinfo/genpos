import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Platform, Pressable, ScrollView, Switch, View } from 'react-native';

import { useShop, useUpdateShop, type ShopSettingsInput } from '@/api/queries';
import type { Shop } from '@/api/types';
import { Avatar } from '@/components/avatar';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { TINT } from '@/components/icon-tile';
import { QueryState } from '@/components/query-state';
import { SettingGroup, SettingRow } from '@/components/setting-row';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { currencyByCode } from '@/constants/currencies';
import { useTheme } from '@/hooks/use-theme';
import { API_URL } from '@/lib/config';
import {
  AVATAR_WIDTH,
  pickProductPhoto,
  removeAvatarPhoto,
  uploadAvatarPhoto,
  type PhotoSource,
} from '@/lib/product-photo';
import { canManage, ROLE_LABEL } from '@/lib/roles';
import { useActiveShop, useCurrentUser, useSession } from '@/lib/session';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'bn', label: 'বাংলা' },
] as const;

/** You, your shop and its settings. Everyone can look; owners and managers can change. */
export default function ProfileScreen() {
  const theme = useTheme();
  const user = useCurrentUser();
  const active = useActiveShop();
  const { workspaces, signOut, updateUser } = useSession();
  const [photoBusy, setPhotoBusy] = useState(false);
  const shopQuery = useShop();
  const shop = shopQuery.data;
  const update = useUpdateShop();
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  // While editing tax: true = toggle just switched on and not saved yet.
  const [taxDraft, setTaxDraft] = useState(false);

  const manager = canManage(active.role);
  const branchCount = workspaces.reduce((n, w) => n + w.shops.length, 0);

  if (!shop) {
    return <QueryState isLoading={shopQuery.isLoading} error={shopQuery.error} onRetry={shopQuery.refetch} />;
  }

  const save = async (patch: ShopSettingsInput) => {
    setError(null);
    try {
      await update.mutateAsync(patch);
      if (process.env.EXPO_OS === 'ios') void Haptics.selectionAsync();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that change.');
      return false;
    }
  };

  const taxActive = shop.taxRate > 0;
  const taxOn = taxActive || taxDraft;
  const currency = currencyByCode(shop.currency);

  const toggleTax = async (on: boolean) => {
    if (on) return setTaxDraft(true);
    setTaxDraft(false);
    await save({ taxRate: 0 });
  };

  const changePhoto = async (source: PhotoSource) => {
    setError(null);
    try {
      const uri = await pickProductPhoto(source, AVATAR_WIDTH);
      if (!uri) return;
      setPhotoBusy(true);
      updateUser({ avatarUrl: await uploadAvatarPhoto(uri) });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update your photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setError(null);
    setPhotoBusy(true);
    try {
      await removeAvatarPhoto();
      updateUser({ avatarUrl: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove your photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const askPhotoSource = () => {
    if (photoBusy) return;
    const removable = Boolean(user.avatarUrl);
    if (process.env.EXPO_OS === 'ios') {
      const options = ['Take photo', 'Choose from library', ...(removable ? ['Remove photo'] : []), 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: removable ? 2 : undefined },
        (index) => {
          if (index === 0) void changePhoto('camera');
          if (index === 1) void changePhoto('library');
          if (removable && index === 2) void removePhoto();
        },
      );
      return;
    }
    Alert.alert('Profile photo', undefined, [
      { text: 'Take photo', onPress: () => void changePhoto('camera') },
      { text: 'Choose from gallery', onPress: () => void changePhoto('library') },
      ...(removable ? [{ text: 'Remove', style: 'destructive' as const, onPress: () => void removePhoto() }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const confirmSignOut = () => {
    const out = async () => {
      setSigningOut(true);
      await signOut();
    };
    // Alert.alert has no buttons on web.
    if (Platform.OS === 'web') return void out();
    Alert.alert('Sign out?', 'You will need your email and password to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: out },
    ]);
  };

  const editShop = manager ? () => router.push('/shop-form') : undefined;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: Spacing.three, gap: Spacing.four, paddingBottom: Spacing.six }}>
      {/* You */}
      <View style={{ alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          onPress={askPhotoSource}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size={96} />
          {photoBusy && (
            <View
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 48,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.35)',
              }}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
          <View
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.primary,
              borderWidth: 3,
              borderColor: theme.background,
            }}>
            <Icon name="camera" size={14} color={theme.onPrimary} />
          </View>
        </Pressable>
        <ThemedText type="title" style={{ fontSize: 24, lineHeight: 30 }}>
          {user.name}
        </ThemedText>
        <ThemedText themeColor="textSecondary" selectable>
          {user.email}
        </ThemedText>
        <Badge label={ROLE_LABEL[active.role]} tone="primary" />
      </View>

      {/* Shop details */}
      <SettingGroup
        title="Shop"
        footer={manager ? undefined : 'Only owners and managers can change shop details and settings.'}>
        <SettingRow icon="store" tint={TINT.indigo} title="Shop name" value={shop.name} onPress={editShop} />
        <SettingRow icon="phone" tint={TINT.emerald} title="Phone" value={shop.phone || 'Not set'} onPress={editShop} />
        <SettingRow
          icon="pin"
          tint={TINT.rose}
          title="Address"
          subtitle={shop.address || 'Not set'}
          onPress={editShop}
        />
        {(shop.email || manager) && (
          <SettingRow icon="mail" tint={TINT.sky} title="Email" value={shop.email || 'Not set'} onPress={editShop} />
        )}
        {(branchCount > 1 || active.role === 'OWNER') && (
          <SettingRow
            icon="branches"
            tint={TINT.teal}
            title="Branch"
            value={active.name}
            onPress={() => router.push('/branches')}
          />
        )}
      </SettingGroup>

      {/* Settings */}
      <SettingGroup title="Settings">
        <SettingRow
          icon="globe"
          tint={TINT.violet}
          title="Language"
          subtitle="Used for numbers and the web dashboard"
          right={
            manager ? (
              <LanguagePills value={shop.language} disabled={update.isPending} onChange={(language) => save({ language })} />
            ) : undefined
          }
          value={manager ? undefined : (LANGUAGES.find((l) => l.code === shop.language)?.label ?? shop.language)}
        />
        <SettingRow
          icon="currency"
          tint={TINT.amber}
          title="Currency"
          value={currency ? `${currency.code} · ${currency.symbol}` : shop.currency}
          onPress={manager ? () => router.push('/currency') : undefined}
        />
        <SettingRow
          icon="percent"
          tint={TINT.rose}
          title="Tax"
          subtitle={taxActive ? `${shop.taxName} ${shop.taxRate}% is added to every sale` : 'Not added to sales'}
          right={
            <Switch
              value={taxOn}
              onValueChange={toggleTax}
              disabled={!manager || update.isPending}
              trackColor={{ true: theme.primary }}
              accessibilityLabel="Add tax to sales"
            />
          }
        />
        {taxOn && manager && (
          <TaxEditor
            key={`${shop.taxRate}-${shop.taxName}`}
            initialRate={shop.taxRate}
            initialName={shop.taxName}
            saving={update.isPending}
            onSave={async (patch) => {
              if (await save(patch)) setTaxDraft(false);
            }}
          />
        )}
        <SettingRow
          icon="box"
          tint={TINT.sky}
          title="Sell below zero stock"
          subtitle={
            shop.allowNegativeStock
              ? 'Sales are never blocked; recount when stock goes negative'
              : 'Block a sale when there isn’t enough stock'
          }
          right={
            <Switch
              value={shop.allowNegativeStock}
              onValueChange={(allowNegativeStock) => void save({ allowNegativeStock })}
              disabled={!manager || update.isPending}
              trackColor={{ true: theme.primary }}
              accessibilityLabel="Sell below zero stock"
            />
          }
        />
      </SettingGroup>

      {error && (
        <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite" selectable style={{ paddingHorizontal: Spacing.three }}>
          {error}
        </ThemedText>
      )}

      {/* Account */}
      <SettingGroup title="Account">
        <SettingRow icon="lock" tint={TINT.slate} title="Change password" onPress={() => router.push('/change-password')} />
        <SettingRow
          icon="logout"
          tint={theme.danger}
          title={signingOut ? 'Signing out…' : 'Sign out'}
          danger
          onPress={signingOut ? undefined : confirmSignOut}
        />
      </SettingGroup>

      <View style={{ alignItems: 'center', gap: 2 }}>
        <ThemedText type="caption" themeColor="textSecondary">
          GenPOS {Constants.expoConfig?.version ?? ''}
        </ThemedText>
        {__DEV__ && (
          <ThemedText type="caption" themeColor="textSecondary" selectable>
            {API_URL}
          </ThemedText>
        )}
      </View>
    </ScrollView>
  );
}

/** Compact two-way language switch that sits inside a settings row. */
function LanguagePills({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (language: 'en' | 'bn') => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 3,
        borderRadius: Radius.sm + 2,
        borderCurve: 'continuous',
        backgroundColor: theme.backgroundSelected,
        opacity: disabled ? 0.6 : 1,
      }}>
      {LANGUAGES.map((l) => {
        const selected = l.code === value;
        return (
          <Pressable
            key={l.code}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => !selected && onChange(l.code)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: Radius.sm,
              borderCurve: 'continuous',
              backgroundColor: selected ? theme.backgroundElement : 'transparent',
              boxShadow: selected ? '0 1px 2px rgba(15, 23, 42, 0.12)' : undefined,
            }}>
            <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'} style={{ fontSize: 13 }}>
              {l.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Name and rate of the tax, shown under the switch while it is on. */
function TaxEditor({
  initialRate,
  initialName,
  saving,
  onSave,
}: {
  initialRate: number;
  initialName: string;
  saving: boolean;
  onSave: (patch: Pick<Shop, 'taxRate' | 'taxName'>) => void;
}) {
  const [rate, setRate] = useState(initialRate > 0 ? String(initialRate) : '');
  const [name, setName] = useState(initialName);

  const rateValue = Number(rate.replace(/,/g, ''));
  const valid = rate.trim() !== '' && Number.isFinite(rateValue) && rateValue >= 0 && rateValue <= 100 && name.trim().length > 0;
  const dirty = rateValue !== initialRate || name.trim() !== initialName;

  return (
    <View style={{ gap: Spacing.three, padding: Spacing.three }}>
      <View style={{ flexDirection: 'row', gap: Spacing.three }}>
        <View style={{ flex: 2 }}>
          <TextField label="Tax name" value={name} onChangeText={setName} placeholder="VAT" maxLength={30} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField
            label="Rate %"
            value={rate}
            onChangeText={setRate}
            placeholder="5"
            keyboardType="decimal-pad"
            autoFocus={initialRate === 0}
          />
        </View>
      </View>
      <Button
        title={initialRate > 0 ? 'Save tax' : 'Add tax to sales'}
        onPress={() => onSave({ taxRate: rateValue, taxName: name.trim() })}
        loading={saving}
        disabled={!valid || !dirty}
      />
    </View>
  );
}
