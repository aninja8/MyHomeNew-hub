'use strict';

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

module.exports.connect = () => {
    const user = process.env.MONGO_DB_USER;
    const password = process.env.MONGO_DB_PASS;
    const host = process.env.MONGO_DB_HOST;
    const port = process.env.MONGO_DB_PORT;

    mongoose.connect(`mongodb://${user}:${password}@ds161539.mlab.com:61539/shashihome`, {
        useNewUrlParser: true,
        autoIndex: false
    })
    .then(() => {
        console.log('connected to db');
    })
    .catch(err => {
        console.log('DB connection failed: ', err);
    });
};
