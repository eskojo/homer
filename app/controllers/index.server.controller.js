var path = require('path');

exports.render = function(req, res ) {
	res.sendFile(path.join('/home/ec2-user/www/homer/homer.html'));
//	res.sendFile(path.join('/home/esko/projects/homer/homer.html'));
};
