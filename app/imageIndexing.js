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

Date.prototype.getMonthName = function() {
	var monthNames = [ "January", "February", "March", "April", "May", "June", 
            "July", "August", "September", "October", "November", "December" ];
    return monthNames[this.getMonth()];
}


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

function addFolderNode(libraryPath,relativePath,folderName) {
	'use strict';
	var deviceId = '1'; // assume this deviceId
    var newObj = new Inode({
  		id: deviceId+':/'+libraryPath+'/'+folderName,
       	name : folderName,
   		isDirectory : true,
   		relativePath : relativePath,
    	imageUrl : '/images/'+ relativePath +'/'+folderName,
	});
	var thumb = relativePath + folderName + '/' + newObj._id + '.jpg';
	newObj.thumbUrl = '/thumbs/' + thumb;
  	newObj.save(function(err,newObj) {
		if (err) return console.error(err);
	    util.log('added to folder node to db ' + folderName);
	    return true;
	});

}

function checkYearMonth(pathLibrary,imageYear,imageMonth) {
	'use strict';
	    util.log('checking folder for '+imageYear+imageMonth);	
	var deviceId = '1'; // assume this deviceId
	Inode.findOne({id: deviceId+':/'+pathLibrary+'/'+imageYear}, function(err,objectFound) {
		util.log('checking folder for '+deviceId+':/'+pathLibrary+'/'+imageYear);	
       	if(err) return console.error(err);
       	if (objectFound === null) {
			// OK, No record of this in the database, let's add it.
			var result = addFolderNode(pathLibrary,'',imageYear);
				util.log('Checking for month...');	
		       	if(err) return console.error(err);

				Inode.findOne({id: deviceId+':/'+pathLibrary+'/'+imageYear+'/'+imageMonth}, function(err,objectFound) {
			       	if(err) return console.error(err);
       				if (objectFound === null) {
       					util.log('adding month for '+imageYear+imageMonth);	
						// OK, No record of this in the database, let's add it.
						var result = addFolderNode(pathLibrary,imageYear+'/'+imageMonth);
					};
				});
			
		};
	});

}

function scanInbox(inbox,inProcess,pathLibrary,pathIndex) {
	util.log('checking inbox: ' + inbox);

	var deviceId = '1'; // assume this deviceId
	var thumb =''; // filename for thumbnail
	// let's check for any jpgs in inbox
	// Shouldn't need to include 
	readdirp({ root: inbox, fileFilter: [ '*.jpg' ], entryType: 'files' })
		.on('data', function (entry) {
			util.log('Processing: '+ entry.fullPath);
			// move the file to /processing.
			// this may help with files still being written to, and also we can decide to limit number of files.
			var processFile = inProcess +'/'+entry.path;
			fs.move(entry.fullPath, processFile, function(err) {
  				if (err) return console.error(err);

  				// Perhaps first we should MD5 first & foremost to identify the file?

  				// Should be able to call below as function with parameter to indicate if renaming and move is required.
  				// grab any exif data we want recording in the database
  				// Need to call a function to getExifDAta so can fallback if it fails.
				var exifData = new ExifImage({ image : processFile }, function (err, exifData) {
			    	if(err) return console.error(err);
			    	

			    	var imageDate = new Date();
			    	imageDate = parseDate(exifData.exif.DateTimeOriginal);
			    	var imageYear = imageDate.getFullYear();
			    	var imageMonth = ("0" + (imageDate.getMonth() + 1)).slice(-2)+' '+ imageDate.getMonthName();
			    	var imagePath = imageYear+'/'+imageMonth;
		    		var imageName = imageDate.toISOString().substr(0, 19).replace('T', ' ').replace(':','.').replace(':','.')+'.jpg';
		    		var imageFullPath = pathLibrary+'/'+imagePath+'/'+imageName;

		    		// Need to check if this image already exists, and if so increment counter.
		    		checkYearMonth(pathLibrary,imageYear,imageMonth, function(err){
				    	if(err) return console.error(err);
		    		})


		    		var newObj = new Inode({
        				id: deviceId+':/'+ imageFullPath,
        				name : imageName,
    					isDirectory : entry.stat.isDirectory(),
    					relativePath : imagePath,
    					imageUrl : '/images/'+ imagePath+'/'+imageName,
    					description  : '',
    					dateTimeOriginal : imageDate,
    					gps : exifData.gps
    					//,
    					//make : exifData.exif.image.make,
    					//model : exifData.exif.image.model
        			});
        			thumb = imagePath + '/' + newObj._id + '.jpg';
	        		newObj.thumbUrl = '/thumbs/' + thumb;
					newObj.save(function(err,newObj) {
					   	if (err) return console.error(err);

						fs.move(processFile, imageFullPath, function(err) {
  							if (err) return console.error(err);
				    		util.log('New image saved to: '+imageFullPath);
						});
					});

					// We will have folders without corresponding entries in the database!!

					// Do we just do a folder scan? - no run a query name <> relativePath

				});
    		});

		});
			// OK Let's look at the EXIF data and determine path and filename from the EXIF datetime
			// MIght be best to log the photo first so we know of its existence - better from a transaction point of view?
			// Use camera name as suffix
			// Increment counter if file of same name exists.
			// Move to correct location (year/month) and rename the file.
			// Make a thumbnail
			// update database.
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
