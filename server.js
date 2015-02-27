// server.js

// modules =================================================
var express        = require('express');
var app            = express();
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');

var mongoose       = require('mongoose');

var imageIndexing = require('./app/imageIndexing');

var util = require('util');

// configuration ===========================================
    
// config files
var db = require('./config/db');
var config = require('./config/config');

// Determine paths to library, index and inbox
var pathLibrary = config.photoFolder+'/photos';
var pathIndex = config.photoFolder+'/index';
var pathInbox = config.photoFolder+'/inbox';

// set our port
var port = process.env.PORT || 8081; 

// connect to our mongoDB database 
// (uncomment after you enter in your own credentials in config/db.js)
mongoose.connect(db.uri); 

// get all data/stuff of the body (POST) parameters
// parse application/json 
app.use(bodyParser.json()); 

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); 

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true })); 

// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override')); 

// set the static files location /public/img will be /img for users
app.use(express.static(__dirname + '/public'));


// set route to thumbnails
app.use('/thumbs', express.static(pathIndex));
// set route to source images
app.use('/images', express.static(pathLibrary));

// routes ==================================================
require('./app/routes')(app); // configure our routes

// start app ===============================================
// startup our app at http://localhost:8080
app.listen(port);               

// shoutout to the user                     
console.log('Magic happens on port ' + port);

// expose app           
exports = module.exports = app;                         

// Let's check the inbox folder for new photos - every 10 seconds should suffice.
// might be a good idea to put readme files in inbox and image folders
// index folder should be hidden, but can do the same nonetheless
function inboxDaemon() {
	imageIndexing.scanInbox(pathInbox);
  	setTimeout(inboxDaemon, 10*1000);
}
setTimeout(inboxDaemon, 10*1000);

// Scan folder should be triggered by the UI, or major file change event.
// This is a mjor event call - a complete rescan
// Scan Folder
imageIndexing.scanTree(pathLibrary, pathIndex, function(err,results) {
	//console.log(results);
});









