import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePayRecurring, usePayroll, usePaySalary, useRecurringBills } from '@/api/queries';
import type { PaymentMethod } from '@/api/types';
import { Button } from '@/components/button';
import { Segmented } from '@/components/choice';
import { IconTile, TINT } from '@/components/icon-tile';
import { QueryState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dueLabel, useFormatCurrency } from '@/lib/format';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'bKash / Mobile' },
  { value: 'BANK_TRANSFER', label: 'Bank' },
];

/**
 * `/pay-bill?kind=SALARY&id=<employeeId>` or `?kind=BILL&id=<billId>` —
 * confirm what was paid and how; it is recorded as an expense.
 */
export default function PayBillScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: 'SALARY' | 'BILL'; id: string }>();
  const payroll = usePayroll(undefined, kind === 'SALARY');
  const bills = useRecurringBills();

  if (kind === 'SALARY') {
    if (!payroll.data) return <QueryState isLoading={payroll.isLoading} error={payroll.error} onRetry={payroll.refetch} />;
    const item = payroll.data.items.find((i) => i.employeeId === id);
    if (!item) return <QueryState emptyTitle="Nothing to pay" emptyMessage="This salary is already paid." />;
    return (
      <PayForm
        kind="SALARY"
        id={id}
        title={item.name}
        subtitle={`${payroll.data.label} salary`}
        status={item.state === 'PAID' ? 'Already paid' : dueLabel(daysFromNow(item.dueDate))}
        defaultAmount={item.amount}
        month={payroll.data.month}
        alreadyPaid={item.state === 'PAID'}
      />
    );
  }

  if (!bills.data) return <QueryState isLoading={bills.isLoading} error={bills.error} onRetry={bills.refetch} />;
  const bill = bills.data.find((b) => b.id === id);
  if (!bill) return <QueryState emptyTitle="Bill not found" />;
  return (
    <PayForm
      kind="BILL"
      id={id}
      title={bill.title}
      subtitle={bill.category.name}
      status={dueLabel(bill.daysUntil)}
      defaultAmount={bill.amount}
      defaultMethod={bill.paymentMethod}
    />
  );
}

const daysFromNow = (iso: string) => {
  const due = new Date(iso);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
};

function PayForm({
  kind,
  id,
  title,
  subtitle,
  status,
  defaultAmount,
  defaultMethod = 'CASH',
  month,
  alreadyPaid,
}: {
  kind: 'SALARY' | 'BILL';
  id: string;
  title: string;
  subtitle: string;
  status: string;
  defaultAmount: number;
  defaultMethod?: PaymentMethod;
  month?: string;
  alreadyPaid?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const formatCurrency = useFormatCurrency();
  const paySalary = usePaySalary();
  const payBill = usePayRecurring();

  const [amount, setAmount] = useState(String(defaultAmount));
  const [method, setMethod] = useState<PaymentMethod>(defaultMethod);
  const [error, setError] = useState<string | null>(null);

  const value = Number(amount.replace(/,/g, ''));
  const valid = value > 0 && Number.isFinite(value) && !alreadyPaid;
  const busy = paySalary.isPending || payBill.isPending;
  const changed = valid && Math.abs(value - defaultAmount) > 0.005;

  const submit = async () => {
    if (!valid) return;
    setError(null);
    try {
      if (kind === 'SALARY') await paySalary.mutateAsync({ employeeId: id, amount: value, paymentMethod: method, month });
      else await payBill.mutateAsync({ id, amount: value, paymentMethod: method });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record the payment.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: Spacing.four, gap: Spacing.four }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: Spacing.two }}>
          <IconTile name={kind === 'SALARY' ? 'team' : 'repeat'} tint={kind === 'SALARY' ? TINT.emerald : TINT.violet} size={64} />
          <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
            {title}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{subtitle}</ThemedText>
          <ThemedText type="smallBold" themeColor={status.includes('overdue') ? 'danger' : 'textSecondary'}>
            {status}
          </ThemedText>
        </View>

        <View style={{ gap: Spacing.one }}>
          <ThemedText type="small" themeColor="textSecondary">
            Amount paid
          </ThemedText>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            selectTextOnFocus
            accessibilityLabel="Amount paid"
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: theme.text,
              borderBottomWidth: 2,
              borderColor: theme.border,
              paddingVertical: Spacing.one,
            }}
          />
          {changed && (
            <ThemedText type="caption" themeColor="textSecondary">
              Usually {formatCurrency(defaultAmount)}
            </ThemedText>
          )}
        </View>

        <View style={{ gap: Spacing.two }}>
          <ThemedText type="small" themeColor="textSecondary">
            Paid by
          </ThemedText>
          <Segmented options={METHODS} value={method} onChange={setMethod} />
        </View>

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
        <Button
          title={alreadyPaid ? 'Already paid' : valid ? `Mark ${formatCurrency(value)} as paid` : 'Enter an amount'}
          onPress={submit}
          loading={busy}
          disabled={!valid}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
