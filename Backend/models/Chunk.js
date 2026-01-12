const mongoose = require("mongoose");
const chunkSchema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
      documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true
  },
    text: {
    type: String,
    required: true
  },
    embedding: {
    type: [Number],
    required: true
  },
    pageNumber: {
    type: Number
  }





});

module.exports = mongoose.model("Chunk", chunkSchema);
