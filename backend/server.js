const express = require("express");
const http = require("http");
const bodyParser = require('body-parser');
const port = process.env.PORT || 4000;
const index = require("./api/routes/index");
const socket = require('./api/socket');
const game = require('./game');
const cors = require('cors');
const app = express();
const path = require('path');

game.init(()=> {
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    const server = http.createServer(app);

    socket.start(server);

    app.use(index);

    if (process.env.NODE_ENV === 'production') {
        // Serve any static files
        app.use(express.static(path.join(__dirname, '../client/build')));
    }

    server.listen(port, () => console.log(`Listening on port ${port}`));
});



