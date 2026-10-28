import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { useAddMember, useMembers, useUpdateMember } from '@/api/queries';
import type { Member, Role } from '@/api/types';
import { Button } from '@/components/button';
import { Chip, ChipGroup } from '@/components/choice';
import { QueryState } from '@/components/query-state';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ROLE_LABEL } from '@/lib/roles';
import { useActiveShop, useCurrentUser, useSession } from '@/lib/session';

const ROLES: Role[] = ['CASHIER', 'INVENTORY_MANAGER', 'MANAGER', 'OWNER'];

/** Add a staff member (`/member-form`) or edit one (`/member-form?id=…`). */
export default function MemberFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const members = useMembers();

  if (!id) return <MemberForm />;
  const member = members.data?.find((m) => m.id === id);
  if (!member) return <QueryState isLoading={members.isLoading} error={members.error} />;
  return <MemberForm member={member} />;
}

function MemberForm({ member }: { member?: Member }) {
  const theme = useTheme();
  const me = useCurrentUser();
  const active = useActiveShop();
  const { workspaces } = useSession();
  const addMember = useAddMember();
  const updateMember = useUpdateMember();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(member?.role ?? 'CASHIER');
  const [shopId, setShopId] = useState<string | null>(member?.shopId ?? null);
  const [isActive, setIsActive] = useState(member?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const branches = workspaces.find((w) => w.id === active.businessId)?.shops ?? [];
  // Only owners hand out (or take away) the owner role.
  const roles = active.role === 'OWNER' ? ROLES : ROLES.filter((r) => r !== 'OWNER');
  const isSelf = member?.user.id === me.id;
  const saving = addMember.isPending || updateMember.isPending;
  const valid = member ? true : name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(email.trim());

  const save = async () => {
    setError(null);
    try {
      if (member) {
        await updateMember.mutateAsync({ id: member.id, role, shopId, isActive });
      } else {
        await addMember.mutateAsync({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password || undefined,
          role,
          shopId: shopId ?? undefined,
        });
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {member ? (
          <View>
            <ThemedText type="subtitle">{member.user.name}</ThemedText>
            <ThemedText themeColor="textSecondary">{member.user.email}</ThemedText>
          </View>
        ) : (
          <>
            <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" autoFocus />
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Not needed if they already use GenPOS"
            />
            <ThemedText type="caption" themeColor="textSecondary">
              Share the email and password with them so they can sign in on their phone.
            </ThemedText>
          </>
        )}

        <ChipGroup label="Role">
          {roles.map((r) => (
            <Chip key={r} label={ROLE_LABEL[r]} selected={role === r} onPress={() => setRole(r)} />
          ))}
        </ChipGroup>

        {branches.length > 1 && (
          <ChipGroup label="Works at">
            <Chip label="All branches" selected={shopId === null} onPress={() => setShopId(null)} />
            {branches.map((b) => (
              <Chip key={b.id} label={b.name} selected={shopId === b.id} onPress={() => setShopId(b.id)} />
            ))}
          </ChipGroup>
        )}

        {member && !isSelf && (
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <ThemedText>Can sign in</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Turn off when someone leaves. Their past sales stay on record.
              </ThemedText>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ true: theme.primary }}
              accessibilityLabel="Can sign in"
            />
          </View>
        )}

        {error && (
          <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        )}
        <Button title={member ? 'Save' : 'Add staff member'} onPress={save} loading={saving} disabled={!valid} />
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
