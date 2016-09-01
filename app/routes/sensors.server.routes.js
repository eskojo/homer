var sensors = require('../../app/controllers/sensors.server.controller');

module.exports = function(app) {
app.route('/sensors').post(sensors.create);
};
