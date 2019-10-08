const mongoose = require('mongoose');

const statusSchema =  new mongoose.Schema( {
    _id: {
        type: String,
        required: true
    },
    gameCounter: {
        type: Number,
        default: 0
    },
    playerCounter: {
        type: Number,
        default: 0
    },
    botCounter: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Status', statusSchema);