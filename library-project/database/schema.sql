-- ============================================================
-- Library Management System — Database Schema
-- Compatible with: PostgreSQL 14+
-- ============================================================

-- ─── USERS TABLE ─────────────────────────────────────────────
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,              -- bcrypt hash
    role            VARCHAR(10) NOT NULL DEFAULT 'student'
                    CHECK (role IN ('admin', 'student')),
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(30),
    student_id      VARCHAR(30) UNIQUE,                 -- NULL for admin
    department      VARCHAR(100),
    year_of_study   SMALLINT CHECK (year_of_study BETWEEN 1 AND 5),
    approved        BOOLEAN NOT NULL DEFAULT FALSE,
    self_registered BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── BOOKS TABLE ──────────────────────────────────────────────
CREATE TABLE books (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    author          VARCHAR(255) NOT NULL,
    genre           VARCHAR(50),
    isbn            VARCHAR(20),
    published_year  SMALLINT,
    total_copies    SMALLINT NOT NULL DEFAULT 1 CHECK (total_copies >= 1),
    available_copies SMALLINT NOT NULL DEFAULT 1,
    description     TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT available_lte_total CHECK (available_copies <= total_copies),
    CONSTRAINT available_gte_zero  CHECK (available_copies >= 0)
);

-- ─── LOANS TABLE ──────────────────────────────────────────────
CREATE TABLE loans (
    id              SERIAL PRIMARY KEY,
    book_id         INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    checked_out_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date        DATE NOT NULL,
    returned        BOOLEAN NOT NULL DEFAULT FALSE,
    returned_on     TIMESTAMP WITH TIME ZONE,
    fee_paid        BOOLEAN NOT NULL DEFAULT FALSE,
    fee_paid_on     TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── BOOK REQUESTS TABLE ──────────────────────────────────────
CREATE TABLE requests (
    id              SERIAL PRIMARY KEY,
    book_id         INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status          VARCHAR(10) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
    student_note    TEXT,
    admin_note      TEXT,
    reviewed_at     TIMESTAMP WITH TIME ZONE
);

-- ─── ANNOUNCEMENTS TABLE ──────────────────────────────────────
CREATE TABLE announcements (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    body            TEXT NOT NULL,
    author_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
    pinned          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────
CREATE INDEX idx_books_genre        ON books(genre);
CREATE INDEX idx_books_title        ON books(title);
CREATE INDEX idx_loans_user         ON loans(user_id);
CREATE INDEX idx_loans_book         ON loans(book_id);
CREATE INDEX idx_loans_returned     ON loans(returned);
CREATE INDEX idx_loans_due          ON loans(due_date);
CREATE INDEX idx_requests_user      ON requests(user_id);
CREATE INDEX idx_requests_status    ON requests(status);
CREATE INDEX idx_users_role         ON users(role);
CREATE INDEX idx_users_approved     ON users(approved);

-- ─── VIEWS ────────────────────────────────────────────────────

-- Active (unreturned) loans with late fee calculation
CREATE OR REPLACE VIEW active_loans_with_fees AS
SELECT
    l.id,
    l.book_id,
    l.user_id,
    l.checked_out_at,
    l.due_date,
    l.fee_paid,
    b.title   AS book_title,
    b.author  AS book_author,
    u.name    AS student_name,
    u.student_id,
    GREATEST(0, CURRENT_DATE - l.due_date) AS days_overdue,
    GREATEST(0, CURRENT_DATE - l.due_date) * 0.50 AS late_fee_bdt
FROM loans l
JOIN books b ON b.id = l.book_id
JOIN users u ON u.id = l.user_id
WHERE l.returned = FALSE;

-- Most borrowed books
CREATE OR REPLACE VIEW most_borrowed_books AS
SELECT
    b.id,
    b.title,
    b.author,
    b.genre,
    COUNT(l.id) AS total_loans
FROM books b
LEFT JOIN loans l ON l.book_id = b.id
GROUP BY b.id, b.title, b.author, b.genre
ORDER BY total_loans DESC;

-- ─── SEED DATA ────────────────────────────────────────────────

-- Admin user (password: admin123, hashed with bcrypt)
INSERT INTO users (username, password_hash, role, name, email, approved)
VALUES ('admin', '$2b$10$PLACEHOLDER_HASH', 'admin', 'Admin User', 'admin@library.com', TRUE);

-- Sample books
INSERT INTO books (title, author, genre, isbn, published_year, total_copies, available_copies, description) VALUES
('The Midnight Library',       'Matt Haig',          'Fiction',   '978-0525559474', 2020, 3, 3, 'A novel about all the lives you could have lived.'),
('Atomic Habits',              'James Clear',         'Self-Help', '978-0735211292', 2018, 2, 2, 'Tiny changes, remarkable results.'),
('Dune',                       'Frank Herbert',       'Sci-Fi',    '978-0441013593', 1965, 4, 4, 'A sweeping science fiction epic set on desert planet Arrakis.'),
('The Great Gatsby',           'F. Scott Fitzgerald', 'Classic',   '978-0743273565', 1925, 2, 2, 'The story of the fabulously wealthy Jay Gatsby.'),
('Sapiens',                    'Yuval Noah Harari',   'History',   '978-0062316110', 2011, 3, 3, 'A brief history of humankind.'),
('Introduction to Algorithms', 'Cormen et al.',       'Academic',  '978-0262033848', 2009, 3, 3, 'The definitive reference for algorithms.'),
('Clean Code',                 'Robert C. Martin',    'Academic',  '978-0132350884', 2008, 2, 2, 'A handbook of agile software craftsmanship.');
