var mongoose = require('mongoose'),
	crypto = require('crypto'),
	Schema = mongoose.Schema;

var UserSchema = new Schema({
	firstName: String,
	lastName: String,
	email: {
		type: String,
		trim: true,
		unique: true,
		required: "email is required",
		match: [/.+\@.+\..+/, "Invalid e-mail address"],
		index: true,
		set: toLower
	},
	username: {
		type: String,
		trim: true,
		required: 'Username is required',
		unique: true,
		index: true,
		set: toLower
	},
	password: {
		type: String,
		required: 'Password is required',
		validate: [
			function(password) {
				return password.length >= 6;
			},
			'Password must be at least 6 characters long'
		]
	},
	salt: {
		type: String
	},
	provider: {
		type: String,
		required: 'Provider is required'
	},
	providerId: String,
	providerData: {},
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	},
	role: {
		type: String,
		enum: ['Admin', 'Advisor', 'Client'],
		default: 'Client'
	},
	website: {
		type: String,
		get: function(url) {
			if (!url) {
				return url;
			} else {
				if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
					url = 'http://' + url;
				}
				return url;
			}
		},
		set: toLower
	}

});

UserSchema.virtual('fullName').get(function() {
	return this.firstName + ' ' + this.lastName;
}).set(function(fullName) {
	var splitName = fullName.split(' ');
	this.firstName = splitName[0] || '';
	this.lastName = splitName[1] || '';
});

UserSchema.statics.findOneByUsername = function (username, callback) {
	return this.findOne({ userName: new RegExp(username, 'i')}, callback);
};

UserSchema.pre('save', function(next) {

	if (this.isNew) {
		this.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
		// var binPassword = new Buffer(this.password, 'base64');
		this.password = hashPassword(this.password, this.salt);
	}
	
	this.validate(function(val, err) {          
	  if (err) {
	    // handle error
	    console.log('Error creating new user');
	    var errjson = {};
	    if (err.name == 'ValidationError') {
	        for (field in err.errors) {
	            console.log(err.errors[field].message);
	            errjson[field] = err.errors[field].message;
	        }
	    }
	    return res.status(403).send(JSON.stringify(errjson));
	  } else {
			return next();
		}
	});
});
	


UserSchema.statics.loginByUsername = function(username, password, callback) {
	this.findOne({ userName: new RegExp(username, 'i')}, function(err, user){
		if (!err) {
			if (!user) {
				return callback(new Error("User not found."));
			} else {
				if (user.authenticate(password)) {
					return callback(err, user);
				}
			}
		} else {
			return callback(err);
		}
	});
};

UserSchema.statics.loginByEmail = function(userEmail, password, callback) {
	this.findOne({ email: userEmail.toLowerCase()}, function(err, user){
		if (!err) {
			if (!user) {
				return callback(new Error("User not found."));
			} else {
				if (user.authenticate(password)) {
					return callback(err, user);
				}
			}
		} else {
			return callback(err);
		}
	});
};

UserSchema.statics.findUniqueUsername = function(username, suffix, callback) {
	var _this = this;
	var possibleUsername = username + (suffix || '');
	_this.findOne({
		username: possibleUsername
	}, function(err, user) {
		if (!err) {
			if (!user) {
				callback(possibleUsername);
			} else {
				return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
			}
		} else {
			callback(null);
		}
	});
};

UserSchema.methods.hashPassword = function(password) {
	return hashPassword(password, this.salt);
};

UserSchema.methods.authenticate = function(password) {
	return this.password === this.hashPassword(password);
};

function hashPassword(password, salt) {
	var hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 512);
	return hashedPassword.toString('base64');
}

function toLower(str) {
	return str.toLowerCase();
}

UserSchema.set('toJSON', { getters: true, virtuals: true });
UserSchema.set('autoIndex', false);

mongoose.model('User', UserSchema);