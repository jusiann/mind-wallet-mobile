INSERT INTO categories (name, is_essential, applicable_to) VALUES
    ('Food & Groceries', true, 'EXPENSE'),
    ('Eating Out', false, 'EXPENSE'),
    ('Transportation', true, 'EXPENSE'),
    ('Rent & Bills', true, 'EXPENSE'),
    ('Entertainment', false, 'EXPENSE'),
    ('Health', true, 'EXPENSE'),
    ('Clothing', false, 'EXPENSE'),
    ('Education', true, 'EXPENSE'),
    ('Subscriptions', false, 'EXPENSE'),
    ('Other', false, 'EXPENSE'),
    ('Salary', true, 'INCOME'),
    ('Freelance', false, 'INCOME'),
    ('Investment', false, 'INCOME'),
    ('Gift', false, 'INCOME'),
    ('Rental Income', true, 'INCOME'),
    ('Cash', false, 'INCOME')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (name, email, password, pin_hash, total_balance, monthly_income)
VALUES ('Adil Efe', 'adilefe257@gmail.com', '$2b$10$JDZTYu8pwIz8P6AmzBMpr.cwBCZY6QKdSmaOu41L/FUGkRa795RUm', '$2b$10$0pzk/HIsoCe5w1LFSosVCuZjNou4bDwdfBhS72rTbplJBcJWdo8he', 11991.00, 15000.00)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, pin_hash = EXCLUDED.pin_hash;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM goals WHERE user_id = 1) THEN
        INSERT INTO goals (user_id, title, target_amount, current_amount, deadline, status) VALUES
            (1, 'Laptop Fonu', 30000.00, 2500.00, '2026-12-01', 'ACTIVE'),
            (1, 'Yaz Tatili', 12000.00, 800.00, '2026-09-15', 'ACTIVE');
    END IF;
END $$;

-- ══════════════════════════════════════════════════════════
--  Haziran 2026 (geçen ay) — baseline spending data
-- ══════════════════════════════════════════════════════════
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 1 AND DATE_TRUNC('month', transaction_timestamp) = '2026-06-01') THEN
        INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_timestamp) VALUES
            (1, 11, 15000.00, 'INCOME', 'Haziran maaşı',                '2026-06-01 09:00:00'),
            (1, 4,  2500.00, 'EXPENSE', 'Haziran kirası',               '2026-06-02 08:00:00'),
            (1, 1,  750.00,  'EXPENSE', 'Haftalık market alışverişi',   '2026-06-04 11:00:00'),
            (1, 9,  89.00,   'EXPENSE', 'Spotify + Netflix',            '2026-06-05 10:00:00'),
            (1, 3,  160.00,  'EXPENSE', 'İstanbulkart yükleme',         '2026-06-07 09:00:00'),
            (1, 2,  280.00,  'EXPENSE', 'Arkadaşlarla akşam yemeği',    '2026-06-10 20:00:00'),
            (1, 6,  75.00,   'EXPENSE', 'Eczane',                       '2026-06-12 14:00:00'),
            (1, 5,  200.00,  'EXPENSE', 'Sinema bileti',                '2026-06-15 18:30:00'),
            (1, 1,  700.00,  'EXPENSE', 'Haftalık market alışverişi',   '2026-06-18 11:00:00'),
            (1, 3,  50.00,   'EXPENSE', 'Taksi',                        '2026-06-22 23:00:00');
    END IF;

-- ══════════════════════════════════════════════════════════
--  Temmuz 2026 (bu ay) — artışlar + gece siparişleri
-- ══════════════════════════════════════════════════════════
    IF NOT EXISTS (SELECT 1 FROM transactions WHERE user_id = 1 AND DATE_TRUNC('month', transaction_timestamp) = '2026-07-01') THEN
        INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_timestamp) VALUES
            (1, 11, 15000.00, 'INCOME',  'Temmuz maaşı',                '2026-07-01 09:00:00'),
            (1, 9,  89.00,    'EXPENSE', 'Spotify + Netflix',           '2026-07-02 10:00:00'),
            (1, 1,  800.00,   'EXPENSE', 'Haftalık market alışverişi',  '2026-07-03 11:30:00'),
            (1, 4,  2500.00,  'EXPENSE', 'Temmuz kirası',               '2026-07-05 08:00:00'),
            (1, 2,  450.00,   'EXPENSE', 'Akşam yemeği — Nusr-Et',      '2026-07-07 20:00:00'),
            (1, 6,  120.00,   'EXPENSE', 'Eczane',                      '2026-07-08 14:00:00'),
            (1, 3,  200.00,   'EXPENSE', 'İstanbulkart yükleme',        '2026-07-10 09:00:00'),
            (1, 5,  350.00,   'EXPENSE', 'Sinema + kahve',              '2026-07-11 18:00:00'),
            (1, 12, 3000.00,  'INCOME',  'Freelance proje ödemesi',     '2026-07-13 15:00:00'),
            (1, 7,  1500.00,  'EXPENSE', 'Yaz kıyafeti alışverişi',     '2026-07-14 13:00:00'),
            (1, 2,  320.00,   'EXPENSE', 'Gece sipariş — burger',       '2026-07-18 23:15:00'),
            (1, 2,  180.00,   'EXPENSE', 'Gece sipariş — pizza',        '2026-07-22 22:30:00'),
            (1, 5,  250.00,   'EXPENSE', 'Steam oyun',                  '2026-07-25 16:00:00');
    END IF;
END $$;
