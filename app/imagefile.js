//ImageFile.js

var ExifImage = require('exif').ExifImage;
//var	fs = require('fs');
var fs = require('fs-extra');
var util = require('util');
//var utils = require('./utils');


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

  		var exifImageData = new ExifImage({ image : options.image }, function (err, exifData) {

  			if(err) return console.error(err);
			
			this.dateTimeOriginal = parseDate(exifData.exif.DateTimeOriginal);
			this.year = this.dateTimeOriginal.getFullYear();
			this.month = ("0" + (this.dateTimeOriginal.getMonth() + 1)).slice(-2)+' '+ this.dateTimeOriginal.getMonthName();
			this.path = this.year+'/'+this.month;
			this.imageFileName = this.dateTimeOriginal.toISOString().substr(0, 19).replace('T', ' ').replace(':','.').replace(':','.')+'.jpg';

			// Need to validate the filename possible to have more than 1 image for each

			this.fullPath = options.libraryPath+'/'+this.path+'/'+this.imageFileName;

			console.log('File'+options.image+' to '+ this.fullPath);

				fs.move(options.image, this.fullPath, function(err) {
  					if (err) return console.error(err);
				    util.log('new image saved to: '+this.fullPath);

					// Let's process the next image.
					callback(false,this);
				});




  		});

	    //this.loadImage(options.image, function (error, image) {
      	//if (error)
	    //   callback(error);
      	//else
	    //    callback(false, image);
	    //});
  	
  	}


  // initialize image properties
  //this.bar = bar;
  //this.baz = 'baz'; // default value

// class methods
//Foo.prototype.fooBar = function() {

};
// export the class
module.exports = ImageFile;