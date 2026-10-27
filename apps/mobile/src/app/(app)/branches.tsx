import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAddShop } from '@/api/queries';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/lib/cart';
import { ROLE_LABEL } from '@/lib/roles';
import { useActiveShop, useSession } from '@/lib/session';

/** Switch between branches (and businesses); owners can open a new branch. */
export default function BranchesScreen() {
  const theme = useTheme();
  const { workspaces, switchShop, refreshWorkspaces } = useSession();
  const active = useActiveShop();
  const cart = useCart();
  const addShop = useAddShop();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isOwner = workspaces.find((w) => w.id === active.businessId)?.role === 'OWNER';

  const choose = async (shopId: string) => {
    if (shopId !== active.id) {
      // A sale belongs to one branch; don't carry a half-built cart across.
      cart.clear();
      await switchShop(shopId);
      void Haptics.selectionAsync();
    }
    router.back();
  };

  const create = async () => {
    setError(null);
    try {
      await addShop.mutateAsync({ name: name.trim(), phone: phone.trim() || undefined });
      await refreshWorkspaces();
      setAdding(false);
      setName('');
      setPhone('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the branch.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {workspaces.map((business) => (
          <Card key={business.id} title={`${business.name} · ${ROLE_LABEL[business.role]}`}>
            {business.shops.map((s) => {
              const selected = s.id === active.id;
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => choose(s.id)}
                  style={({ pressed }) => [
                    styles.shop,
                    { borderColor: selected ? theme.primary : theme.border },
                    pressed && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <View style={styles.flex}>
                    <ThemedText type="smallBold">{s.name}</ThemedText>
                    {s.address && (
                      <ThemedText type="caption" themeColor="textSecondary">
                        {s.address}
                      </ThemedText>
                    )}
                  </View>
                  {selected && (
                    <ThemedText type="smallBold" themeColor="primary">
                      Current
                    </ThemedText>
                  )}
                </Pressable>
              );
            })}
          </Card>
        ))}

        {isOwner &&
          (adding ? (
            <Card title="New branch">
              <TextField
                label="Branch name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Mirpur outlet"
                autoFocus
                autoCapitalize="words"
              />
              <TextField
                label="Phone (optional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <ThemedText type="caption" themeColor="textSecondary">
                Shares your products and customers. Stock and sales are tracked separately.
              </ThemedText>
              {error && (
                <ThemedText type="small" themeColor="danger">
                  {error}
                </ThemedText>
              )}
              <Button
                title="Add branch"
                onPress={create}
                loading={addShop.isPending}
                disabled={!name.trim()}
              />
              <Button title="Cancel" variant="secondary" onPress={() => setAdding(false)} />
            </Card>
          ) : (
            <Button title="Add a branch" variant="secondary" onPress={() => setAdding(true)} />
          ))}
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
  shop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 56,
  },
});
