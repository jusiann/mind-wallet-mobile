-- Mind Wallet Database Schema

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    reset_code VARCHAR(255),
    reset_code_expires TIMESTAMP,
    total_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monthly_income NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    is_essential BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id),
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('EXPENSE', 'INCOME')),
    description TEXT,
    transaction_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL,
    current_amount NUMERIC(12, 2) DEFAULT 0.00,
    deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default categories
INSERT INTO categories (name, is_essential) VALUES
    ('Food & Groceries', TRUE),
    ('Eating Out', FALSE),
    ('Transportation', TRUE),
    ('Rent & Bills', TRUE),
    ('Entertainment', FALSE),
    ('Health', TRUE),
    ('Clothing', FALSE),
    ('Education', TRUE),
    ('Subscriptions', FALSE),
    ('Other', FALSE)
ON CONFLICT (name) DO NOTHING;
