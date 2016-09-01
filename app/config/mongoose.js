// connect to the Mongo database 

var url = 'mongodb://localhost:27017/raspidb';

mongoose = require('mongoose');

module.exports = function() {
var db = mongoose.connect(url);
require('../app/models/sensorData.server.model');
return db;
};
