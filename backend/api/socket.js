const socketIo = require("socket.io");
const game = require('../game');

let io = null;

exports.start = function(server) {
    io = socketIo(server);
    io.on("connection", socket => {
        socket.on("disconnect", () => {
            game.playerDisc(socket.id);
        });
    });
}

exports.emit = function(API, socketID, res) {
    io.to(socketID).emit(API, res);
}

exports.broadcast = function(API, res) {
    io.emit(API, res);
}
