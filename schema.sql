DROP TABLE IF EXISTS books;

CREATE TABLE IF NOT EXISTS books(
    id SERIAL PRIMARY KEY,
    title VARCHAR(500),
    image VARCHAR(600),
    authors TEXT [],
    description TEXT
);


DROP TABLE IF EXISTS detail;

CREATE TABLE IF NOT EXISTS detail(
    id SERIAL PRIMARY KEY,
    title VARCHAR(500),
    image VARCHAR(600),
    ISBN VARCHAR(200),
    bookshelf TEXT [],
    authors TEXT [],
    description TEXT
);

DROP TABLE IF EXISTS book_add;

CREATE TABLE IF NOT EXISTS book_add(
    id SERIAL PRIMARY KEY,
    title VARCHAR(500),
    image VARCHAR(600),
    ISBN VARCHAR(200),
    bookshelf VARCHAR(500),
    authors VARCHAR(500),
    description TEXT
);