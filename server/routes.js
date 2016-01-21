var users = require('../server/controllers/users.server.controller');
var meetings = require('../server/controllers/meetings.server.controller');
var app = require('../server');
var User = require('mongoose').model('User');
var jwt = require('jsonwebtoken');

module.exports = function (router, redirectSSL) {

	router.get('*', function(req, res, next) {
    if (redirectSSL && req.protocol !== 'https' &&
      req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://' + req.host + req.url);
    } else {
      next();
    }
  });

	router.route('/users/register')
		.post(function(req, res) {
			users.signup(req, res, app.get('config').token_secret);
	});

	router.get('/', function(req, res){
  	res.status(200).json({ message: 'Welcome to Huddle API Engine' });   
	});

	router.route('/login')
		.post(function(req, res) {
			users.login(req, res, app.get('config').token_secret);
	});

	// route middleware to verify a token
	router.use(function(req, res, next) {
		if (app.get('config').environment == "production") {
				// check header or url parameters or post parameters for token
		  var token = req.body.token || req.query.token || req.headers['x-access-token'];

		  // decode token
		  if (token) {

		    // verifies secret and checks exp
		    jwt.verify(token, app.get('config').token_secret, function(err, decoded) {      
		      if (err) {
		        return res.json({ success: false, message: 'Token rejected.' });    
		      } else {
		        // if everything is good, save to request for use in other routes
		        var username = decoded.username;
		        User.findOne({"username": username}, function(err, user) {
		        	if (user) {
		        		req.user = user;    
		        		next();
		        	} else {
		        		return res.status(403).send({ 
						        success: false, 
						        message: 'User account no longer exists.' 
						    });
		        	}
		        });
		        
		      }
		    });

		  } else {

		    // if there is no token
		    // return an error
		    return res.status(403).send({ 
		        success: false, 
		        message: 'No token provided.' 
		    });
		    
		  }
		} else {
			User.find({}, function(err, users) {
				if(err) {
					console.log('Error during find query');
					err = new Error('internal error');
					throw err;
				} else if(users.length > 0) {
					req.user = users[0];
					next();
				}
			});
		}
	});


	router.route('/users')
		.get(users.list);

	router.route('/users/:userId')
		.get(users.read)
		.put(users.update)
		.delete(users.delete);

	router.route('/meetings')
		.post(function(req, res) {
			meetings.create(req, res, app.get('otok'));
		})
		.get(meetings.list);

	router.route('/meetings/generateToken')
		.post(function(req, res) {
			meetings.generateSessionToken(req, res, app.get('otok'))
	});

	router.route('/meetings/:meetingLink')
		.get(meetings.detail)
		.put(meetings.update)
		.delete(meetings.cancel);

}
