const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    userId: { type: String },
    shortUrl: { type: String },
    longUrl: { type: String },
    customAlias: {
      type: String,
    },
    topic: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const url = mongoose.model("url", urlSchema);

module.exports = url;
