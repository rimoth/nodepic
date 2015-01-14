// app/models/inode.js
// grab the mongoose module
var mongoose = require('mongoose');

// Define document structure for inode
var inodeSchema = new mongoose.Schema({
    id : {type : String, default: ''},
    name : {type : String, default: ''},
    dateTimeOriginal : {type : Date },
    isDirectory : {type : Boolean, default: false},
    relativePath : {type : String, default: ''},
    thumbUrl : {type : String, default: ''},
    imageUrl : {type : String, default: ''},
    description  : {type : String, default: ''},
    gps : mongoose.Schema.Types.Mixed
});

// define our inode model to create instances of data that will be stored in documents
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('inode', inodeSchema);
