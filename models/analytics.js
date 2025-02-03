const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  customAlias: {
    type: String,
  },
  totalClicks: { type: Number, default: 0 },
  uniqueUsers: { type: Number, default: 0 },
  clicksByDate: [
    {
      date: String,
      clickCount: { type: Number, default: 0 },
    },
  ],
  osType: [
    {
      osName: String,
      uniqueClicks: { type: Number, default: 0 },
      uniqueUsers: { type: Number, default: 0 },
    },
  ],
  deviceType: [
    {
      deviceName: String,
      uniqueClicks: { type: Number, default: 0 },
      uniqueUsers: { type: Number, default: 0 },
    },
  ],
});

const analytics = mongoose.model("analytics", analyticsSchema);

module.exports = analytics;
