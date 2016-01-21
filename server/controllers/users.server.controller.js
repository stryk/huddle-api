var User = require('mongoose').model('User');
var jwt = require('jsonwebtoken');


var getErrorMessage = function(err) {
	var message = '';
	if (err.code) {
		switch (err.code) {
			case 11000:
			case 11001:
				message = 'Username already exists';
				break;
			default:
				message = 'Something went wrong';
		}
	} else {
		for (var errName in err.errors) {
			if (err.errors[errName].message) message = err.errors[errName].message;
		}
	}
	return message;
};

exports.login = function(req, res, secret) {
	if (!req.user) {
		var uName = req.body.username;
		var password = req.body.password;
		User.findOne({username: uName}, function(err, user){
			if(!err){
				if(user) {
					var authenticated = user.authenticate(password);
					if (authenticated) {
						// if user is found and password is right
		        // create a token
		        var token = jwt.sign({username: user.username}, secret, {
		          expiresIn: 86400 // expires in 24 hours (seconds)
		        });
		        return res.status(200).json( { "success" : true,
		      																	"token" : token});
					} else {
						return res.status(500).json( {"success" : false,
																					"message" : "Wrong username or password"});
					}
				} else {
					return res.status(403).json({"success" : false,
																			"message" : "user not found."});
				}
			} else {
				return res.status(403).json({"success" : false,
																			"message" : "db error occurred."});
			}
		});
	} else {
		return res.status(403).json( { "success" : false,
																		"message" : "Already logged in."});
	}

}

exports.signup = function(req, res, secret) {

	if (!req.user) {
		var user = new User(req.body);
		var message = null;
		var rawPassword = user.password;
		user.provider = 'local';

		user.save(function(err) {
			if (err) {
				var message = getErrorMessage(err);
				return res.status(500).json({ "status" : "error",
																		 "message" : message });
			}
			var authenticated = user.authenticate(rawPassword);
			if (authenticated) {
				// if user is found and password is right
        // create a token
        User.findOne({"username":user.username}, function(err, newUser) {
        	if (!err) {
        		var token = jwt.sign({user: newUser.username}, secret, {
	          expiresIn: 86400 // expires in 24 hours (seconds)
	        });
	        return res.status(200).json( { "status" : "success",
	      																	"token" : token});
	        } else {
	        	return res.status(200).json( { "status" : "success"});
	        }
        });
        
			} else {
				return res.status(500).json( {"status" : "error",
																			"message" : "Unexpected error during user registration."});
			}
		});
	} else {
		return res.json({ message: 'user already signed in.' });
	}
};


exports.list = function(req, res) {
	if (!req.user) {
		return res.status(403).send({ 
		        success: false, 
		        message: 'Please login.' 
		    });
	} else {
		if (req.user.role === 'Client') {
			return res.status(403).send({
				success: false,
				message: 'Unauthorized access'
			});
		} else {
			User.find({}, function(err, users) {
				if (err) {
					return res.status(500).send({
						success: false,
						message: 'Error occured.'
					});
				} else {
					var usersList = [];
					for (var i in users) {
						var userData = { 'username' : users[i].username,
															'firstName' : users[i].firstName,
															'lastName' : users[i].lastName,
															'createdAt' : users[i].createdAt.toString()};
						usersList.push(userData);
					}
					return res.status(200).send(JSON.stringify(usersList));
				}
			});
		}
		
	}
};

exports.read = function(req, res) {

}



exports.update = function(req,res, next) {
	User.findByIdAndUpdate(req.user.id, req.body, function(err, user) {
		if (err) {
			return next(err);
		} else {
			res.json(user);
		}
	});
};

exports.delete = function(req, res, next) {
	req.user.remove(function(err) {
		if (err) {
			return next(err);
		} else {
			res.json(req.user);
		}
	})
};
