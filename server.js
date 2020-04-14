'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT;
const app = express();
const bodyParser = require('body-parser');
var path = require('path');
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
const methodOverride = require('method-override');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(methodOverride('_method'));
app.set('views', [path.join(__dirname, 'views'),
path.join(__dirname, 'views/pages/'),
path.join(__dirname, 'views/pages/books/'),
path.join(__dirname, 'views/pages/searches/')]);


let allBooksAPI = [];
app.get('/', homePage);
app.post('/searches', searchPage);
app.get('/searches/new', mainForm);
app.post('/', updateBookShell);
app.get('/books/:book_id', detailsPage);
app.put('/update/:book_id', goToEdit);
app.delete('/delete/:book_id', deleteBook)

function goToEdit(req, res) {
    let updateId = req.params.book_id;
    let title = req.body.title;
    let image = req.body.image;
    let authors = req.body.authors;
    let ISBN = req.body.ISBN;
    let bookshelf = req.body.bookshelf;
    let description = req.body.description;
    if (!Array.isArray(authors)) {
        authors = [authors];
    }
    let SQL = 'UPDATE books SET title=$1,image=$2,authors=$3,ISBN=$4,bookshelf=$5,description=$6 WHERE id=$7;';
    let safeValues = [title, image, authors, ISBN, bookshelf, description, updateId];
    client.query(SQL, safeValues)
        .then(result => {
            detailsPage(req, res);
        });
}
function deleteBook(req, res) {
    console.log('delete');
    let bookId = req.params.book_id;
    console.log(bookId);
    let SQL = 'DELETE FROM books WHERE id=$1;';
    let safeValues = [bookId];
    client.query(SQL, safeValues)
        .then(() => {
            homePage(req, res);
        }).catch(error => {
            console.log(error);
        });

}


// it will render the books which selected from API page
function homePage(req, res) {
    let SQL = 'SELECT * FROM books;';
    client.query(SQL)
        .then(result => {
            res.render('index', { data: result.rows });
        });
}

//main form for searching from API
function mainForm(req, res) {
    res.render('new');
}

// if you press in detials it will render this
function detailsPage(req, res) {
    let bookClicks = req.params.book_id;
    let SQL = 'SELECT * FROM books WHERE id=$1;';
    let safeValues = [bookClicks];
    return client.query(SQL, safeValues)
        .then(result => {
            let SQL = 'SELECT DISTINCT bookshelf FROM books;';
            client.query(SQL)
                .then(bookshelf => {
                    res.render('details', { data: result.rows[0], bookshelf: bookshelf.rows });
                })

        });
}

// to find the book from API
function searchPage(req, res) {
    if (req.body.select === 'title') {
        let title = req.body.q;
        checkTitleOrAuthor('title', title, res);
    }
    else if (req.body.select === 'author') {
        let author = req.body.q;
        checkTitleOrAuthor('author', author, res);
    }
}

// for check what the user select and then render it
function checkTitleOrAuthor(option, select, res) {
    allBooksAPI = [];
    let url = `https://www.googleapis.com/books/v1/volumes?q=in${option}:${select}`;
    superagent.get(url)
        .then(val => {
            let dataBooks = val.body.items;
            let array = dataBooks.map(val => {
                allBooksAPI.push(new Book(val.volumeInfo));
                return new Book(val.volumeInfo);
            });
            res.render('show', { data: array });
        })
        .catch(error => {
            res.render('error');
        });
}
// after click on the select book it will render it to home page

function updateBookShell(req, res) {
    let id = req.body.id;
    let title = allBooksAPI[id].title;
    let image = allBooksAPI[id].image;
    let authors = allBooksAPI[id].authors;
    let ISBN = allBooksAPI[id].ISBN;
    let description = allBooksAPI[id].description;
    let bookshelf = req.body.bookshelf;
    let SQL = 'INSERT INTO books (title,image,authors,ISBN,bookshelf,description) VALUES ($1,$2,$3,$4,$5,$6);';
    let safeValues = [title, image, authors, ISBN, bookshelf, description];
    return client.query(SQL, safeValues)
        .then(() => {
            res.redirect('/');
        });
}
// constructor function
function Book(data) {
    this.title = data.title || 'title book';
    this.image = data.imageLinks.thumbnail || 'https://www.freeiconspng.com/uploads/book-icon--icon-search-engine-6.png';
    this.authors = data.authors || [];
    this.description = data.description || 'no description';
    this.bookshelf = data.categories || 'no u need to fill';
    this.ISBN = data.industryIdentifiers[0].type + ' ' + data.industryIdentifiers[0].identifier || 'no ISBN';
}

// for errors
app.get('*', (req, res) => {
    res.render('error');
});

client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`listen to ${PORT}`);
        });
    });