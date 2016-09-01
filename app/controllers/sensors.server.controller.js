var sensors = require('mongoose').model('sensors');

exports.create = function(req, res, next) {
	var sensor = new sensors(req.body);
	sensor.save(function(err) {
		if (err) {
		return next(err);
		} else {
			res.json(sensor);
			console.log("Server: Sensors data stored successfully to database" );
		}
	});
};

