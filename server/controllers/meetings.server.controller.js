var User = require('mongoose').model('User');
var Meeting = require('mongoose').model('Meeting');
var jwt = require('jsonwebtoken');




exports.create = function(req, res, ot) {  // requires client username and meeting time in body of post request.
	if (!req.user) {
		return res.status(403).send({ 
		        success: false, 
		        message: 'Please login.' 
		    });
	} else {
			ot.createSession(function(err, session){
				if(!err) {
					
					User.findOne({username: req.body.username }, function(err, user) {
						if(user) {
							var meeting = new Meeting;
							meeting.sessionId = session.sessionId;
							meeting.advisor = req.user.id;
							meeting.atTime = new Date(req.body.atTime);
							meeting.client = user.id;
							meeting.save(function(err) {
								if(!err) {
									meeting.addToUsers;
									return res.status(200).send({
										success: true,
										message: 'SessionId created.',
										sessionId: meeting.sessionId,
										meetingTime: meeting.atTime.toString(),
										meetingId: meeting.id,
										meetingLink: meeting.link
									});
								} else {
									return res.status(500).send({
										success: false,
										message: 'Meeting could not be saved.'
									});
								}
								
							});
						} else {
							res.status(403).send({
								success: false,
								message: 'Client not found.'
							});
						}
					});
				} else {
					return res.status(500).send({
						success: false,
						message: 'Failed to create sessionId'
					});
				}
			});
		}
};


exports.generateSessionToken = function(req, res, ot) {  // requires sessionId
	if (!req.user) {
		return res.status(403).send({ 
		        success: false, 
		        message: 'Please login.' 
		    });
	} else {
		// create token
		Meeting.findOne({"sessionId": req.body.sessionId }, function(err, meeting) {
			if(meeting){
				var ot_role = "publisher";
				if(req.user.role === 'Advisor') {
					ot_role = "moderator";
				}
				token = ot.generateToken(meeting.sessionId, {
					role : ot_role,
					expireTime: (new Date().getTime() / 1000)+(24 * 60 * 60), // one day
					data : 'name=' + req.user.fullName
				});
				return res.status(200).send({
										success: true,
										message: 'Session token created.',
										sessionToken: token,
										meetingLink: meeting.link
									});

			} else {
				return res.status(403).send({
					success: false,
					message: 'Meeting with your sessionId was not found.'
				});
			}
		});

	}

};



exports.list = function(req, res, ot) {
	if(!req.user) {
		return res.status(403).send({ 
		        success: false, 
		        message: 'Please login.' 
		    });
	} else {

		if (req.user.role === 'Advisor' || req.user.role === 'Admin') {
			Meeting.find({ 'advisor' : req.user}).populate('client advisor', 'firstName lastName').exec(function(err, meetings) {
				if (err) {
					return res.status(403).send({
						success: false,
						message: 'Encountered database error'
					});
				} else {
					return res.status(200).send({
											success: true,
											message: 'Scheduled meetings',
											meetings: meetings
										});
				}
			});
		} else {
			Meeting.find({ 'client' : req.user.id}).populate('client advisor', 'firstName lastName').exec(function(err, meetings) {
				if (err) {
					return res.status(403).send({
						success: false,
						message: 'Encountered database error'
					});
				} else {
					return res.status(200).send({
											success: true,
											message: 'Scheduled meetings',
											meetings: meetings
										});
				}
			});
		}
	}
};


exports.detail = function(req, res) {
	if(!req.user) {
		return res.status(403).send({ 
		        success: false, 
		        message: 'Please login.' 
		    });
	} else {
		var meetingLink = req.params.meetingLink;
		Meeting.findOne({"link" : meetingLink}).populate('client advisor', 'firstName lastName').exec(function(err, meeting) {
			if (!err) {
				res.status(200).send({
										success: true,
										client: meeting.client.fullName,
										advisor: meeting.advisor.fullName,
										sessionId: meeting.sessionId,
										atTime: meeting.atTime.toString(),
										link: meeting.link,
										updatedAt: meeting.updatedAt.toString(),
										createdAt: meeting.createdAt.toString()
									});
			} else {
				res.status(403).send({ 
		        success: false, 
		        message: 'Meeting not found' 
		    });
			}
		});
	}
};

exports.update = function(req, res) {
	if(!req.user) {
		return res.status(403).send({ 
		        success: false, 
		        message: 'Please login.' 
		    });
	} else {
		var meetingLink = req.params.meetingLink;
		Meeting.findOne({"link" : meetingLink}, function(err, meeting) {
			if (!err) {
				var newTime = new Date(req.body.newTime);	
				
				if (newTime == 'Invalid Date') {
					return res.status(403).send({
							success: false,
							message: 'Invalid meeting time'
					});
				}
				meeting.atTime = newTime;
				meeting.save(function(err) {
					if(!err) {
						res.status(200).send({
							success: true,
							newTime: meeting.atTime.toString(),
							message: 'Meeting time updated'
						});
					} else {
						res.status(500).send({
							success: false,
							message: 'Internal error while updating meeting time.'
						});
					}
				});
				
			} else {
				res.status(403).send({ 
		        success: false, 
		        message: 'Meeting not found' 
		    });
			}
		});
	}
};

exports.cancel = function(req, res) {
	if(!req.user) {
		return res.status(403).send({ 
		        success: false, 
		        message: 'Please login.' 
		    });
	} else {
		var meetingLink = req.params.meetingLink;
		Meeting.findOne({"link" : meetingLink}, function(err, meeting) {
			if (!err) {
				meeting.remove(function(err) {
					if(!err) {
						res.status(200).send({
							success: true,
							message: 'Meeting cancelled'
						});
					} else {
						res.status(500).send({
							success: false,
							message: 'Internal error while cancelling the meeting'
						});
					}
				});
			} else {
				res.status(403).send({ 
		        success: false, 
		        message: 'Meeting not found' 
		    });
			}
		});
	}
};