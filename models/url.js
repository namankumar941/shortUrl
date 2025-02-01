const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    shortUrl: { type: String },
    longUrl : {type: String},
    customAlias : {
      type: String
    },
    topic :{type: String},
  },
  { timestamps: true }
);

const url = mongoose.model("url", urlSchema);

module.exports = url;