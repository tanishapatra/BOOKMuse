-- Drop existing tables if they exist (for clean reset)
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS quotes;

-- Quotes Table (Just one editable quote for now)
CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL
);

-- Books Table
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    cover_url TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    tags TEXT[],  -- Optional
    notes TEXT,
    read_date DATE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('To Read', 'Reading', 'Completed')),
    is_favorite BOOLEAN DEFAULT false
);
