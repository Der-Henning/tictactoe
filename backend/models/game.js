const mongoose = require('mongoose');
const Status = require('./status');

const gameSchema = new mongoose.Schema( {
    name: {
        type: String,
        unique: true
    },
    playerX: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    playerO: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    squares: {
        type: Array,
        default: Array(9).fill(null)
    },
    xIsNext: {
        type: Boolean,
        default: true
    },
    winner: String,
    started: {
        type: Boolean,
        default: false
    }
});

gameSchema.pre('save', async function(next) {
    var game = this;
    if (!game.name) {
        const status = await Status.findByIdAndUpdate('serverStatus', {$inc: { gameCounter: 1} });
        game.name = 'Game#' + (status.gameCounter + 1);
        next();
    } else {
        next();
    }
});

gameSchema.post('save', function(game) {
    require('../middleware/socket').updateGame(game);
});

module.exports = mongoose.model('Game', gameSchema);