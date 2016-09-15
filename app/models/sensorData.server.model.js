var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
var sensorDataSchema = new Schema({
	sensorId: { id: String, name : String },
	temperature: [Number],
	humidity: [Number],
	entryDate: {
		type: Date,
		default: Date.now
//		get: localDate
		}
});

function localDate (date) {
	var localDate = new Date(date);
	return localDate;
}

sensorDataSchema.set('toJSON',{getters: true});

mongoose.model('sensors', sensorDataSchema);

