'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const PORT = process.env.PORT;
const app = express();
const bodyParser = require('body-parser');
var path =require('path');

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(bodyParser());
app.set('view engine' ,'ejs');

app.use(express.static('./public'));
app.set('views', [path.join(__dirname, 'views'),
                      path.join(__dirname, 'views/pages/'), 
                      path.join(__dirname, 'views/pages/searches/')]);


app.get('/',(req,res) =>{
res.render('index');
});
app.get(('/searches/new'),(req,res)=>{
    res.render('new');
});


app.post(('/searches'),(req,res) =>{
    // let title = req.query.q;
    console.log('Get Request->  ',req.body);
    if(req.body.select === 'title'){
    let title = req.body.q;
    let url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${title}`;
    superagent.get(url)
    .then(val =>{
        let dataBooks = val.body;
        let array = dataBooks.items.map(val =>{
           return new Book(val);
        })
        res.render('show',{data: array,title: title});
    })
.catch (error =>{
    res.render('error');
});
}
    else if(req.body.select === 'author'){
        let author = req.body.q;
        console.log(author);
    let url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${author}`;
    superagent.get(url)
    .then(val =>{
        let dataBooks = val.body;
        let array = dataBooks.items.map(val =>{
           return new Book(val);
        })
        res.render('show',{data: array,author: author});
    })
    .catch (error =>{
        res.render('error');
    });
    }
});

function Book(data){
    this.title = data.volumeInfo.title || 'title book';
    this.image = data.volumeInfo.imageLinks.thumbnail || 'https://www.freeiconspng.com/uploads/book-icon--icon-search-engine-6.png';
    this.authors = data.volumeInfo.authors || [];
    this.description = data.volumeInfo.description || 'no description';
}

app.get('*',(req,res)=>{
res.render('error');
});




app.listen(PORT,()=>{
console.log(`listen to ${PORT}`);
});