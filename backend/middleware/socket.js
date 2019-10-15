const socketIo = require("socket.io");
const Game = require('../game/game');
const {Player} = require('../models/player');

let io = null;

exports.start = function(server) {
    io = socketIo(server);
    io.on("connection", socket => {
        socket.on("disconnect", () => {
            Game.playerDisc(socket.id);
        });
    });
}

exports.emit = function(API, socketID, res) {
    io.to(socketID).emit(API, res);
}

exports.broadcast = function(API, res) {
    io.emit(API, res);
}

exports.kickSocket = function(socketID, reason) {
    io.to(socketID).emit("APIkick", {
        reason: reason
    });
}

exports.updatePlayer = function(player) {
    if (player.socket) {
        io.to(player.socket).emit("Player", {
            name: player.name,
            email: player.email,
            winns: player.winns,
            losses: player.losses,
            draws: player.draws,
            wlRatio: player.wlRatio,
            score: player.score,
            inQueue: player.inQueue
        });
    }
}

 exports.updateGame = async function(game) {
    const playerX = await Player.findById(game.playerX);
    const playerO = await Player.findById(game.playerO);
    const resX = {
        side: 'X',
        gameName: game.name,
        squares: game.squares,
        winner: game.winner,
        xIsNext: game.xIsNext,
        started: game.started
    };
    const resO = {
        side: 'O',
        gameName: game.name,
        squares: game.squares,
        winner: game.winner,
        xIsNext: game.xIsNext,
        started: game.started
    };
    if (playerX.socket) {
        io.to(playerX.socket).emit("Game", resX);
    } else if(playerX.bot) {
        Game.botSocket(playerX._id, resX);
    }
    if (playerO.socket) {
        io.to(playerO.socket).emit("Game", resO);
    } else if(playerO.bot) {
        Game.botSocket(playerO._id, resO);
    }
} 