import { SymbolView, type AndroidSymbol, type SFSymbol, type SymbolWeight } from 'expo-symbols';
import { PixelRatio, Platform, View, type ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * One icon set per platform: SF Symbols on iOS, Material Symbols on Android/web.
 * Add new icons here so both sides always have a glyph.
 */
export const ICONS = {
  scan: { ios: 'barcode.viewfinder', android: 'barcode_scanner' },
  grid: { ios: 'square.grid.2x2', android: 'grid_view' },
  search: { ios: 'magnifyingglass', android: 'search' },
  clear: { ios: 'xmark.circle.fill', android: 'cancel' },
  close: { ios: 'xmark', android: 'close' },
  plus: { ios: 'plus', android: 'add' },
  minus: { ios: 'minus', android: 'remove' },
  bag: { ios: 'bag.fill', android: 'shopping_bag' },
  camera: { ios: 'camera.fill', android: 'photo_camera' },
  photo: { ios: 'photo.on.rectangle', android: 'image' },
  addPhoto: { ios: 'camera.on.rectangle', android: 'add_a_photo' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more' },
  trash: { ios: 'trash', android: 'delete' },
  check: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  box: { ios: 'shippingbox', android: 'inventory_2' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle' },
  store: { ios: 'storefront.fill', android: 'storefront' },
  truck: { ios: 'box.truck.fill', android: 'local_shipping' },
  money: { ios: 'banknote.fill', android: 'payments' },
  team: { ios: 'person.2.fill', android: 'groups' },
  receive: { ios: 'tray.and.arrow.down.fill', android: 'move_to_inbox' },
  reorder: { ios: 'cart.badge.plus', android: 'add_shopping_cart' },
  branches: { ios: 'building.2.fill', android: 'apartment' },
  globe: { ios: 'globe', android: 'language' },
  currency: { ios: 'coloncurrencysign.circle.fill', android: 'currency_exchange' },
  percent: { ios: 'percent', android: 'percent' },
  lock: { ios: 'lock.fill', android: 'lock' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  phone: { ios: 'phone.fill', android: 'call' },
  pin: { ios: 'mappin.and.ellipse', android: 'location_on' },
  mail: { ios: 'envelope.fill', android: 'mail' },
  edit: { ios: 'pencil', android: 'edit' },
  info: { ios: 'info.circle.fill', android: 'info' },
  tick: { ios: 'checkmark', android: 'check' },
  receipt: { ios: 'receipt.fill', android: 'receipt_long' },
  alert: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  trend: { ios: 'chart.line.uptrend.xyaxis', android: 'trending_up' },
  star: { ios: 'star.fill', android: 'star' },
  tag: { ios: 'tag.fill', android: 'sell' },
  calendar: { ios: 'calendar', android: 'calendar_month' },
  repeat: { ios: 'arrow.triangle.2.circlepath', android: 'autorenew' },
  wallet: { ios: 'wallet.pass.fill', android: 'account_balance_wallet' },
  personAdd: { ios: 'person.badge.plus', android: 'person_add' },
  arrowUp: { ios: 'arrow.up.right', android: 'north_east' },
  arrowDown: { ios: 'arrow.down.left', android: 'south_west' },
  history: { ios: 'clock.arrow.circlepath', android: 'history' },
} as const satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 20,
  color,
  weight = 'medium',
}: {
  name: IconName;
  size?: number;
  color?: ColorValue;
  weight?: SymbolWeight;
}) {
  const theme = useTheme();
  const { ios, android } = ICONS[name];

  // On Android the symbol is a font glyph inside a fixed size×size box, and RN
  // scales its text with the system font size. With a larger font/display size
  // the glyph outgrows the box and spills down-right, so it sits off-centre in
  // every rounded tile. expo-symbols has no allowFontScaling switch, so shrink
  // the box by the font scale (glyph = box × scale = size again) and shift it
  // back so it stays centred on the requested size.
  const fontScale = Platform.OS === 'android' ? PixelRatio.getFontScale() : 1;
  const box = fontScale === 1 ? size : size / fontScale;
  const shift = (box - size) / 2;

  const symbol = (
    <SymbolView
      name={{ ios, android, web: android }}
      size={box}
      weight={weight}
      tintColor={(color ?? theme.text) as string}
      resizeMode="scaleAspectFit"
    />
  );
  if (fontScale === 1) return symbol;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ transform: [{ translateX: shift }, { translateY: shift }] }}>{symbol}</View>
    </View>
  );
}
