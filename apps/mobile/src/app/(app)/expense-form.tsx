import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDeleteExpense, useExpense, useSaveExpense, useSaveRecurring } from '@/api/queries';
import type { Expense, PaymentMethod, RecurringFrequency } from '@/api/types';
import { Button } from '@/components/button';
import { CategoryPicker } from '@/components/category-picker';
import { Segmented } from '@/components/choice';
import { HeaderButton } from '@/components/header-button';
import { QueryState } from '@/components/query-state';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dayISO, formatDateTime, useFormatCurrency } from '@/lib/format';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'bKash / Mobile' },
  { value: 'BANK_TRANSFER', label: 'Bank' },
];

type When = 'today' | 'yesterday';
type Repeat = 'NEVER' | RecurringFrequency;

/** Add (`/expense-form`) or open (`/expense-form?id=…`) an expense. */
export default function ExpenseFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const found = useExpense(id);
  if (!id) return <ExpenseForm />;
  if (!found.data) {
    return found.isLoading || found.error ? (
      <QueryState isLoading={found.isLoading} error={found.error} />
    ) : (
      <QueryState emptyTitle="Expense not found" />
    );
  }
  return <ExpenseForm expense={found.data} />;
}

function ExpenseForm({ expense }: { expense?: Expense }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const formatCurrency = useFormatCurrency();
  const save = useSaveExpense();
  const saveRecurring = useSaveRecurring();
  const remove = useDeleteExpense();

  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [categoryId, setCategoryId] = useState<string | null>(expense?.categoryId ?? null);
  const [categoryName, setCategoryName] = useState(expense?.category.name ?? '');
  const [title, setTitle] = useState(expense?.title ?? '');
  const [when, setWhen] = useState<When>('today');
  const [method, setMethod] = useState<PaymentMethod>(expense?.paymentMethod ?? 'CASH');
  const [repeat, setRepeat] = useState<Repeat>('NEVER');
  const [notes, setNotes] = useState(expense?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  // Supplier payments are edited from the supplier so the two never disagree.
  const locked = expense?.source === 'SUPPLIER_PAYMENT';

  const value = Number(amount.replace(/,/g, ''));
  const valid = value > 0 && Number.isFinite(value) && !!categoryId && !locked;
  const saving = save.isPending || saveRecurring.isPending;

  const submit = async () => {
    if (!valid) return;
    setError(null);
    const date = expense && when === 'today' ? expense.date : dayISO(when === 'yesterday' ? -1 : 0);
    const name = title.trim() || categoryName || 'Expense';
    try {
      await save.mutateAsync({
        id: expense?.id,
        amount: value,
        categoryId: categoryId!,
        title: name,
        date,
        paymentMethod: method,
        notes: notes.trim() || undefined,
      });
      if (!expense && repeat !== 'NEVER') {
        // Start the reminder one period after this payment.
        const next = new Date(date);
        if (repeat === 'MONTHLY') next.setMonth(next.getMonth() + 1);
        else next.setDate(next.getDate() + 7);
        await saveRecurring.mutateAsync({
          title: name,
          amount: value,
          categoryId: categoryId!,
          paymentMethod: method,
          frequency: repeat,
          nextDueDate: next.toISOString(),
        });
      }
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: expense ? (locked ? 'Expense' : 'Edit expense') : 'New expense',
          headerRight: expense && !locked ? () => <HeaderButton title="Delete" tone="danger" onPress={confirmDelete} /> : undefined,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }} keyboardShouldPersistTaps="handled">
        {locked ? (
          <View style={{ gap: Spacing.two, alignItems: 'center', paddingVertical: Spacing.three }}>
            <ThemedText type="title">{formatCurrency(expense!.amount)}</ThemedText>
            <ThemedText type="smallBold">{expense!.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatDateTime(expense!.date)} · {expense!.category.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.two }}>
              This is a payment to a supplier, recorded when you received stock or paid them. It’s kept in step
              with the supplier’s balance, so it can’t be edited here.
            </ThemedText>
            <Button title="Open suppliers" variant="secondary" onPress={() => router.push('/more/suppliers')} />
          </View>
        ) : (
          <>
            <View style={{ gap: Spacing.one }}>
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
                style={{ fontSize: 40, fontWeight: 700, color: theme.text, borderBottomWidth: 2, borderColor: theme.border, paddingVertical: Spacing.one }}
              />
            </View>

            <CategoryPicker
              value={categoryId}
              onChange={(id, name) => {
                setCategoryId(id);
                setCategoryName(name);
              }}
            />

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
              placeholder={categoryName || 'e.g. October rent'}
            />

            {!expense && (
              <View style={{ gap: Spacing.two }}>
                <ThemedText type="small" themeColor="textSecondary">
                  Repeat
                </ThemedText>
                <Segmented
                  options={[
                    { value: 'NEVER', label: 'One time' },
                    { value: 'MONTHLY', label: 'Monthly' },
                    { value: 'WEEKLY', label: 'Weekly' },
                  ]}
                  value={repeat}
                  onChange={setRepeat}
                />
                {repeat !== 'NEVER' && (
                  <ThemedText type="caption" themeColor="textSecondary">
                    We’ll remind you when the next one is due, so you can pay it in one tap.
                  </ThemedText>
                )}
              </View>
            )}

            <TextField label="Note (optional)" value={notes} onChangeText={setNotes} placeholder="e.g. receipt no." />
          </>
        )}

        {error && (
          <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        )}
      </ScrollView>

      {!locked && (
        <View
          style={{
            padding: Spacing.three,
            paddingBottom: Spacing.three + Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0),
            borderTopWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.backgroundElement,
          }}>
          <Button title={expense ? 'Save' : 'Add expense'} onPress={submit} loading={saving} disabled={!valid} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
