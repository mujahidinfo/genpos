import { useState } from 'react';

import { useCreateExpenseCategory, useExpenseCategories } from '@/api/queries';
import { Chip, ChipGroup } from '@/components/choice';
import { ThemedText } from '@/components/themed-text';

/** Offered until the business has its own categories; created on first use. */
const SUGGESTED = [
  { name: 'Rent', color: '#6366f1' },
  { name: 'Electricity & bills', color: '#f59e0b' },
  { name: 'Internet & phone', color: '#0ea5e9' },
  { name: 'Salary', color: '#10b981' },
  { name: 'Transport', color: '#3b82f6' },
  { name: 'Supplies', color: '#8b5cf6' },
  { name: 'Other', color: '#64748b' },
];

/**
 * Expense category chips. Suggested categories the business doesn't have yet show
 * as "+ Name" and are created the moment they're tapped.
 */
export function CategoryPicker({
  label = 'For',
  value,
  onChange,
}: {
  label?: string;
  value: string | null;
  onChange: (categoryId: string, name: string) => void;
}) {
  const categories = useExpenseCategories();
  const create = useCreateExpenseCategory();
  const [error, setError] = useState<string | null>(null);

  const existing = categories.data ?? [];
  const suggestions = SUGGESTED.filter((s) => !existing.some((c) => c.name.toLowerCase() === s.name.toLowerCase()));

  const pick = async (s: (typeof SUGGESTED)[number]) => {
    setError(null);
    try {
      const created = await create.mutateAsync(s);
      onChange(created.id, created.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the category.');
    }
  };

  return (
    <>
      <ChipGroup label={label}>
        {existing.map((c) => (
          <Chip key={c.id} label={c.name} selected={c.id === value} onPress={() => onChange(c.id, c.name)} />
        ))}
        {suggestions.map((s) => (
          <Chip key={s.name} label={`+ ${s.name}`} selected={false} onPress={() => pick(s)} />
        ))}
      </ChipGroup>
      {error && (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      )}
    </>
  );
}
