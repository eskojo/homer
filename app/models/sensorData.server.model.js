var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
var sensorDataSchema = new Schema({
	sensorId: { id: String, name : String },
	temperature: [Number],
	humidity: [Number],
	entryDate: {
		type: Date,
		default: Date.now
	}

});

mongoose.model('sensors', sensorDataSchema);

