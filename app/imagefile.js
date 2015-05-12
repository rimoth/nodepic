//ImageFile.js

var ExifImage = require('exif').ExifImage;
var	fs = require('fs');
var fs2 = require('fs-extra');
var path = require('path');
var util = require('util');
//var utils = require('./utils');
var lwip = require('lwip');
var Inode = require('./models/inode');



Date.prototype.getMonthName = function() {
	var monthNames = [ "January", "February", "March", "April", "May", "June", 
            "July", "August", "September", "October", "November", "December" ];
    return monthNames[this.getMonth()];
}


function parseDate(input) {
  'use strict';
  var parts = input.split(/[\/ .:]/);
  // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
  return new Date(parts[0], parts[1]-1, parts[2],parts[3],parts[4],parts[5]); // Note: months are 0-based
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function getUniqueFileName(file,ctr,callback) {
	
	var suffix = '';
	if (ctr>0) suffix='-'+pad(ctr,3);
	var newFile = path.dirname(file)+'/'+path.basename(file,path.extname(file))+suffix+path.extname(file);
	fs.exists(newFile, function(exists) {
	    if (exists) {
    	    getUniqueFileName(file,ctr+1,callback);
    	}  else {
        	callback(false,newFile);
    	}
	});
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

function ImageFile (options, callback) {

	var self = this;

	if (!options) 
		var options = {};

	this.dateTimeOriginal = new Date();
	this.year;
	this.month;
	this.path;
	this.imageFileName;
	this.fullPath;


	if (!options.image) {
    	throw new Error('You have to provide an image.');
  	} else if (typeof callback !== 'function') {
	    throw new Error('You have to provide a callback function.');
  	} else {


		util.log('started processing: '+options.image);

		// Start by moving image to processing directory.
		// This may be excessive and processing could take place directly from inbox	
		var processFile = options.processPath+'/'+path.basename(options.image);
		fs2.move(options.image, processFile, function(err) {
  			if (err) return console.error(err);
 			// Retrieve exifData - look for newer library! 	
  	  		var exifImageData = new ExifImage({ image : processFile }, function (err, exifData) {

  				if(err) {
  					if (err=='Error: No Exif segment found in the given image.') {
  						console.log('Need to move this file to NoExifData Folder for manual sorting')
						return callback(false,this);
  					} else {
  						return console.error(err);  					
  					}

	  			}

  				// Let's work out the desired filename from the Exif data successfully rertrieved from the image file
				this.dateTimeOriginal = parseDate(exifData.exif.DateTimeOriginal);
				this.year = this.dateTimeOriginal.getFullYear();
				this.month = ("0" + (this.dateTimeOriginal.getMonth() + 1)).slice(-2)+' '+ this.dateTimeOriginal.getMonthName();
				this.path = this.year+'/'+this.month;
				this.imageFileName = this.dateTimeOriginal.toISOString().substr(0, 19).replace('T', ' ').replace(':','.').replace(':','.')+'.jpg';
				this.fullPath = options.libraryPath+'/'+this.path+'/'+this.imageFileName;

				// Need to validate the filename as possible to have more than 1 image for each second in time.
				// Following function will return filename with sufix '-xxx' should any duplicates be encountered.
				getUniqueFileName(this.fullPath, 0, function (err, uniqueFileName) {
					if (err) return console.error(err);

					// Move the image into the library with the new name
					fs2.move(processFile, uniqueFileName, function(err) {
						if (err) return console.error(err);
				   		util.log('image saved to: '+ uniqueFileName);

			   			// OK Let's Record it in the database.

			   			//var deviceId ='1';
		    			//var newObj = new Inode({
        				//	id: deviceId+':/'+ this.fullPath,
        				//	name : uniqueFileName,
    					//	isDirectory : false,
    					//	relativePath : this.path,
    					//	imageUrl : '/images/'+ imagePath+'/'+imageName,


    					//	// All good to here 12th May 2015

    					//	description  : '',
    					//	dateTimeOriginal : imageDate,
    					//	gps : exifData.gps,
    					//	make : exifData.image.image.make,
    					//	model : exifData.image.image.model
	        			//});
   	    	 			//thumb = imagePath + '/' + newObj._id + '.jpg';
		        		//newObj.thumbUrl = '/thumbs/' + thumb;
						//newObj.save(function(err,newObj) {
						//   	if (err) return console.error(err);

						//	fs.move(processFile, imageFullPath, function(err) {
  						//		if (err) return console.error(err);
					    //		util.log('New image saved to: '+imageFullPath);
						//	});
						//});

			   			// Let's create any thumbnails.
			   			createThumbnail(uniqueFileName, options.indexPath + '/' + this.imageFileName, function(err){
							console.log('not executed?');
    						if(err) return console.error(err);
						});

						// Let's process the next image.
						callback(false,this);
					});
				})
  			});  	
		});
  	}


  // initialize image properties
  //this.bar = bar;
  //this.baz = 'baz'; // default value

// class methods
//Foo.prototype.fooBar = function() {

};
// export the class
module.exports = ImageFile;