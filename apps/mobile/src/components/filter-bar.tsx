import { ScrollView, View } from 'react-native';

import { Chip } from '@/components/choice';
import { SearchPill } from '@/components/sell/search-pill';
import { Spacing } from '@/constants/theme';

/**
 * Search pill with a row of filter chips under it — the same header Sell uses,
 * shared by the Products and Orders lists. `value: undefined` is the "All" chip.
 */
export function FilterBar<T extends string>({
  search,
  onSearch,
  placeholder,
  chips,
  selected,
  onSelect,
}: {
  search: string;
  onSearch: (text: string) => void;
  placeholder: string;
  chips: { label: string; value?: T }[];
  selected: T | undefined;
  onSelect: (value: T | undefined) => void;
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two }}>
        <SearchPill value={search} onChangeText={onSearch} placeholder={placeholder} />
      </View>
      {chips.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: Spacing.two, paddingHorizontal: Spacing.three, paddingBottom: Spacing.two }}>
          {chips.map((c) => (
            <Chip key={c.label} label={c.label} selected={c.value === selected} onPress={() => onSelect(c.value)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
