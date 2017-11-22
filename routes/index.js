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


    //n = moment(req.body.date);
    //m = moment.utc(n);
    var m = moment(req.body.date, moment.ISO_8601);

    console.log('updating or adding date = ' + m);
    console.log('id = ' + req.body._id);
    console.log('lat = ' + req.body.lat);
    console.log('lon = ' + req.body.lon);

    // Format it for the current server timezone
    //req.body.date = m.parseZone().format('dddd, MMMM Do YYYY, h:mm a');
    //req.body.date = moment.utc(n);

    //console.log("formatted date = " + m);


    // Push new date onto datesSeen array and then sort in date order.
    // Bird.findOneAndUpdate( {_id: ObjectID(req.body._id)}, { $push : { datesSeen : { $each: [req.body.date], $sort: 1} } }, {runValidators : true})
    Bird.updateOne( {_id: ObjectID(req.body._id)}, { $push : {  sightData: { date: m, lat: req.body.lat, lon: req.body.lon }}})
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

/*
    n = moment(req.body.date);
    m = moment.utc(n);

    // Format it for the current server timezone
    req.body.date = m.parseZone().format('dddd, MMMM Do YYYY, h:mm a');
    req.body.date = moment.ISO_8601(m);
*/


    //n = moment(req.body.date,'MM DD YYYY').toDate();
    var n = new Date(req.body.date);
    console.log('date new = ' + n);

    //m = moment.utc(n);

    //var test = moment(req.body.date).isValid();
    //console.log('test is ' + test);


    //var n = moment.utc(req.body.date);
    //var n = moment(req.body.date).toISOString();
    //var n = moment(req.body.date);
    //var m = moment.utc(z);
    var z = moment(n);
    //var o = moment.ISO_8601(n);
    //var n = moment(req.body.date, moment.ISO_8601);
    console.log('date: z = ' + z);
    //console.log('date: m = ' + m);
    //console.log('date: o = ' + o);
    //console.log('date: p = ' + p);

    //req.body.date = moment.ISO_8601(req.body.date);

    console.log('updating date = ' + z);
    console.log('id = ' + req.body._id);
    console.log('aID = ' + req.body.aID);

    // Push new date onto datesSeen array and then sort in date order. {_id: ObjectID(req.body._id)},
    //Bird.update(  {'myData._id': ObjectID(req.body.aID)}, { $set : { 'myData.sightingArray': [myDateObj] } })

   //   Bird.findOneAndUpdate( {_id : req.body._id}, { $push : { datesSeen : { $each: [req.body.date], $sort: 1} } }, {runValidators : true})
    Bird.findOneAndUpdate( {_id: ObjectID(req.body._id) },  { $push: { sightData : { 'sightData.$.aID': req.body.aID, 'sightData.$.date': z, 'sightData.$.lat': req.body.lat, 'sightData.$.lon': req.body.lon }}})
   // Bird.findOneAndUpdate( { aID: req.body.aID }, { sightData: {  aID: req.body.aID , date: z, lat: req.body.lat, lon: req.body.lon }},false,true)
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
router.post('/deleteSighting', function(req, res, next){

    for (item in req.body) {
        console.log('body item = ' + item + ' -> ' + req.body[item]);
    }



    console.log('deleteingggggggggggggggggggggggg date = ' + req.body.date);
    console.log('_id = ' + req.body._id);

    // { 'myData.$.myDateObj': myDateObj }

    // Push new date onto datesSeen array and then sort in date order. { $pull: { fruits: { $in: [ "apples", "oranges" ] }
    // Bird.updateOne( {_id: ObjectID(req.body._id)},  { $pull : { myData: { mydata: ObjectID(req.body.aID) }}}) { $set : { 'myData.$.myDateObj': myDateObj }

/*
    Dive.update({ _id: diveId }, { "$pull": { "divers": { "user": userIdToRemove } }}, { safe: true, multi:true }, function(err, obj) {
        //do something smart
    });
*/
    // { qty: { $gt: 20 } }
    // Bird.deleteOne(  {'myData._id': ObjectID(req.body.aID)}, { $unset : { 'myData.$._id': req.body.aID, 'myData.$.myDateObj': myDateObj } })
    // Bird.update( {_id: ObjectID(req.body._id)}, { $pull: { myData: [ { _id: ObjectID('5a1423c9ac3bbb0fb40e4758'), myDateObj: { date: "Thursday, November 2nd 2017, 5:00 am", lat: "2", lon: "2"}}]}})
    // Bird.update( {_id: ObjectID(req.body._id)},  { $pull : { 'myData._id': req.body.aID } })
    Bird.update( {_id: ObjectID(req.body._id)},  { $pull : { sightData: { date: req.body.date, lat: req.body.lat, lon: req.body.lon }}})
    // Bird.remove( { myData: { $eq: ObjectID(req.body.aID) }} )
        .then( (doc) => {
            /*
            for (item in doc) {
                console.log('doc = ' + doc[item]);
            }

            for (item in res) {
                console.log('res item = ' + item);
            }

            console.log('next = ' + next)

            for (item in next) {
                console.log('next item = ' + next[item]);
            }

            for (item in res) {
                console.log('res item = ' + item);
            }
            */
            if (doc) {

                console.log(doc);
                console.log('doc = ' + doc);


                for (item in res) {
                    console.log('res item = ' + item);
                }

                console.log('res.statusCode = ' + res.statusCode);
                console.log('res.statusMessage = ' + res.statusMessage);

                res.redirect('/bird/' + req.body._id);   // Redirect to this bird's info page
            }
            else {
                res.status(404);  next(Error("Attempt to delete sighting to bird not in database"))
            }
        })
        .catch( (err) => {

            console.log('hit a major error: ' + err);

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

                console.log(result);
                console.log('result = ' + result);


                for (item in result) {
                    console.log('item = ' + item + " = " + result[item]);
                }

                console.log('res.statusCode = ' + res.statusCode);
                console.log('res.statusMessage = ' + res.statusMessage);

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
