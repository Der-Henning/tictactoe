const mongoose = require('mongoose');
const Status = require('./status');

var playerSchema = new mongoose.Schema( {
    name: {
        type: String,
        unique: true
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

playerSchema.pre('save', async function(next) {
    var player = this;
    player.wlRatio = (player.losses === 0) ? null : (player.winns / player.losses);
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

module.exports = mongoose.model('Player', playerSchema);