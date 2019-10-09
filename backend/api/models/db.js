const mongoose = require('mongoose');

const MONGODB = process.env.MONGODB_URI || 'mongodb://localhost/tictactoe';

const connect = mongoose.connect(MONGODB,
    { 
        useUnifiedTopology: true,
        useNewUrlParser: true, 
        useFindAndModify: false,
        useCreateIndex: true
    },
    (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('mongodb connected');
        }
});

module.exports = connect;
