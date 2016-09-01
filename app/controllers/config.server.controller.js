// by default raspberry Pi is pushing data at 60 s interval

var raspiConfig = {     
	state: "ON",
	pushInterval: "600000",    // 10 * 60 000s =  10 min
	inqInterval:  "60000"      // 60 s
	};              

exports.read = function(req, res ) {
    res.send(raspiConfig);
    console.log(raspiConfig);
};

