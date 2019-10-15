const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const index = require('./routes/index');
const api = require('./routes/api');
const user = require('./routes/user');
const socket = require('./middleware/socket');
const game = require('./game/game');
const cors = require('cors');
const app = express();
const path = require('path');
const mongoose = require('mongoose');

const port = process.env.PORT || 4000;
const MONGODB = process.env.MONGODB_URI || 'mongodb://localhost/tictactoe';

mongoose.connect(MONGODB,
    { 
        useUnifiedTopology: true,
        useNewUrlParser: true, 
        useFindAndModify: false,
        useCreateIndex: true
    })
    .then(() => {
        console.log("Connected to MongoDB...");
        app.use(cors());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: true}));
        const server = http.createServer(app);
        socket.start(server);
        app.use(index);
        app.use(api);
        app.use(user);
        app.use(express.static(path.join(__dirname, '../client/build')));
        game.init()
        .then(() => {
            server.listen(port, () => console.log(`Listening on port ${port}...`));
        });
    });