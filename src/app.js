const path = require('node:path');
const express = require('express');
const indexRouter = require('./routes/index');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));

app.use('/', indexRouter);

app.use((req, res) => {
  res.status(404).render('404');
});

module.exports = app;
