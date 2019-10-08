const mongoose = require('mongoose');

const connect = mongoose.connect('mongodb://localhost/tictactoe',
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