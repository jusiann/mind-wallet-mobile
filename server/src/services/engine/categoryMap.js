export const CATEGORY_TR = {
    'Food & Groceries': 'Yemek & Market',
    'Eating Out':       'Dışarıda Yemek',
    'Transportation':   'Ulaşım',
    'Rent & Bills':     'Kira & Faturalar',
    'Entertainment':    'Eğlence',
    'Health':           'Sağlık',
    'Clothing':         'Giyim',
    'Education':        'Eğitim',
    'Subscriptions':    'Abonelikler',
    'Other':            'Diğer',
    'Salary':           'Maaş',
    'Freelance':        'Serbest Çalışma',
    'Investment':       'Yatırım',
    'Gift':             'Hediye',
    'Rental Income':    'Kira Geliri',
    'Cash':             'Nakit',
};

export const toTR = (name) => CATEGORY_TR[name] ?? name;
