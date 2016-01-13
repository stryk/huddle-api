var mongoose = require('mongoose'),
	Schema = mongoose.Schema;


var MeetingSchema = Schema({
	sessionId: {
		type: String,
		required: 'sessionId is required',
		index: true
	},
	client: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		index: true
	},
	advisor: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		index: true
	},
	atTime: {
		type: Date,
		required: 'meeting time is required'
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	},
	link: {
		type: String,
		unique: true,
		index: true,
		default: generateLink
	}
});



var Meeting = mongoose.model('Meeting', MeetingSchema);

function generateLink() {

	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	var link = '';
	for( var i=0; i < 6; i++ ) {
		link += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return link;
}

MeetingSchema.set('toJSON', { getters: true, virtuals: true });
MeetingSchema.set('autoIndex', false);
