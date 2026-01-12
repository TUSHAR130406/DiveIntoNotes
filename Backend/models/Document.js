const mongoose = require("mongoose");

const documentSchema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
      originalFileName: {
    type: String,
    required: true
  },
    storedFileName: {
    type: String,
    required: true
  },
    mimeType: {//type of file
    type: String,
    required: true
  },
    uploadedAt: {
    type: Date,
    default: Date.now
  }




});


module.exports= mongoose.model("Document",documentSchema)