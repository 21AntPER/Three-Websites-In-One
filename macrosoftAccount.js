const mongoose = require('mongoose');

const schema = mongoose.Schema;

const AccountSchema = new schema({
    Firstname: {
        type: String,
        required: true
    },
    Lastname: String,
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phonenumber: Number,
    email: String,
    dob: {
        type: Date,
        required: true
    },
    gender: String
}, {timestamps: true})

const accounts = mongoose.model('Accounts', AccountSchema)
module.exports = accounts;