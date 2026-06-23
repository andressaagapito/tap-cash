import {
  Banknote,
  Building2,
  Car,
  CreditCard,
  Gift,
  Heart,
  Home,
  Plane,
  ShoppingBag,
  Smartphone,
  Star,
  Wallet,
} from 'lucide-react';

export const DEFAULT_CARD_COLOR = '#3B82F6';
export const DEFAULT_CARD_ICON = 'credit-card';

export const CARD_COLORS = [
  { value: '#3B82F6', labelKey: 'blue' },
  { value: '#6366F1', labelKey: 'indigo' },
  { value: '#8B5CF6', labelKey: 'purple' },
  { value: '#EC4899', labelKey: 'pink' },
  { value: '#EF4444', labelKey: 'red' },
  { value: '#F97316', labelKey: 'orange' },
  { value: '#F59E0B', labelKey: 'amber' },
  { value: '#22C55E', labelKey: 'green' },
  { value: '#14B8A6', labelKey: 'teal' },
  { value: '#06B6D4', labelKey: 'cyan' },
  { value: '#64748B', labelKey: 'slate' },
];

export const CARD_ICONS = [
  { value: 'credit-card', Icon: CreditCard },
  { value: 'wallet', Icon: Wallet },
  { value: 'banknote', Icon: Banknote },
  { value: 'building-2', Icon: Building2 },
  { value: 'shopping-bag', Icon: ShoppingBag },
  { value: 'plane', Icon: Plane },
  { value: 'car', Icon: Car },
  { value: 'home', Icon: Home },
  { value: 'smartphone', Icon: Smartphone },
  { value: 'gift', Icon: Gift },
  { value: 'heart', Icon: Heart },
  { value: 'star', Icon: Star },
];

const ICON_MAP = Object.fromEntries(CARD_ICONS.map(({ value, Icon }) => [value, Icon]));

export function getCardIcon(iconName) {
  return ICON_MAP[iconName] || CreditCard;
}

export function shadeColor(hex, amount = -30) {
  const normalized = hex.replace('#', '');
  const num = parseInt(normalized, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
