// app/imageIndexing


var exec = require('querystring');
//var	fs = require('fs');
var util = require('util');
var fs = require('fs-extra');
var path = require('path');
var lwip = require('lwip');
var readdirp = require('readdirp');
var ExifImage = require('exif').ExifImage;
var Inode = require('./models/inode');


function createThumbnail(sourceImage, thumb) {
	'use strict';
	// We are assuming valid source image file and thumb file.
	// Let's create a thumbnail for client display
	lwip.open(sourceImage, function(err, image) {
		if (err) return console.error(err);

		// We need to scale by the smaller the width and height ratios.
		var widthRatio=200/image.width();
		var heightRatio=120/image.height();
		var scaleRatio=(widthRatio>heightRatio ? heightRatio : widthRatio);
		image.scale(scaleRatio, function(err, image) {
			image.writeFile(thumb, function(err) {
	 			if (err) {
	 				util.log(err);
	 			} else {
					util.log('created thumb nail : '+ thumb);
	 			}
	 		});
		});
	});
}

function parseDate(input) {
  'use strict';
  var parts = input.split(/[\/ .:]/);
  // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
  return new Date(parts[0], parts[1]-1, parts[2],parts[3],parts[4],parts[5]); // Note: months are 0-based
}

function scanInbox(inbox) {
	util.log('checking inbox: ' + inbox);
	// let's check for any jpgs in inbox
	// Shouldn't need to include 
	readdirp({ root: inbox, fileFilter: [ '*.jpg' ], entryType: 'all' })
		.on('data', function (entry) {
			util.log(entry.fullPath);
			// OK Let's look at the EXIF data and determine path and filename from the EXIF datetime
			// MIght be best to log the photo first so we know of its existence - better from a transaction point of view?
			// Use camera name as suffix
			// Increment counter if file of same name exists.
			// Move to correct location (year/month) and rename the file.
			// Make a thumbnail
			// update database.

	});
}


function scanTree(dir, indexDir, done) {
	'use strict';

	console.log('started scanning '+ dir);
	// Scan for JPG including folders.
	readdirp({ root: dir, fileFilter: [ '*.jpg' ], entryType: 'all' })
		.on('data', function (entry) {

		var deviceId = '1'; // assume this deviceId
		var thumb =''; // filename for thumbnail

   		console.log('found: ' + ( entry.stat.isDirectory() ? 'folder: ' : 'image: ')+ entry.path);

        // See if this object already exists.
        Inode.findOne({id: deviceId+':/'+entry.fullPath}, function(err,objectFound) {
        	if(err) return console.error(err);
        	if (objectFound === null) {
        		
				// OK, No record of this in the database, let's add it.
		        var newObj = new Inode({
        			id: deviceId+':/'+entry.fullPath,
        			name : entry.name,
    				isDirectory : entry.stat.isDirectory(),
    				relativePath : entry.parentDir,
    				imageUrl : '/images/'+ entry.path,
    				description  : ''
        		});
	        	thumb = entry.parentDir + '/' + newObj._id + '.jpg';
	        	newObj.thumbUrl = '/thumbs/' + thumb;

       			newObj.save(function(err,newObj) {
		        	if (err) return console.error(err);
	        		// Saved image entry to database, now create thumbnail.
   					util.log('added to db ' + ( entry.stat.isDirectory() ? 'folder: ' : 'image: ')+ entry.path);
   					// Photo or Folder
   					if (entry.stat.isFile()) {


			        	// grab any exif data we want recording in the database
						var exifData = new ExifImage({ image : entry.fullPath }, function (err, exifData) {
			        		if(err) return console.error(err);
            				newObj.dateTimeOriginal = parseDate(exifData.exif.DateTimeOriginal);
            				newObj.gps = exifData.gps;
			       			newObj.save(function(err,newObj) {
					        	if (err) return console.error(err);
					        });
    					});

    					// Let's create a thumbnail - could push directory check into function.
						fs.ensureDir(indexDir + '/' + entry.parentDir, function(err) {
							if (err) return console.log(err);
							createThumbnail(entry.fullPath, indexDir + '/' + thumb, function(err){
								console.log('not executed?');
       							if(err) return console.error(err);
   							});
   						});
       				} 
	    		});

        	} else {
       			util.log('exists in db ' + ( entry.stat.isDirectory() ? 'folder: ' : 'image: ')+ entry.path);
        	}
        });

        //entry attributes
		// parentDir     :  'test/bed/root_dir1',
		// fullParentDir :  '/User/dev/readdirp/test/bed/root_dir1',
		// name          :  'root_dir1_subdir1',
		// path          :  'test/bed/root_dir1/root_dir1_subdir1',
		// fullPath      :  '/User/dev/readdirp/test/bed/root_dir1/root_dir1_subdir1',
		// stat          :  [ ... ]

		// stats.isFile()
		// stats.isDirectory()

  	});
    
}

exports.scanTree = scanTree;
exports.scanInbox = scanInbox;
