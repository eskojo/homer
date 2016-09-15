var path = require('path');

exports.render = function(req, res ) {
	if (req.session.lastVisit) {
		console.log("Hello, Your last visit here was: " + req.session.lastVisit);
	}
	req.session.lastVisit = new Date();
	
	res.sendFile(path.join('/home/ec2-user/www/homer/homer.html'));
//	res.sendFile(path.join('/home/esko/projects/homer/homer.html'));
};
