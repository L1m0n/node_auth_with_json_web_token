var mongoose = require('mongoose');

var Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
    userName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    /*hashedPassword: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },*/
    created: {
        type: Date,
        default: Date.now
    }
}))