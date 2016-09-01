var express = require('express'),
	http = require('http'),
	socketio = require('socket.io');

module.exports = function() {
	var app = express();
	   var server = http.createServer(app);
	   var io = socketio.listen(server);
	return io;
};

