const express = require("express");
const router = express.Router();
const Player = require('../models/player');

const game = require('../../game');

router.get("/", (req, res) => {
  res.send({ response: "I am alive" }).status(200);
});

router.get("/hello", (res, res) => {

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
