var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var flash = require('express-flash');
var session = require('express-session');
var hbs = require('hbs');
var helpers = require('./hbhelpers/helpers');


var MongoClient = require('mongodb').MongoClient;

// Set the environment variable MONGO_URL to the correct URL
var db_url = process.env.MONGO_URL;
mongoose.Promise = global.Promise;

// And connect to mongoose, log success or error
mongoose.connect(db_url, { useMongoClient: true })
    .then( () => {  console.log('Connected to MongoDB') } )
.catch( (err) => { console.log('Error Connecting to MongoDB', err); });

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerHelper(helpers);

app.use(session({ secret: 'top secret', resave: false, saveUninitialized: false}));
app.use(flash());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

MongoClient.connect(db_url).then( (db) => {

    var birds = db.collection('birds');

    app.use('/', function(req, res, next) {
        req.birds = birds;
        next();
    });

    app.use('/upSighting', function(req, res, next) {
        req.birds = birds;
        next();
    });
    app.use('/deleteDate', function(req, res, next) {
        req.birds = birds;
        next();
    });

    app.use('/delete', function(req, res, next) {
        req.birds = birds;
        next();
    });
    app.use('/upheight', function(req, res, next) {
        req.birds = birds;
        next();
    });
    app.use('/updescript', function(req, res, next) {
        req.birds = birds;
        next();
    });
    app.use('/upeggs', function(req, res, next) {
        req.birds = birds;
        next();
    });
    app.use('/updanger', function(req, res, next) {
        req.birds = birds;
        next();
    });
    app.use('/uploc', function(req, res, next) {
        req.birds = birds;
        next();
    });
    app.use('/upmat', function(req, res, next) {
        req.birds = birds;
        next();
    });
    app.use('/upSightLat', function(req, res, next) {
        req.birds = birds;
        next();
    });
    app.use('/upSightLon', function(req, res, next) {
        req.birds = birds;
        next();
    });
    app.use('/', index);

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handler
    app.use(function(err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });

}).catch( (err) => {
    console.log('Error connecting to MongoDB', err);
    process.exit(-1);
});



module.exports = app;
