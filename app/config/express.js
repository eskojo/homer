var config = require('./config'),
	express = require('express'),
	bodyParser = require('body-parser'),
	session = require('express-session');
	
if (process.env.NODE_ENV === 'development' ) {
	// use morgan..
	} else if ( process.env.NODE_ENV === 'production') {
		//use compress..
	}	
	

module.exports = function() {
	var app = express();
	app.use(bodyParser.json());
	app.use(express.static('public'));             // static files from public dir..
	app.use(session({
		saveUninitialized: true,
		resave: true,
		secret: config.sessionSecret
	}));
	
	require('../routes/index.server.routes.js')(app);
	require('../routes/sensors.server.routes.js')(app);
	require('../routes/config.server.routes.js')(app);
	return app;
};





