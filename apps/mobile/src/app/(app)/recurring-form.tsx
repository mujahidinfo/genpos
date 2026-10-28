import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDeleteRecurring, useRecurringBills, useSaveRecurring } from '@/api/queries';
import type { PaymentMethod, RecurringBill, RecurringFrequency } from '@/api/types';
import { Button } from '@/components/button';
import { CategoryPicker } from '@/components/category-picker';
import { Chip, ChipGroup, Segmented } from '@/components/choice';
import { HeaderButton } from '@/components/header-button';
import { QueryState } from '@/components/query-state';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'bKash / Mobile' },
  { value: 'BANK_TRANSFER', label: 'Bank' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Next date (local noon) whose day-of-month is `day`, today included. */
function nextMonthly(day: number) {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), now.getMonth(), day, 12);
  if (candidate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
    candidate.setMonth(candidate.getMonth() + 1);
  }
  return candidate;
}

/** Next date (local noon) that falls on weekday `weekday` (0 = Sunday), today included. */
function nextWeekly(weekday: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + ((weekday - d.getDay() + 7) % 7));
  return d;
}

const describe = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/** Add (`/recurring-form`) or edit (`/recurring-form?id=…`) a repeating bill. */
export default function RecurringFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const bills = useRecurringBills();
  if (!id) return <RecurringForm />;
  const bill = bills.data?.find((b) => b.id === id);
  if (!bill) return <QueryState isLoading={bills.isLoading} error={bills.error} />;
  return <RecurringForm bill={bill} />;
}

function RecurringForm({ bill }: { bill?: RecurringBill }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const save = useSaveRecurring();
  const remove = useDeleteRecurring();

  const existingDue = bill ? new Date(bill.nextDueDate) : null;
  const [title, setTitle] = useState(bill?.title ?? '');
  const [amount, setAmount] = useState(bill ? String(bill.amount) : '');
  const [categoryId, setCategoryId] = useState<string | null>(bill?.categoryId ?? null);
  const [frequency, setFrequency] = useState<RecurringFrequency>(bill?.frequency ?? 'MONTHLY');
  const [method, setMethod] = useState<PaymentMethod>(bill?.paymentMethod ?? 'CASH');
  const [day, setDay] = useState(String(existingDue?.getDate() ?? new Date().getDate()));
  const [weekday, setWeekday] = useState<number>(existingDue?.getDay() ?? new Date().getDay());
  // Editing keeps the current due date until the day/weekday is touched.
  const [dueTouched, setDueTouched] = useState(!bill);
  const [active, setActive] = useState(bill?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  const value = Number(amount.replace(/,/g, ''));
  const dayNum = Number(day);
  const dayOk = frequency === 'WEEKLY' || (Number.isInteger(dayNum) && dayNum >= 1 && dayNum <= 28);
  const valid = title.trim().length > 0 && value > 0 && Number.isFinite(value) && !!categoryId && dayOk;

  const nextDue = !dueTouched && existingDue ? existingDue : frequency === 'WEEKLY' ? nextWeekly(weekday) : nextMonthly(dayOk ? dayNum : 1);

  const submit = async () => {
    if (!valid) return;
    setError(null);
    try {
      await save.mutateAsync({
        id: bill?.id,
        title: title.trim(),
        amount: value,
        categoryId: categoryId!,
        paymentMethod: method,
        frequency,
        nextDueDate: nextDue.toISOString(),
        ...(bill && { isActive: active }),
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the bill.');
    }
  };

  const confirmDelete = () => {
    if (!bill) return;
    const go = async () => {
      try {
        await remove.mutateAsync(bill.id);
        router.back();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not delete.');
      }
    };
    if (Platform.OS === 'web') return void go();
    Alert.alert('Stop this bill?', 'Past payments stay in your expenses.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: go },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: bill ? 'Edit bill' : 'New bill',
          headerRight: bill ? () => <HeaderButton title="Stop" tone="danger" onPress={confirmDelete} /> : undefined,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: Spacing.one }}>
          <ThemedText type="small" themeColor="textSecondary">
            Amount each time
          </ThemedText>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            autoFocus={!bill}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Amount"
            style={{ fontSize: 40, fontWeight: 700, color: theme.text, borderBottomWidth: 2, borderColor: theme.border, paddingVertical: Spacing.one }}
          />
        </View>

        <TextField label="Bill name" value={title} onChangeText={setTitle} placeholder="e.g. Shop rent" autoCapitalize="sentences" />

        <CategoryPicker value={categoryId} onChange={(id, name) => {
          setCategoryId(id);
          if (!title.trim()) setTitle(name);
        }} />

        <View style={{ gap: Spacing.two }}>
          <ThemedText type="small" themeColor="textSecondary">
            Repeats
          </ThemedText>
          <Segmented
            options={[
              { value: 'MONTHLY', label: 'Every month' },
              { value: 'WEEKLY', label: 'Every week' },
            ]}
            value={frequency}
            onChange={(f) => {
              setFrequency(f);
              setDueTouched(true);
            }}
          />
        </View>

        {frequency === 'MONTHLY' ? (
          <TextField
            label="Due on day of the month (1–28)"
            value={day}
            onChangeText={(t) => {
              setDay(t.replace(/\D/g, '').slice(0, 2));
              setDueTouched(true);
            }}
            keyboardType="number-pad"
          />
        ) : (
          <ChipGroup label="Due every">
            {WEEKDAYS.map((name, i) => (
              <Chip
                key={name}
                label={name}
                selected={weekday === i}
                onPress={() => {
                  setWeekday(i);
                  setDueTouched(true);
                }}
              />
            ))}
          </ChipGroup>
        )}
        <ThemedText type="caption" themeColor="textSecondary">
          Next due: {describe(nextDue)}
        </ThemedText>

        <View style={{ gap: Spacing.two }}>
          <ThemedText type="small" themeColor="textSecondary">
            Usually paid by
          </ThemedText>
          <Segmented options={METHODS} value={method} onChange={setMethod} />
        </View>

        {bill && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <View style={{ flex: 1 }}>
              <ThemedText>Reminders on</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Turn off to pause this bill without deleting it.
              </ThemedText>
            </View>
            <Switch value={active} onValueChange={setActive} trackColor={{ true: theme.primary }} accessibilityLabel="Reminders on" />
          </View>
        )}

        {error && (
          <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        )}
      </ScrollView>

      <View
        style={{
          padding: Spacing.three,
          paddingBottom: Spacing.three + Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0),
          borderTopWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.backgroundElement,
        }}>
        <Button title={bill ? 'Save' : 'Add bill'} onPress={submit} loading={save.isPending} disabled={!valid} />
      </View>
    </KeyboardAvoidingView>
  );
}
