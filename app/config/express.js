var express = require('express'),
	bodyParser = require('body-parser');

module.exports = function() {
	var app = express();
	app.use(bodyParser.json());
	app.use(express.static('public'));             // static files from public dir..
	require('../app/routes/index.server.routes.js')(app);
	require('../app/routes/sensors.server.routes.js')(app);
	require('../app/routes/config.server.routes.js')(app);
	return app;
};





