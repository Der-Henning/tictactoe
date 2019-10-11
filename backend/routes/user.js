const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");
const { Player, validate } = require("../models/player");
const router = require("express").Router();
const game = require('../game/game');
const socket = require("../middleware/socket");

/* router.get("/user/current", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
}); */

router.post("/user/newanonymous", async (req, res) => {
    if (req.body.socket) {

        const player = await Player.create({
          socket: req.body.socket
        });
        const token = player.generateAuthToken();
        res.header("x-auth-token", token).send("Welcome!");
        game.newPlayer(player);
    } else {
      res.status(400).send("Missing SocketID");
    }
});

router.post("/user/connect", auth, async (req, res) => {
    if (req.body.socket) {
      let player = await Player.findById(req.player);
      if (!player) {
        res.status(400).send("no matching client found");
      } else {
        if (player.socket) {
          socket.kickSocket(player.socket, "New client connected");
          await game.playerDisc(player.socket);
          player = await Player.findById(req.player);
        }
        player.socket = req.body.socket;
        await game.newPlayer(player);
        res.status(200).send("connected!");
      }
    } else {
      res.status(400).send("Missing SocketID");
    }
})

router.post("/user/registration", auth, async (req, res) => {
  // validate the request body first
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let player = await Player.findOne({ email: req.body.email });
  if (player) return res.status(400).send("Mail already registered.");
  player = await Player.findOne({ name: req.body.name });
  if (player) return res.status(400).send("Playername already registered.");

  player = await Player.findById(req.player);
  player.name = req.body.name;
  player.email = req.body.email;
  player.password = await bcrypt.hash(player.password, 10);
  await player.save();

  const token = player.generateAuthToken();
  res.header("x-auth-token", token).send({
    _id: player._id,
    name: player.name,
    email: player.email
  });
});

module.exports = router;