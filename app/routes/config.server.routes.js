var config = require('../../app/controllers/config.server.controller');

module.exports = function(app) {
app.route('/config').get(config.read);
};
