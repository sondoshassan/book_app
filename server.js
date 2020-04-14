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


let allBooksAPI = [];
app.get('/', homePage);
app.get('/searches/new',mainForm);
app.post('/searches', searchPage);
app.get('/books/:book_id', detailsPage);
app.get('/:select_id',goToMainPage);



// it will render the books which selected from API page
function homePage(req, res) {
    let SQL = 'SELECT * FROM books;';
    client.query(SQL)
    .then(result =>{
        res.render('index',{data:result.rows});
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
            res.render('details', { data: result.rows[0]});
        });
}

// to find the book from API
function searchPage(req, res) {
    if (req.body.select === 'title') {
        let title = req.body.q;
        checkTitleOrAuthor('title',title, res);
    }
    else if (req.body.select === 'author') {
        let author = req.body.q;
        checkTitleOrAuthor('author',author, res);
    }
}

// for check what the user select and then render it
function checkTitleOrAuthor(option,select, res) {
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
function goToMainPage(req,res){
    let selectedId = req.params.select_id;
    let {title,image,authors,ISBN,bookshelf,description} = allBooksAPI[selectedId];
    let SQL = 'INSERT INTO books (title,image,authors,ISBN,bookshelf,description) VALUES ($1,$2,$3,$4,$5,$6);';
    let safeValues = [title,image,authors,ISBN,bookshelf,description];
    return client.query(SQL,safeValues)
    .then(() =>{
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
    this.ISBN = data.industryIdentifiers[0].type + ' '+data.industryIdentifiers[0].identifier || 'no ISBN';
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