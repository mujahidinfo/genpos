import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useCreateExpenseCategory,
  useDeleteExpense,
  useExpenseCategories,
  useExpenses,
  useSaveExpense,
} from '@/api/queries';
import type { Expense, PaymentMethod } from '@/api/types';
import { Button } from '@/components/button';
import { Chip, ChipGroup, Segmented } from '@/components/choice';
import { HeaderButton } from '@/components/header-button';
import { QueryState } from '@/components/query-state';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Offered until the business has its own categories; created on first use. */
const SUGGESTED = [
  { name: 'Rent', color: '#6366f1' },
  { name: 'Electricity & bills', color: '#f59e0b' },
  { name: 'Salary', color: '#10b981' },
  { name: 'Transport', color: '#3b82f6' },
  { name: 'Supplies', color: '#8b5cf6' },
  { name: 'Other', color: '#64748b' },
];

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'bKash / Mobile' },
  { value: 'BANK_TRANSFER', label: 'Bank' },
];

type When = 'today' | 'yesterday';

/** Midday so the date never shifts across time zones. */
const dayISO = (when: When) => {
  const d = new Date();
  if (when === 'yesterday') d.setDate(d.getDate() - 1);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};

/** Add (`/expense-form`) or edit (`/expense-form?id=…`) an expense. */
export default function ExpenseFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const list = useExpenses();
  if (!id) return <ExpenseForm />;
  const expense = list.data?.pages.flatMap((p) => p.items).find((e) => e.id === id);
  if (!expense) return <QueryState isLoading={list.isLoading} error={list.error} />;
  return <ExpenseForm expense={expense} />;
}

function ExpenseForm({ expense }: { expense?: Expense }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const categories = useExpenseCategories();
  const createCategory = useCreateExpenseCategory();
  const save = useSaveExpense();
  const remove = useDeleteExpense();

  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [categoryId, setCategoryId] = useState<string | null>(expense?.categoryId ?? null);
  const [title, setTitle] = useState(expense?.title ?? '');
  const [when, setWhen] = useState<When>('today');
  const [method, setMethod] = useState<PaymentMethod>(expense?.paymentMethod ?? 'CASH');
  const [notes, setNotes] = useState(expense?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const existing = categories.data ?? [];
  // Suggestions the business hasn't created yet.
  const suggestions = SUGGESTED.filter((s) => !existing.some((c) => c.name.toLowerCase() === s.name.toLowerCase()));
  const selected = existing.find((c) => c.id === categoryId);

  const value = Number(amount.replace(/,/g, ''));
  const valid = value > 0 && Number.isFinite(value) && !!categoryId;
  const saving = save.isPending || createCategory.isPending;

  const pickSuggestion = async (s: (typeof SUGGESTED)[number]) => {
    try {
      const created = await createCategory.mutateAsync(s);
      setCategoryId(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the category.');
    }
  };

  const submit = async () => {
    if (!valid) return;
    setError(null);
    try {
      await save.mutateAsync({
        id: expense?.id,
        amount: value,
        categoryId: categoryId!,
        // A title is required; the category name is a fine default.
        title: title.trim() || selected?.name || 'Expense',
        // Editing keeps the original date unless the user picks one.
        date: expense && when === 'today' ? expense.date : dayISO(when),
        paymentMethod: method,
        notes: notes.trim() || undefined,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the expense.');
    }
  };

  const confirmDelete = () => {
    if (!expense) return;
    const doDelete = async () => {
      try {
        await remove.mutateAsync(expense.id);
        router.back();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not delete.');
      }
    };
    if (Platform.OS === 'web') return void doDelete();
    Alert.alert('Delete this expense?', `${expense.title} will be removed.`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: expense ? 'Edit expense' : 'New expense',
          headerRight: expense ? () => <HeaderButton title="Delete" tone="danger" onPress={confirmDelete} /> : undefined,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.amountWrap}>
          <ThemedText type="small" themeColor="textSecondary">
            Amount
          </ThemedText>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            autoFocus={!expense}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Amount"
            style={[styles.amount, { color: theme.text, borderColor: theme.border }]}
          />
        </View>

        <ChipGroup label="For">
          {existing.map((c) => (
            <Chip key={c.id} label={c.name} selected={c.id === categoryId} onPress={() => setCategoryId(c.id)} />
          ))}
          {suggestions.map((s) => (
            <Chip key={s.name} label={`+ ${s.name}`} selected={false} onPress={() => pickSuggestion(s)} />
          ))}
        </ChipGroup>

        <Segmented
          options={[
            { value: 'today', label: expense ? 'Keep date' : 'Today' },
            { value: 'yesterday', label: 'Yesterday' },
          ]}
          value={when}
          onChange={setWhen}
        />

        <Segmented options={METHODS} value={method} onChange={setMethod} />

        <TextField
          label="What was it? (optional)"
          value={title}
          onChangeText={setTitle}
          placeholder={selected?.name ?? 'e.g. October rent'}
        />
        <TextField label="Note (optional)" value={notes} onChangeText={setNotes} placeholder="e.g. receipt no." />

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
        <Button title={expense ? 'Save' : 'Add expense'} onPress={submit} loading={saving} disabled={!valid} />
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
  amountWrap: {
    gap: Spacing.one,
  },
  amount: {
    fontSize: 40,
    fontWeight: 700,
    borderBottomWidth: 2,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.one,
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
