const config = require('config');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Status = require('./status');

var playerSchema = new mongoose.Schema( {
    name: {
        type: String,
        unique: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        minlength: 5,
        maxlength: 255
    },
    password: {
        type: String,
        minlength: 3,
        maxlength: 255
    },
    socket: String,
    game: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    winns: {
        type: Number,
        default: 0
    },
    losses: {
        type: Number,
        default: 0
    },
    draws: {
        type: Number,
        default: 0
    },
    wlRatio: {
        type: Number,
        default: 1
    },
    score: {
        type: Number,
        default: 0
    },
    timeoutTimer: Number,
    online: {
        type: Boolean,
        default: true
    },
    inQueue: {
        type: Boolean,
        default: false
    },
    queueStarted: {
        type: Number
    },
    bot: {
        type: Boolean,
        default: false
    },
    token: {
        type: String
    }
});

playerSchema.methods.generateAuthToken = function() { 
    const token = jwt.sign({ _id: this._id, name: this.name }, config.get('myprivatekey'));
    return token;
  }


playerSchema.pre('save', async function(next) {
    var player = this;
    if (!player.name && !player.bot) {
        const status = await Status.findByIdAndUpdate('serverStatus', {$inc: { playerCounter: 1} });
        player.name = 'Player#' + (status.playerCounter + 1);
        next();
    } else if (!player.name && player.bot) {
        const status = await Status.findByIdAndUpdate('serverStatus', {$inc: { botCounter: 1} });
        player.name = 'Bot#' + (status.botCounter + 1);
        next();
    } else {
        next();
    }
});

function validateUser(user) {
    const schema = {
      name: Joi.string().min(3).max(50).required(),
      email: Joi.string().min(5).max(255).required().email(),
      password: Joi.string().min(3).max(255).required()
    };
  
    return Joi.validate(user, schema);
  }

exports.Player = mongoose.model('Player', playerSchema);
exports.validate = validateUser;

//module.exports = mongoose.model('Player', playerSchema);