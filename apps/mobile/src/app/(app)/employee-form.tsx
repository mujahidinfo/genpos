import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePayroll, useSaveEmployee } from '@/api/queries';
import type { PayrollItem } from '@/api/types';
import { Button } from '@/components/button';
import { QueryState } from '@/components/query-state';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Someone on payroll who doesn't sign in: `/employee-form` or `/employee-form?id=…`. */
export default function EmployeeFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const payroll = usePayroll(undefined, !!id);
  if (!id) return <EmployeeForm />;
  const item = payroll.data?.items.find((i) => i.employeeId === id);
  if (!item) return <QueryState isLoading={payroll.isLoading} error={payroll.error} />;
  return <EmployeeForm item={item} />;
}

function EmployeeForm({ item }: { item?: PayrollItem }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const save = useSaveEmployee();

  const [name, setName] = useState(item?.name ?? '');
  const [position, setPosition] = useState(item?.position ?? '');
  const [phone, setPhone] = useState(item?.phone ?? '');
  const [salary, setSalary] = useState(item ? String(item.salary) : '');
  const [payDay, setPayDay] = useState(String(item?.payDay ?? 1));
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const salaryNum = Number(salary.replace(/,/g, ''));
  const dayNum = Number(payDay);
  const valid =
    name.trim().length > 0 &&
    position.trim().length > 0 &&
    salaryNum > 0 &&
    Number.isInteger(dayNum) &&
    dayNum >= 1 &&
    dayNum <= 28;

  const submit = async () => {
    if (!valid) return;
    setError(null);
    try {
      await save.mutateAsync({
        id: item?.employeeId,
        name: name.trim(),
        position: position.trim(),
        phone: phone.trim() || undefined,
        salary: salaryNum,
        salaryType: 'MONTHLY',
        payDay: dayNum,
        ...(item ? { isActive: active } : { joinDate: new Date().toISOString() }),
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }} keyboardShouldPersistTaps="handled">
        <ThemedText type="small" themeColor="textSecondary">
          For people who get a salary but don’t sign in to the app. They’ll show up under Salaries, ready to pay.
        </ThemedText>
        <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" autoFocus={!item} />
        <TextField label="Job" value={position} onChangeText={setPosition} placeholder="e.g. Helper, Driver" autoCapitalize="words" />
        <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextField label="Monthly salary" value={salary} onChangeText={setSalary} keyboardType="decimal-pad" placeholder="0" />
        <TextField
          label="Paid on day of the month (1–28)"
          value={payDay}
          onChangeText={(t) => setPayDay(t.replace(/\D/g, '').slice(0, 2))}
          keyboardType="number-pad"
        />
        {item && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <View style={{ flex: 1 }}>
              <ThemedText>On payroll</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Turn off when they leave. Past salaries stay in your expenses.
              </ThemedText>
            </View>
            <Switch value={active} onValueChange={setActive} trackColor={{ true: theme.primary }} accessibilityLabel="On payroll" />
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
        <Button title={item ? 'Save' : 'Add to payroll'} onPress={submit} loading={save.isPending} disabled={!valid} />
      </View>
    </KeyboardAvoidingView>
  );
}
