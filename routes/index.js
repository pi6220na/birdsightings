var express = require('express');
var router = express.Router();
var Bird = require('../models/bird');
var helpers = require('../hbhelpers/helpers');


var MongoClient = require('mongodb').MongoClient;
var db_url = process.env.MONGO_URL;

//var ObjectID = require('mongodb').ObjectID;
var ObjectID =  require('mongodb').ObjectID;


/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

/* GET home page  */
router.get('/', function(req, res, next) {


    Bird.find()//.select( { name: 1  } ).sort( { name: 1 } )
        .then( ( docs ) => {
            console.log(docs);  // not required, but useful to see what is returned
            res.render('index', { title: 'All Birds', birds: docs });
        }).catch( (err) => {
        next(err)
    });

});




/* POST to create new bird in birds collection  */
router.post('/addBird', function(req, res, next) {

    // use form data to make a new Bird; save to DB
    var bird = Bird(req.body);

    // Have to re-arrange the form data to match our nested schema.
    // Form data can only be key-value pairs.
    bird.nest = {
        location: req.body.nestLocation,
        materials: req.body.nestMaterials
    };

    bird.save()
        .then( (doc) => {
            //console.log(doc);
            res.redirect('/')
        })
        .catch( (err) => {

            if (err.name === 'ValidationError') {
                // Check for validation errors, e.g. negative eggs or missing name
                // There may be more than one error. All messages are combined into
                // err.message, but you may access each ValidationError individually
                req.flash('error', err.message);
                res.redirect('/');
            }
            else if (err.name === 'ValidationError') {
                req.flash('error', err.message);
                res.redirect('/bird/' + req.body._id);
            }
            else {
                // Not either of these? Pass to generic error handler to display 500 error
                next(err);
            }
        });
});


/* GET info about one bird */
router.get('/bird/:_id', function(req, res, next){

    Bird.findOne( { _id: req.params._id })
        .then( (doc) => {
            if (doc) {

                // If array is unsorted or not sorted in desired way, can sort in code
                /* doc.datesSeen = doc.datesSeen.sort( function(a, b) {
                 if (a && b) {
                 return a.getTime() - b.getTime();
                 }
                 });   */

                res.render('bird', { bird: doc });
            } else {
                res.status(404);
                next(Error("Bird not found"));  // 404 error handler
            }
        })
        .catch( (err) => {
            next(err);
        });
});

/* POST to add a new sighting for a bird. Bird _id expected in body */
router.post('/addSighting', function(req, res, next){

    // Push new date onto datesSeen array and then sort in date order.
    Bird.findOneAndUpdate( {_id : req.body._id}, { $push : { datesSeen : { $each: [req.body.date], $sort: 1} } }, {runValidators : true})
        .then( (doc) => {
            if (doc) {
                res.redirect('/bird/' + req.body._id);   // Redirect to this bird's info page
            }
            else {
                res.status(404);  next(Error("Attempt to add sighting to bird not in database"))
            }
        })
        .catch( (err) => {

            console.log(err);

            if (err.name === 'CastError') {
                req.flash('error', 'Date must be in a valid date format');
                res.redirect('/bird/' + req.body._id);
            }
            else if (err.name === 'ValidationError') {
                req.flash('error', err.message);
                res.redirect('/bird/' + req.body._id);
            }
            else {
                next(err);
            }
        });

});



/* POST task delete */
/* copied from todo list lab */
router.post('/delete', function(req, res, next){


    var _id = req.body._id;

    if (!ObjectID.isValid(_id)) {
        var notFound = Error('Not found');
        notFound.status = 404;
        next(notFound);
    }

    else {

        //Logic to delete the item
            Bird.deleteOne({_id: ObjectID(_id)})
            .then((result) => {
                if (result.deletedCount === 1) {
                    res.redirect('/');
                } else {
                    // The task was not found. Report 404 error.
                    var notFound = Error('Task not found');
                    notFound.status = 404;
                    next(notFound);
                }
            })
            .catch((err) => {
                next(err);
            });
    }

});


module.exports = router;
