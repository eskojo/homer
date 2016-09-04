// This module is for IOT device to collect and push sensors data  

var assert = require('assert');
var restify = require('restify');
var fs = require('fs');  

var AWSdbServer = 'http://ec2-52-43-220-193.us-west-2.compute.amazonaws.com:3000';
var localHostdb = 'http://192.168.8.100:3000';

// configure DB server
var dbServer = restify.createJsonClient({     
  url: AWSdbServer,
  version: '0.0.1'
});

var raspiUrl = 'http://192.168.8.107';
var name = 'IOTServer';
var express = require('express');
var app = express({name:'raspi'});
var server = require('http').createServer(app);

server.listen(8080, function () {
  console.log('%s listening at %s', name, raspiUrl);
  console.log('IOT server at %s waiting for configuration data..', raspiUrl);
});

// Weather station set-up

var config = {
	state: 'OFF',
	pushInterval: '10000',
	inqInterval:'60000'
	};  	
	
var sensorData = {
    "sensorId":'',
	"temperature": 25,
	"humidity":    100
};

var sensorId = {"id": "28-0416547c95ff", "name": "boiler room" };

// inquires configuration from database server
var dbServerAvailable = function(ok){
	dbServer.get('/config', function (err, req, res, obj) {
	if (err) {
		console.log('no connection to db server' + err);
	} else {
		config = obj;
		console.log('Gateway server returned: %j', obj);
		clearInterval(pushIntervalObj);
		clearInterval(confIntervalObj);
		pushIntervalObj = setInterval(pushSensors,config.pushInterval);
	}
}); }

var confIntervalObj = setInterval(dbServerAvailable,config.inqInterval);

// read sensors and push to database server

function randomize(min,max){   // this is for testing purposes only
	return ( Math.floor(Math.random() * (max-min) + 1 ) + min );
}

function delay(ms){                  // this is not needed so far, sets execution delay
	ms += new Date().getTime();
	while ( new Date() < ms) {}
}

var readSensors = function (callback) {
	var value = 0;
	fs.readFile('/sys/bus/w1/devices/28-0416547c95ff/w1_slave',function(err,data ) {
		if (err) throw err;
		value += data.toString().substring(69);
		return callback(err,sensorId,value);         // there is only one sensor so far
	});
}

function pushSensors () {
	if (config.state == 'ON') {
		readSensors(function (err,senseId,value){ 
			if (err) throw err;
			console.log(value);
			sensorData.sensorId = sensorId;
			sensorData.temperature = value/1000;
			dbServer.post('/sensors', sensorData,function (err, req, res, obj) {
				if (err ) {
					console.log(err);
				} else {
//				assert.ifError(err);
				console.log('%d -> %j', res.statusCode, res.headers);
				console.log('%j', sensorData);
				}
			});
		});
	}
}

// start pushing data towards database server
var pushIntervalObj = setInterval(pushSensors,config.pushInterval);

// socket interface to serve online data requests
var io = require('socket.io')(server);
io.listen(2222);

io.on('connection', function(socket){
	console.log('client connected');

	socket.on('giveOnlineData', function(){
		console.log('online data asked');
		if (config.state == 'ON') {
			readSensors(function (err,senseId,value){ 
				if (err) throw err;
				sensorData.sensorId = sensorId;        // there is only one hardcoded sensor id so far
				sensorData.temperature = value/1000;
				socket.emit('onlineData', sensorData)
				console.log('%j', sensorData);
				});
			}
		});

	socket.on('disconnect', function(){
		console.log('client disconnected');
	});
});

