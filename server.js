// Mongo database and Express setups
var mongoose = require('./config/mongoose'),
    assert =   require('assert'),
    express = require ('./config/express');
var db = mongoose();
var sensors = require('mongoose').model('sensors');

var app = express();
var server = express();

app.listen(3000);
console.log('Node.js server is listening port 3000');
module.exports = app;

//Socket interface with client 
var server = require('http').Server(app);
var client = require('socket.io')(server);
client.listen(8080);

//Direct socket interface towards the IOT device
var IOTSocketHTTP = "http://192.168.8.102:3000";
var iotsocket = require('socket.io-client')(IOTSocketHTTP);

client.use(function(socket,next){
	// eg. user authorization to be done here.. later..
	next(null,true);
});

// global variable to store all client ids, this not used yet
var clients = {};

// handles IO socket connections towards web browsers and IOT device(s)
client.on('connection', function (socket) {
    // wait for client to make a socket connection
    clients[socket.id] = socket;                     
	console.log("web browser socket connection has been made, client id: " + clients[socket.id].id);  // just in case FYI
    
    // inits
	var sensData = {item:[{"temperature": "", "humidity": "", "time": ""}]};
	sensData.item.length = 0;
	var atDate, toDate;

    // provides data from DB to web browser
    socket.on('loadData', function(type){
		switch ( type ) {
			case 'daily': {
				atDate = new Date();
				  atDate.setHours(0,0,0,0);
				toDate = new Date();
				  toDate.setHours(23,59,59,59);
				query = sensors.where({entryDate: { $gte: atDate, $lt: toDate}});
				break;
			}
			case 'weekly': {
				var dateOffset = (24*60*60*1000) * 6; // 6 days offset 
				atDate = new Date();
				  atDate.setTime(atDate.getTime() - dateOffset);
				  atDate.setHours(0,0,0,0);
				toDate = new Date();
				  toDate.setHours(23,59,59,59);
				query = sensors.where({entryDate: { $gte: atDate, $lt: toDate}});
				break;
			}
			default: {
				query = sensors.where({});
			}
		}
		query.sort({entryDate:-1}).find( function(err, items) {  
			if (err) {
				console.log(err);
				return next(err);      // this function is missing !!
			} else {
				console.log("Server: Sensors data read successfully from database" );
				var averSensData = {item:[{"temperature": "", "humidity": "", "time": ""}]};
				  averSensData.item.length = 0;
				if ( type == 'daily' ) {  
					processWeeklyData(averSensData,items,atDate,1);               // period = 1 day
				} else processWeeklyData(averSensData,items,atDate,7);            // period = 7 days
				
				socket.emit('loadData', JSON.stringify(averSensData));            // send data to connected browser(s)
//				console.log(averSensData.item);
			}
		});
	});	

	// mediates online data from IOT device to web browser
    socket.on('onlineData', function(data){
		console.log('online data asked ');
		iotsocket.removeAllListeners();                                   // clears old IOT connections
		iotsocket.emit('giveOnlineData');
		console.log("connected: " + iotsocket.connected);
		iotsocket.on('onlineData', function(data) {
			var t = data.temperature.toFixed(2);                            // rounds to two decimals
			sensData.item[0] = {"temperature":t,"humidity":data.humidity,"time":new Date(),
								"sensorName":data.sensorId.name};
			client.to(socket.id).emit('onlineData', JSON.stringify(sensData));  // send data to connected browser(s)
		});	
	});

    socket.on('disconnect', function(){
		console.log("web browser has disconnected");
	});
});

// calculates average value
function calcAverage(temps){
	var aveTemp = 0;
	for ( var i=0; i<temps.length; i++){
		aveTemp += Number(temps[i]);
	}
	if (temps.length){
		return ((aveTemp/temps.length).toFixed(2));
	} else return 0;
}


// provides averaged data of the given period
// humidity is dummy ie. not processed yet
function processWeeklyData(averSensData,items,atdate,period){
	var hh = new Date();
	var name ='';
	var eday,hour,temp = 0;
	var temps = [];
	var day = atdate.getDate();
	for ( var counter =0; counter<=period; counter++ ) {   // processing period in days    
		for ( var h = 0; h <= 24;  h++ ) {                 // agregates an average over 1 hour
			temps = [];
			hour=0;
			items.forEach(function(d,i) {                  // iterates over all measurements of the 7 day period
				eday = d.entryDate.getDate();
				hour = d.entryDate.getHours();
				if ((day == eday) && (hour == h )){		   // matches to all measurements having given day and hour
					temps.push(d.temperature);             // push selected raw measurements to wait for average function
					hh = (d.entryDate);
//					hh = hh.setHours(h,0,0,0);             // maybe to init time for averaged measurements..?
					name = d.sensorId.name;
				}
			});
		if (temps.length) {
			var average = calcAverage(temps );
			averSensData.item.push({"temperature":average,"humidity":100,"time":hh,
									"sensorName":name});
			}
		}		
		day++;
	}
}

