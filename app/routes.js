// app/routes.js

// grab the image model we just created
var Inode = require('./models/inode');

    module.exports = function(app) {

        // server routes ===========================================================
        // handle things like api calls
        // authentication routes

        // sample api route
        app.get('/api/images*', function(req, res) {
            pathQuery = unescape(req.url.replace('/api/images',''));
            if (pathQuery.indexOf('/')===0) pathQuery=pathQuery.slice(1);
            // use mongoose to get all images in the database
            Inode.find({"relativePath" : pathQuery}, function(err, inodes) {

                // if there is an error retrieving, send the error. 
                // nothing after res.send(err) will execute
                if (err) res.send(err);
                res.json(inodes); // return all images in JSON format
            });
        });

        // route to handle creating goes here (app.post)
        // route to handle delete goes here (app.delete)

        // frontend routes =========================================================
        // route to handle all angular requests
        app.get('*', function(req, res) {
            res.sendfile('./public/views/index.html'); // load our public/index.html file
        });

    };