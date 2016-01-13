var	mongoose = require('mongoose');

module.exports = function(config) {
	var db = mongoose.connect(config.db);
	require('../server/models/meeting.server.model');
	require('../server/models/user.server.model');
	
	return db;
}