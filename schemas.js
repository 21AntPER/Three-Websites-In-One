const mongoose = require('mongoose');

const schema = mongoose.Schema;

const VideoSchema = new schema( {
    _id: {
        type: schema.Types.ObjectId,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    thumbnail: String,
    views: {
        type: Number,
        required: true
    },
    FullName: {
        type: String,
        required: true
    },
    profile: String,
    upVotes: {
        type: Number,
        required: true
    },
    downVotes: {
        type: Number,
        required: true
    },
    account: {
        type: schema.Types.ObjectId,
        required: true
    }
}, { timestamps: true } )

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
    countryCode: {
        type: Number,
        required: true
    },
    phonenumber: {
        type: Number,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    gender: String,
    profile: String
}, {timestamps: true})


const detailsSchema = mongoose.model('Details', VideoSchema)
const accountsSchema = mongoose.model('Accounts', AccountSchema)

module.exports = {detailsSchema, accountsSchema};