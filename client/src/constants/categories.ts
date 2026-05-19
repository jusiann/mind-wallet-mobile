import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const CAT_META: Record<string, { tr: string; icon: IoniconName }> = {
    'Food & Groceries': { tr: 'Market',      icon: 'basket-outline' },
    'Eating Out':       { tr: 'Yemek',       icon: 'restaurant-outline' },
    Transportation:     { tr: 'Ulaşım',      icon: 'car-outline' },
    'Rent & Bills':     { tr: 'Kira',        icon: 'home-outline' },
    Entertainment:      { tr: 'Eğlence',     icon: 'film-outline' },
    Health:             { tr: 'Sağlık',      icon: 'medkit-outline' },
    Clothing:           { tr: 'Giyim',       icon: 'shirt-outline' },
    Education:          { tr: 'Eğitim',      icon: 'school-outline' },
    Subscriptions:      { tr: 'Abonelik',    icon: 'repeat-outline' },
    Other:              { tr: 'Diğer',       icon: 'ellipsis-horizontal-outline' },
    Salary:             { tr: 'Maaş',        icon: 'briefcase-outline' },
    Freelance:          { tr: 'Serbest',     icon: 'laptop-outline' },
    Investment:         { tr: 'Yatırım',     icon: 'trending-up-outline' },
    Gift:               { tr: 'Hediye',      icon: 'gift-outline' },
    'Rental Income':    { tr: 'Kira Geliri', icon: 'business-outline' },
    Cash:               { tr: 'Nakit',       icon: 'cash-outline' },
};

export function translateCat(name: string): string {
    return CAT_META[name]?.tr ?? name;
}
