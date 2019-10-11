const router = require('express').Router();
const {Player} = require('../models/player');
const auth = require("../middleware/auth");

const game = require('../game/game');

router.post("/api/pressbtn", auth, (req, res) => {
  game.playerAction(req.player, req.body.btnID);
  res.send({ response: "I am alive" }).status(200);
});

router.post("/api/newgame", auth, (req, res) => {
  game.newGame(req.player);
  res.send({ response: "I am alive" }).status(200);
});

router.get("/api/top10", async (req, res) => {
  res.send(await Player.find(
    {
      bot: false
    },
    ['name', 'score'],
    {
      limit: 10,
      sort: {
        score: -1
      }
    }
  ));
});

router.get("/api/top10wl", async (req,res) => {
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