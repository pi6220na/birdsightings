var express = require('express');
var router = express.Router();
var Bird = require('../models/bird');
var helpers = require('../hbhelpers/helpers');
var moment = require('moment');
var mongoose = require('mongoose');

var MongoClient = require('mongodb').MongoClient;
var db_url = process.env.MONGO_URL;

//var ObjectID = require('mongodb').ObjectID;
var ObjectID =  require('mongodb').ObjectID;


var myDateObj;

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

    for (item in req.body) {
        console.log('body item = ' + item + ' -> ' + req.body[item]);
    }


    n = moment(req.body.date);
    m = moment.utc(n);


    console.log('updating or adding date = ' + req.body.date);
    console.log('id = ' + req.body._id);
    console.log('lat = ' + req.body.lat);
    console.log('lon = ' + req.body.lon);

    // Format it for the current server timezone
    req.body.date = m.parseZone().format('dddd, MMMM Do YYYY, h:mm a');
    //req.body.date = moment.utc(n);

    console.log("formatted date = " + m);
    var myDateObj = new Object();
    myDateObj.date = req.body.date;
    myDateObj.lat = req.body.lat;
    myDateObj.lon = req.body.lon;

    console.log('well...?')
    console.log('myDateObj.date = ' + myDateObj.date);
    console.log('myDateObj.lat = ' + myDateObj.lat);
    console.log('myDateObj.lon = ' + myDateObj.lon);

    console.log('req.body._id = ' + req.body._id);
    var _id = req.body._id;

    //console.log('_id converted = ' + ObjectID(_id) );

    console.log('_id = ' + _id);
    //console.log('_id converted = ' + ObjectID(_id).str );

    // Push new date onto datesSeen array and then sort in date order.
    // Bird.findOneAndUpdate( {_id: ObjectID(req.body._id)}, { $push : { datesSeen : { $each: [req.body.date], $sort: 1} } }, {runValidators : true})
    Bird.update( {_id: ObjectID(req.body._id)}, { $push : {  myData: { myDateObj }}})
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


/* POST to updated existing sighting for a bird. Bird _id expected in body */
router.post('/upSighting', function(req, res, next){

    for (item in req.body) {
        console.log('body item = ' + item + ' -> ' + req.body[item]);
    }


    n = moment(req.body.date);
    m = moment.utc(n);

    // Format it for the current server timezone
    req.body.date = m.parseZone().format('dddd, MMMM Do YYYY, h:mm a');
    //req.body.date = moment.ISO_8601(m);


    console.log('updating or adding date = ' + req.body.date);
    console.log('id = ' + req.body.bird._id);

    //console.log("formatted date = " + m);
    var myDateObj = new Object();
    myDateObj.date = req.body.date;
    myDateObj.lat = req.body.lat;
    myDateObj.lon = req.body.lon;



    // Push new date onto datesSeen array and then sort in date order.
    Bird.findOneAndUpdate( {_id: ObjectID(req.body.bird._id)},  { $set : {  myData: { myDateObj }}})
        .then( (doc) => {
            if (doc) {
                res.redirect('/bird/' + req.body.bird._id);   // Redirect to this bird's info page
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


/* POST to updated existing sighting for a bird. Bird _id expected in body */
router.post('/upSightLon', function(req, res, next){

    for (item in req.body) {
        console.log('body item = ' + item + ' -> ' + req.body[item]);
    }


    console.log('updating or adding date = ' + req.body.date);
    console.log('id = ' + req.body._id);
    console.log("formatted date = " + req.body.date);

    var myDateObj = new Object();
    myDateObj.date = req.body.date;
    myDateObj.lat = req.body.lat;
    myDateObj.lon = req.body.lon;

    // Push new date onto datesSeen array and then sort in date order. { $set : { myData : [myDateObj] } })
    Bird.findByIdAndUpdate( {_id: ObjectID(req.body._id)},  { $set : {  myData: { _id : req.body.aID, myDateObj }}})
        .then( (doc) => {
            if (doc) {
                res.redirect('/bird/' + req.body._id);   // Redirect to this bird's info page
            }
            else {
                res.status(404);  next(Error("Attempt to update lon sighting to bird not in database"))
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



/* POST to updated existing sighting for a bird. Bird _id expected in body */
router.post('/upSightLat', function(req, res, next){

    for (item in req.body) {
        console.log('body item = ' + item + ' -> ' + req.body[item]);
    }

    console.log('updating or adding date = ' + req.body.date);
    console.log('_id = ' + req.body._id);
    console.log('aID = ' + req.body.aID);

    var myDateObj = new Object();
    myDateObj.date = req.body.date;
    myDateObj.lat = req.body.lat;
    myDateObj.lon = req.body.lon;

    // Push new date onto datesSeen array and then sort in date order.
    Bird.findByIdAndUpdate( {_id: ObjectID(req.body._id)},  { $set : {  myData: { _id : req.body.aID, myDateObj }}})
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



/* POST to delete existing sighting for a bird. Bird _id expected in body */
router.post('/deleteDate', function(req, res, next){

    for (item in req.body) {
        console.log('body item = ' + item + ' -> ' + req.body[item]);
    }



    console.log('deleteingggggggggggggggggggggggg date = ' + req.body.date);
    console.log('aID = ' + req.body.aID);
    console.log('_id = ' + req.body._id);


    // Format it for the current server timezone
    //req.body.date = m.parseZone().format('dddd, MMMM Do YYYY, h:mm a');
    //req.body.date = moment.ISO_8601(m);

    console.log("formatted date = " + req.body.date);


    var myDateObj = new Object();
    myDateObj.date = req.body.date;
    myDateObj.lat = req.body.lat;
    myDateObj.lon = req.body.lon;



    // Push new date onto datesSeen array and then sort in date order. { $pull: { fruits: { $in: [ "apples", "oranges" ] }
    Bird.updateOne( {_id: ObjectID(req.body._id)},  { $pull : { myData: { _id : req.body.aID, myDateObj }}})
        .then( (doc) => {

            if (doc) {
                res.redirect('/bird/' + req.body._id);   // Redirect to this bird's info page
            }
            else {
                res.status(404);  next(Error("Attempt to delete sighting to bird not in database"))
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
                    var notFound = Error('Bird not found for delete');
                    notFound.status = 404;
                    next(notFound);
                }
            })
            .catch((err) => {
                next(err);
            });
    }

});



/* POST task update */
router.post('/upheight', function(req, res, next){


    var _id = req.body._id;

    // use form data to make a new Bird; save to DB
    var bird = Bird(req.body);


    // Have to re-arrange the form data to match our nested schema.
    // Form data can only be key-value pairs.
    bird.nest = {
        location: req.body.nestLocation,
        materials: req.body.nestMaterials
    };


    if (!ObjectID.isValid(_id)) {
        var notFound = Error('Update error: Not found');
        notFound.status = 404;
        next(notFound);
    }

    else {

        console.log('id = ' + _id);
        console.log('height = ' + req.body.height);

        //Logic to update the item                      { $each: [req.body.date], $sort: 1} } }, {runValidators : true}
        Bird.updateOne({ _id: ObjectID(_id) }, { $set : { height: req.body.height }}, {runValidators : true})
            .then((result) => {

                for (item in result){

                    console.log('item = ' + item + " " + result[item]);
                }


                if (result.ok) {
                    res.redirect('/bird/' + req.body._id);
                } else {
                    // The task was not found. Report 404 error.
                    var notFound = Error('Bird not found for update');
                    notFound.status = 404;
                    next(notFound);
                }
            })
            .catch((err) => {
                next(err);
            });
    }

});
/* POST update */
router.post('/updescript', function(req, res, next){


    var _id = req.body._id;

    // use form data to make a new Bird; save to DB
    var bird = Bird(req.body);

    for (item in req.body) {
        console.log('body item = ' + item + ' -> ' + req.body[item]);
    }

    // Have to re-arrange the form data to match our nested schema.
    // Form data can only be key-value pairs.
    bird.nest = {
        location: req.body.nestLocation,
        materials: req.body.nestMaterials
    };


    if (!ObjectID.isValid(_id)) {
        var notFound = Error('Update error: Not found');
        notFound.status = 404;
        next(notFound);
    }

    else {

        console.log('id = ' + _id);
        console.log('descript = ' + req.body.descript);

        //Logic to update the item
        Bird.updateOne({ _id: ObjectID(_id) }, { $set : { descript: req.body.descript }}, {runValidators : true})
            .then((result) => {

                for (item in result){

                    console.log('item = ' + item + " " + result[item]);
                }


                if (result.ok) {
                    res.redirect('/bird/' + req.body._id);
                } else {
                    // The task was not found. Report 404 error.
                    var notFound = Error('Bird not found for update');
                    notFound.status = 404;
                    next(notFound);
                }
            })
            .catch((err) => {
                next(err);
            });
    }

});

/* POST update */
router.post('/updanger', function(req, res, next){


    var _id = req.body._id;

    // use form data to make a new Bird; save to DB
    var bird = Bird(req.body);

    for (item in req.body) {
        console.log('body item = ' + item + ' -> ' + req.body[item]);
    }


    if (!ObjectID.isValid(_id)) {
        var notFound = Error('Update error: Not found');
        notFound.status = 404;
        next(notFound);
    }

    else {

        console.log('id = ' + _id);
        console.log('endangered = ' + req.body.endangered);

        //Logic to update the item
        Bird.updateOne({ _id: ObjectID(_id) }, { $set : { endangered: req.body.endangered }}, {runValidators : true})
            .then((result) => {

                for (item in result){

                    console.log('item = ' + item + " " + result[item]);
                }


                if (result.ok) {
                    res.redirect('/');
                } else {
                    // The task was not found. Report 404 error.
                    var notFound = Error('Bird not found for update');
                    notFound.status = 404;
                    next(notFound);
                }
            })
            .catch((err) => {
                next(err);
            });
    }

});

/* POST update */
router.post('/upeggs', function(req, res, next){


    var _id = req.body._id;

    // use form data to make a new Bird; save to DB
    var bird = Bird(req.body);

    for (item in req.body) {
        console.log('body item = ' + item + ' -> ' + req.body[item]);
    }

    // Have to re-arrange the form data to match our nested schema.
    // Form data can only be key-value pairs.
    bird.nest = {
        location: req.body.nestLocation,
        materials: req.body.nestMaterials
    };


    if (!ObjectID.isValid(_id)) {
        var notFound = Error('Update error: Not found');
        notFound.status = 404;
        next(notFound);
    }

    else {

        console.log('id = ' + _id);
        console.log('eggs = ' + req.body.averageEggs);

        //Logic to update the item
        Bird.updateOne({ _id: ObjectID(_id) }, { $set : { averageEggs: req.body.averageEggs }}, {runValidators : true})
            .then((result) => {

                for (item in result){

                    console.log('item = ' + item + " " + result[item]);
                }


                if (result.ok) {
                    res.redirect('/bird/' + req.body._id);
                } else {
                    // The task was not found. Report 404 error.
                    var notFound = Error('Bird not found for update');
                    notFound.status = 404;
                    next(notFound);
                }
            })
            .catch((err) => {
                next(err);
            });
    }

});
/* POST update */
router.post('/uploc', function(req, res, next){


    var _id = req.body._id;

    // use form data to make a new Bird; save to DB
    var bird = Bird(req.body);

    for (item in req.body) {
        console.log('body item = ' + item + ' -> ' + req.body[item]);
    }

    // Have to re-arrange the form data to match our nested schema.
    // Form data can only be key-value pairs.
    bird.nest = {
        location: req.body.nestLocation,
        materials: req.body.nestMaterials
    };


    if (!ObjectID.isValid(_id)) {
        var notFound = Error('Update error: Not found');
        notFound.status = 404;
        next(notFound);
    }

    else {

        console.log('id = ' + _id);
        console.log('nestMaterial = ' + req.body.nestMaterials);
        console.log('bird.Location = ' + req.body.nestLocation);

        //Logic to update the item
        Bird.update({ _id: ObjectID(_id) }, { $set : { nest: bird.nest }}, {runValidators : true})
            .then((result) => {

                for (item in result){

                    console.log('item = ' + item + " " + result[item]);
                }


                if (result.ok) {
                    res.redirect('/bird/' + req.body._id);
                } else {
                    // The task was not found. Report 404 error.
                    var notFound = Error('Bird not found for update');
                    notFound.status = 404;
                    next(notFound);
                }
            })
            .catch((err) => {
                next(err);
            });
    }

});
/* POST update */
router.post('/upmat', function(req, res, next){


    var _id = req.body._id;

    // use form data to make a new Bird; save to DB
    var bird = Bird(req.body);

    for (item in req.body) {
        console.log('body item = ' + item + ' -> ' + req.body[item]);
    }

    // Have to re-arrange the form data to match our nested schema.
    // Form data can only be key-value pairs.
    bird.nest = {
        location: req.body.nestLocation,
        materials: req.body.nestMaterials
    };


    if (!ObjectID.isValid(_id)) {
        var notFound = Error('Update error: Not found');
        notFound.status = 404;
        next(notFound);
    }

    else {

        console.log('id = ' + _id);
        console.log('nestMaterial = ' + req.body.nestMaterials);
        console.log('bird.Location = ' + req.body.nestLocation);

        //Logic to update the item
        Bird.update({ _id: ObjectID(_id) }, { $set : { nest: bird.nest }}, {runValidators : true})
            .then((result) => {

                for (item in result){

                    console.log('item = ' + item + " " + result[item]);
                }


                if (result.ok) {
                    res.redirect('/bird/' + req.body._id);
                } else {
                    // The task was not found. Report 404 error.
                    var notFound = Error('Bird not found for update');
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
