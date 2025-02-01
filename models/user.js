const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: { type: String },
    email: { type: String },
    name: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const user = mongoose.model("user", userSchema);

module.exports = user;
