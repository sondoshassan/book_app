DROP TABLE IF EXISTS books;

CREATE TABLE IF NOT EXISTS books(
    id SERIAL PRIMARY KEY,
    title VARCHAR(500),
    image VARCHAR(600),
    authors TEXT [],
    ISBN VARCHAR(200),
    bookshelf TEXT [],
    description TEXT
);


