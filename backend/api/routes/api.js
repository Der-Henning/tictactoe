const router = require('express').Router();
const Player = require('../models/player');

const game = require('../../game');

router.post("/hello", async (req, res) => {
  if (req.body.socket) {
    if(req.body.player && await Player.findById(req.body.player)) {
      const player = await Player.findById(req.body.player);
      player.socket = req.body.socket;
      game.newPlayer(player);
    } else {
      const player = await Player.create({
        socket: req.body.socket
      });
      game.newPlayer(player);
    }
  }
  res.send({ response: "I am alive" }).status(200);
});

router.post("/pressbtn", (req, res) => {
  game.playerAction(req.body.player, req.body.btnID);
  res.send({ response: "I am alive" }).status(200);
});

router.post("/newgame", (req, res) => {
  game.newGame(req.body.player);
  res.send({ response: "I am alive" }).status(200);
});

router.get("/top10", async (req,res) => {
  res.send(await Player.find(
      {
        wlRatio: { $gt: 0 }
      },
      ['name', 'wlRatio'],
      {
        limit: 10,
        sort: {
          wlRatio: -1
        }
      }
    ));
});

module.exports = router;