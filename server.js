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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser());
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.set('views', [path.join(__dirname, 'views'),
path.join(__dirname, 'views/pages/'),
path.join(__dirname, 'views/pages/books/'),
path.join(__dirname, 'views/pages/searches/')]);



app.get('/', homePage);
app.get('/searches/new',mainForm);
app.get('/form', goToForm);
app.post(('/searches'), searchPage);
app.get('/books/:book_id', detailsPage);
app.get('/save/:select_id',savePage);



function homePage(req, res) {
    let SQL = 'SELECT * FROM books;';
    return client.query(SQL)
        .then(result => {

            res.render('index', { data: result.rows });
        });
}
function mainForm(req, res) {
    res.render('new');
}
function savePage(req,res){
let selectBook =req.params.select_id;
selectBookDataBase(selectBook);
let SQL = 'SELECT * FROM book_add WHERE title=$1;';
let safeValues = [array[selectBook].title];
    return client.query(SQL,safeValues)
        .then(result => {
            console.log('llllllll', result.rows);
            res.render('save',{data: result.rows});
        });
}
function selectBookDataBase(select){
    let title = array[select].title;
    let image = array[select].image;
    let ISBN = array[select].ISBN;
    let bookshelf = array[select].bookshelf;
    let authors = array[select].authors;
    let description = array[select].description;
    let SQL = 'INSERT INTO book_add (title,image,ISBN,bookshelf,authors,description) VALUES ($1,$2,$3,$4,$5,$6);';
    let safeValues = [title, image, ISBN, bookshelf, authors, description];
    return client.query(SQL, safeValues)
        .then(() => {
            res.redirect(`/save/${select}`);
        })
        .catch(error => {
            console.log(error);
        });
}

function goToForm(req, res) {
    res.render('form');
}
function userAdd(req, res) {
    userAddData(req, res);
    let SQL = 'SELECT * FROM book_add;';
    return client.query(SQL)
        .then(result => {
            console.log('hhhhhhhhhhh', result.rows);
            res.render('category');
        })
}

function userAddData(req, res) {
    console.log(req.body);
    let title = req.body.title;
    let image = req.body.image;
    let ISBN = req.body.ISBN;
    let bookshelf = req.body.bookshelf;
    let authors = req.body.authors;
    let description = req.body.description;
    let SQL = 'INSERT INTO book_add (title,image,ISBN,bookshelf,authors,description) VALUES ($1,$2,$3,$4,$5,$6);';
    let safeValues = [title, image, ISBN, bookshelf, authors, description];
    return client.query(SQL, safeValues)
        .then(() => {
            res.redirect('/cat');
        })
        .catch(error => {
            console.log(error);
        });
}


function detailsPage(req, res) {
    let bookClicks = req.params.book_id;
    let SQL = 'SELECT * FROM detail WHERE id=$1;';
    let safeValues = [bookClicks];
    return client.query(SQL, safeValues)
        .then(result => {
            res.render('details', { data: result.rows[0] });
        });
}

function searchPage(req, res) {
    array = [];
    if (req.body.select === 'title') {
        let title = req.body.q;
        let url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${title}`;
        return superagent.get(url)
            .then(val => {
                let dataBooks = val.body;
                let array = dataBooks.items.map(val => {
                    let bookObject = new Book(val);
                    saveInDataBase(bookObject, req, res);
                    saveDetails(bookObject, res);
                    array.push(bookObject);
                    return bookObject;
                });
                res.render('show', { data: array, title: title });
            })
            .catch(error => {
                res.render('error');
            });
    }
    else if (req.body.select === 'author') {
        let author = req.body.q;
        let url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${author}`;
        return superagent.get(url)
            .then(val => {
                let dataBooks = val.body;
                let array = dataBooks.items.map(val => {
                    let bookObject = new Book(val);
                    saveInDataBase(bookObject, req, res);
                    saveDetails(bookObject, res);
                    array.push(bookObject);
                    return bookObject;
                });
                res.render('show', { data: array, author: author });
            })
            .catch(error => {
                res.render('error');
            });
    }
}

function saveDetails(bookObject, res) {
    let title = bookObject.title;
    let image = bookObject.image;
    let authors = bookObject.authors;
    let description = bookObject.description;
    let bookshelf = bookObject.bookshelf;
    let ISBN = bookObject.ISBN;
    let SQL = 'INSERT INTO detail (title,image,ISBN,bookshelf,authors,description) VALUES ($1,$2,$3,$4,$5,$6);';
    let safeValues = [title, image, ISBN, bookshelf, authors, description];
    return client.query(SQL, safeValues)
        .then(() => {
            res.redirect('books/details');
        })
        .catch(error => {
            console.log(error);
        });
}


function saveInDataBase(bookObject, req, res) {
    let title = bookObject.title;
    let image = bookObject.image;
    let authors = bookObject.authors;
    let description = bookObject.description;
    let SQL = 'INSERT INTO books (title,image,authors,description) VALUES ($1,$2,$3,$4);';
    let safeValues = [title, image, authors, description];
    return client.query(SQL, safeValues)
        .then(() => {
            res.redirect('/');
        })
        .catch(error => {
            console.log(error);
        });
}


function Book(data) {
    this.title = data.volumeInfo.title || 'title book';
    this.image = data.volumeInfo.imageLinks.thumbnail || 'https://www.freeiconspng.com/uploads/book-icon--icon-search-engine-6.png';
    this.authors = data.volumeInfo.authors || [];
    this.description = data.volumeInfo.description || 'no description';
    this.bookshelf = data.volumeInfo.categories || [];
    this.ISBN = data.volumeInfo.industryIdentifiers[0].type || [];
}



app.get('*', (req, res) => {
    res.render('error');
});

client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`listen to ${PORT}`);
        });
    });