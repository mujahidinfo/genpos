import { useShop } from '@/api/queries';

/**
 * Same locale rule as apps/web (lib/currency-context.tsx): Bangla shops get bn-BD
 * so BDT renders as ৳, with `-u-nu-latn` forcing Western digits at the till.
 */
function localeFor(language: string | undefined) {
  return language === 'bn' ? 'bn-BD-u-nu-latn' : 'en-US';
}

function makeFormatter(locale: string, currency: string) {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency });
  } catch {
    // Engines without full ICU data may reject the locale extension.
    return new Intl.NumberFormat('en-US', { style: 'currency', currency });
  }
}

/** Exact money formatting for the shop's currency. */
export function useFormatCurrency() {
  const { data: shop } = useShop();
  const formatter = makeFormatter(localeFor(shop?.language), shop?.currency ?? 'BDT');
  return (amount: number) => formatter.format(amount);
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  if (date.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return formatDateTime(iso);
}

export const totalStock = (variants: { stock: number }[]) =>
  variants.reduce((sum, v) => sum + v.stock, 0);

export const isLowStock = (variants: { stock: number; lowStock: number }[]) =>
  variants.some((v) => v.stock <= v.lowStock);

/** "Today", "Yesterday" or "Mon, 27 Oct" — for headings that group a list by day. */
export function formatDayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "Due today", "Due in 3 days", "2 days overdue" from a day count (negative = overdue). */
export function dueLabel(daysUntil: number) {
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return 'Due tomorrow';
  if (daysUntil > 1) return `Due in ${daysUntil} days`;
  const late = -daysUntil;
  return `${late} day${late === 1 ? '' : 's'} overdue`;
}

/** Local noon on the given offset from today, as ISO — noon so the date never shifts across time zones. */
export function dayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}
