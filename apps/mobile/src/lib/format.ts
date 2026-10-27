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
