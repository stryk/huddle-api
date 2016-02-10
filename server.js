
var express = require('express'),
	fs = require('fs'),
	https = require('https'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'), // logging requests
  compression = require('compression');


var app = module.exports = express();
  
  
try {
  config = JSON.parse(fs.readFileSync('./config/config.json'));
} catch (err) {
  console.log('Error reading config.json - have you copied config.json.sample to config.json? ',
    err);
  process.exit();
}

var mongoose = require('./config/mongoose'),
db = mongoose(config);

var logger = fs.createWriteStream('./log/server.log', {flags: 'a'});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', { "stream": logger }));
} else if (process.env.NODE_ENV === 'production') {
  app.use(compression());
}

var useSSL = fs.existsSync('./config/ssl/ssl.key') &&
    fs.existsSync('./config/ssl/ssl.crt');

if (useSSL) {
  var privateKey  = fs.readFileSync('./config/ssl/ssl.key', 'utf8'),
    certificate = fs.readFileSync('./config/ssl/ssl.crt', 'utf8');
  var credentials = {key: privateKey, cert: certificate};
}

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Add headers
app.use(function(req, res, next) {
    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization')
        res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE')
        if (req.method === 'OPTIONS') return res.send(200)
    }
    next()
})
// app.use(methodOverride());



// opentok
var OpenTok = require('opentok');
var ot = new OpenTok(config.ot_apiKey, config.ot_apiSecret);
app.set('config', config);
app.set('otok', ot);

var port = config.port || 3000;        // set our port

// ROUTES FOR OUR API
var router = express.Router();   
require('./server/routes.js')(router, useSSL);


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================


if (!useSSL) {
  app.listen(port, function() {
    console.log('API server running at port: ' + port);
  });
} else {
  https.createServer(credentials, app).listen(port, function() {
    console.log('API server running at port: ' + port);
  });
}



