INSERT INTO categories (name, is_essential) VALUES
    ('Food & Groceries', true),
    ('Eating Out', false),
    ('Transportation', true),
    ('Rent & Bills', true),
    ('Entertainment', false),
    ('Health', true),
    ('Clothing', false),
    ('Education', true),
    ('Subscriptions', false),
    ('Other', false)
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (name, email, password, total_balance, monthly_income)
VALUES ('Adil Efe', 'adilefe257@gmail.com', '$2b$10$08Y8dHq3MjBdqQU7udfS9.Z2wcTX0B3aRPB1wrcakP3KB56FXu6NG', 11991.00, 15000.00)
ON CONFLICT (email) DO NOTHING;

INSERT INTO goals (user_id, title, target_amount, current_amount, deadline, status) VALUES
    (1, 'Laptop Fonu', 30000.00, 2500.00, '2026-09-01', 'ACTIVE'),
    (1, 'Yaz Tatili', 12000.00, 800.00, '2026-07-01', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_timestamp) VALUES
    (1, 10, 15000.00, 'INCOME', 'Mayıs maaşı', '2026-05-01 09:00:00'),
    (1, 9, 89.00, 'EXPENSE', 'Spotify + Netflix', '2026-05-02 10:00:00'),
    (1, 1, 800.00, 'EXPENSE', 'Haftalık market alışverişi', '2026-05-03 11:30:00'),
    (1, 4, 2500.00, 'EXPENSE', 'Mayıs kirası', '2026-05-05 08:00:00'),
    (1, 2, 450.00, 'EXPENSE', 'Akşam yemeği — Nusr-Et', '2026-05-07 20:00:00'),
    (1, 6, 120.00, 'EXPENSE', 'Eczane', '2026-05-08 14:00:00'),
    (1, 3, 200.00, 'EXPENSE', 'İstanbulkart yükleme', '2026-05-10 09:00:00'),
    (1, 5, 350.00, 'EXPENSE', 'Sinema + kahve', '2026-05-11 18:00:00'),
    (1, 10, 3000.00, 'INCOME', 'Freelance proje ödemesi', '2026-05-13 15:00:00'),
    (1, 7, 1500.00, 'EXPENSE', 'Yaz kıyafeti alışverişi', '2026-05-14 13:00:00')
ON CONFLICT DO NOTHING;
