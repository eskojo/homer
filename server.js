// set working environment to it's default one 
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Mongo database and Express setups
var mongoose = require('./app/config/mongoose'),
    assert =   require('assert'),
    express = require ('./app/config/express');
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
var IOTSocketHTTP = "http://176.93.43.109:2222";
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
    socket.on('loadData', function(period){
		switch ( period ) {
			case 'daily': {
				atDate = new Date();
				atDate.setHours(0,0,0,0);
//				atDate.setTime(atDate.getTime() - (3*60*60*1000)); 
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
				  console.log("weekStartDate " + atDate.toString());
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
				if ( period == 'daily' ) {  
					processAveragedData(averSensData,items,atDate,1);               // period = 1 day
				} else processAveragedData(averSensData,items,atDate,7);            // period = 7 days
				
				socket.emit('loadData', JSON.stringify(averSensData));            // send data to connected browser(s)
				console.log(averSensData.item);
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
function calcAverage(tempsToAverage){
	console.log("here :" + tempsToAverage);
	var aveTemp = 0;
	for ( var i=0; i<tempsToAverage.length; i++){
		aveTemp += Number(tempsToAverage[i]);
	}
	if (tempsToAverage.length){
		return ((aveTemp/tempsToAverage.length).toFixed(2));
	} else return 0;
}


// provides averaged data of the given period
// humidity is dummy ie. not processed yet
function processAveragedData(averSensData,items,atdate,period){
	console.log("items " + items);
	var name ='';
	var entryDay,entryHour = 0;
	var tempsToAverage = [];
	var dayToMatch = atdate.getDate();
	var matchingDate = new Date();
	for ( var counter =0; counter<period; counter++ ) {   // processing period in days    
		for ( var h = 0; h < 24;  h++ ) {                 // agregates an average over 1 hour
			tempsToAverage = [];
			entryHour = 0;
			items.forEach(function(d,i) {                  // iterates over all the measurements in the scope
//				d.entryDate = d.entryDate.setTime(d.entryDate.getTime() + 1000*3*60*60); 
//				console.log("entry with offset " + d.entryDate.toString());	
				entryDay = d.entryDate.getDate();
				entryHour = d.entryDate.getHours();
				if ((dayToMatch == entryDay) && (entryHour == h )){		   // matches to all measurements having given day and hour
					tempsToAverage.push(d.temperature);             // push selected raw measurements to wait for average function
					matchingDate = d.entryDate;
					matchingDate = matchingDate.setHours(h,0,0,0); // the result is averaged over 1 hour
					name = d.sensorId.name;
				}
			});
		if (tempsToAverage.length) {
			var average = calcAverage(tempsToAverage );
			averSensData.item.push({"temperature":average,"humidity":100,"time":matchingDate,
									"sensorName":name});
			} else {} //  no actions here needed, nothing found to average
		}		
		var dayOffset = (24*60*60*1000);  // 1 day offset 
		dayToMatch = new Date(atdate.getTime() + ( counter * dayOffset )).getDate();  // sets the matching target 1 day ahead
	}
}

