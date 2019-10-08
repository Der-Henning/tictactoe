const socket = require('./api/socket');

const Game = require('./api/models/game')
const Player = require('./api/models/player');
const Status = require('./api/models/status');

const TIMEOUT = 30000;
const BOTSPAWNTIME = 3000;

const connect = require('./api/models/db');

exports.init = (callback) => {
    connect.then(async () => {
        const Players = await Player.find({ $or:[ {online: true}, {inQueue: true} ]});
        Players.forEach(player => {
            player.online = false;
            player.inQueue = false;
            player.socket = null;
            player.save();
        });
        const status = await Status.findById('serverStatus');
        if (!status) {
            await Status.create({
                _id: 'serverStatus'
            });
            console.log("database initialized");
        }
        callback(true);
    });
}

exports.newPlayer = async function(socketID, playerID) {
    const newPlayer = await Player.create({
        socket: socketID,
        inQueue: true,
        queueStarted: Date.now()
    });
    logger(newPlayer.name + " connected!");
    playerID(newPlayer._id); 
    updateClient(null, newPlayer, '');
    setGame();
}

exports.playerDisc = async function(playerID) {
    const player = await Player.findById(playerID);
    logger(player.name + " disconnected!!");
    player.online = false;
    player.inQueue = false;
    player.socket = null;
    player.save();
    if (player.game) {
        const game = await Game.findById(player.game);
        game.winner = (game.playerX.equals(player._id)) ? 'O' : 'X';
        setWinner(game);
        game.save();
        updateClients(game);
    }
}

exports.newGame = async function(playerID) {
    const player = await Player.findById(playerID);
    player.inQueue = true;
    player.queueStarted = Date.now();
    updateClient(null, player, null);
    await player.save();
    setGame();
}

exports.playerAction = function(playerID, btn) {
    playerAction(playerID, btn);
}

async function setGame() {
    const Players = await Player.find({inQueue: true, online: true});
    if (Players.length >= 2) {
        const i = Math.round(Math.random());
        const playerX = Players[i];
        const playerO = Players[(i === 0) ? 1 : 0];
        playerX.inQueue = false;
        playerO.inQueue = false;
        playerX.queueStarted = null;
        playerO.queueStarted = null;
        await playerX.save();
        await playerO.save();

        const game = await Game.create({playerX: playerX._id, playerO: playerO._id, started: true});
        playerX.game = game._id;
        playerX.save();
        playerO.game = game._id;
        playerO.save();
        updateClients(game);
        logger('Startet ' + game.name + ' with ' + playerX.name + ' (X) and ' + playerO.name + ' (O).');
    } else if (Players.length === 1) {
        setTimeout(spawnBot, 5000, Players[0]._id);
    }
}

async function playerAction(playerID, btn) {
    const player = await Player.findById(playerID);
    const game = await Game.findById(player.game);

    if((game.playerX.equals(player._id) && !game.xIsNext) || (game.playerO.equals(player._id) && game.xIsNext)) return;
    if(game.winner || game.squares[btn]) return;
    player.timeoutTimer = null;
    player.save();
    game.squares[btn] = game.xIsNext ? 'X' : 'O';
    game.xIsNext = !game.xIsNext;
    game.markModified('squares');

    game.winner = calculateWinner(game);

    if (game.winner) await setWinner(game);

    await game.save();

    updateClients(game);
}

async function setWinner(game) {
    const playerX = await Player.findById(game.playerX);
    const playerO = await Player.findById(game.playerO);
    if (game.winner === "Draw") {
        playerX.draws++;
        playerO.draws++;
        logger("Winner of " + game.name + ": Draw");
    } else if (game.winner === "X") {
        playerX.winns++;
        playerO.losses++;
        logger("Winner of " + game.name + ": " + playerX.name + " (X)");
    } else if (game.winner === "O") {
        playerX.losses++;
        playerO.winns++;
        logger("Winner of " + game.name + ": " + playerO.name + " (O)");
    }
    playerX.game = null;
    playerO.game = null;
    if (playerX.bot) playerX.online = false;
    if (playerO.bot) playerO.online = false;
    playerX.save();
    playerO.save();
}

async function updateClients(game) {
    if (game.playerX) {
        updateClient(game, await Player.findById(game.playerX), 'X');
    }
    if (game.playerO) {
        updateClient(game, await Player.findById(game.playerO), 'O');
    }
}

function updateClient(game, player, side) {
    if (!game) {
        game = {
            started: false
        }
    }
    const res = {
        gameName: game.name,
        squares: game.squares,
        winner: game.winner,
        xIsNext: game.xIsNext,
        started: game.started,
        name: player.name,
        player: player._id,
        side: side,
        winns: player.winns,
        losses: player.losses,
        draws: player.draws,
        wlRatio: player.wlRatio
    }
    socket.emit('FromAPI', player.socket, res);
    if (player.bot) {
        botAction(res);
    } else if (game.started && !game.winner && ((game.xIsNext && side === 'X') || (!game.xIsNext && side === 'O'))) {
        player.timeoutTimer = Date.now() + TIMEOUT;
        setTimeout(timeoutPlayer, TIMEOUT, player._id);
        player.save();
    }
}

async function timeoutPlayer(playerID) {
    const player = await Player.findById(playerID);
    if (player.game && player.timeoutTimer && player.timeoutTimer <= Date.now()) {
        const game = await Game.findById(player.game);
        logger(player.name + " timed out!!");
        game.winner = (game.playerX.equals(player._id)) ? 'O' : 'X';
        setWinner(game);
        game.save();
        updateClients(game);
    }
}

async function spawnBot(playerID) {
    const player = await Player.findById(playerID);
    if (player.queueStarted != null && player.queueStarted <= Date.now() - BOTSPAWNTIME) {
        const bots = await Player.find({
            bot: true,
            online: false
        });
        if (bots.length >= 1) {
            bots[0].online = true;
            bots[0].inQueue = true;
            await bots[0].save();
        } else {
            await Player.create({
                bot: true,
                inQueue: true
            });
        }
        setGame();
    }
}

function botAction(res) {
    if (!res.winner && ((res.xIsNext && res.side === 'X') || (!res.xIsNext && res.side === 'O'))) {
        const side = res.side;
        const opponent = (res.side === 'X') ? 'O' : 'X';
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        let btn;
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            let sum = ((res.squares[a] === side) ? 1 : 0) + 
                ((res.squares[b] === side) ? 1 : 0) +
                ((res.squares[c] === side) ? 1 : 0);
            sum = (res.squares[a] === opponent || res.squares[b] === opponent || res.squares[c] === opponent) ? 0 : sum;
            if (sum === 2) {
                btn = (!res.squares[a]) ? a : (!res.squares[b]) ? b : (!res.squares[c]) ? c : null;
                break;
            }
        }

        if (!btn) {
            for (let i = 0; i < lines.length; i++) {
                const [a, b, c] = lines[i];
                let sum = ((res.squares[a] === opponent) ? 1 : 0) + 
                    ((res.squares[b] === opponent) ? 1 : 0) +
                    ((res.squares[c] === opponent) ? 1 : 0);
                sum = (res.squares[a] === side || res.squares[b] === side || res.squares[c] === side) ? 0 : sum;
                if (sum === 2) {
                    btn = (!res.squares[a]) ? a : (!res.squares[b]) ? b : (!res.squares[c]) ? c : null;
                    break;
                }
            }
        }

        if (!btn) {
            do {
                btn = Math.floor(Math.random() * 9);
            } while (res.squares[btn]);
        }
        setTimeout(playerAction, 200, res.player, btn);
    }
}

function logger(text) {
    console.log(new Date().toLocaleTimeString() + " - " + text);
    socket.broadcast('LogAPI', new Date().toLocaleTimeString() + " - " + text);
}

function calculateWinner(game) {
    const squares = game.squares;
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    let moves = 0;
    for (let i = 0; i < 9; i++) {
        if (squares[i]) moves++;
    }
    if (moves === 9) return 'Draw';
    return null;
  }