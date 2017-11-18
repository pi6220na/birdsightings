var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var helpers = require('../hbhelpers/helpers');

/* Information about a bird species, and dates this bird was seen */

var birdSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Bird name is required.'],
        unique: true,
        uniqueCaseInsensitive: true,
        validate: {
            validator: function(n) {
                return n.length >= 2;
            },
            message: '{VALUE} is not valid, bird name must be at least 2 letters'
        }
    },             // species name e.g. Great Horned Owl. Required and must be unique, and at least 2 letters long.
    description: String,                                       // e.g. "Large brown owl"
    averageEggs: {
        type: Number,
        min: [1, 'Should be at least 1 egg.'],
        max: [50, 'Should not be more than 50 eggs.'] },    // At least 1, no more than 50
    endangered: { type: Boolean, default: false },        // Is bird species threatened with extinction?
    datesSeen: [ {
        type: Date,
        requred: true,
        validate: {
            validator: function(d) {
                if (!d) { return false; }
                return d.getTime() <= Date.now();
            },
            message: 'Date must be a valid date. Date must be now or in the past.'
        }
    } ],  // An array of dates a bird of this species was seen. Must be now, or in the past
    nest: {
        location: String,
        materials: String
    },
    height: {
        type: Number,
        min: [1, 'Must be at least 1cm high.'],
        max: [300, 'Can not be more than 300cm high.'],
        validate: {
            validator: function(q) {
                console.log(q);
                return q > 1 && q < 300;

            },
            message: '{VALUE} Error - Height must be greater than 1, less than 300.'
        }
    }
});


var Bird = mongoose.model('Bird', birdSchema);
birdSchema.plugin(uniqueValidator);

module.exports = Bird;