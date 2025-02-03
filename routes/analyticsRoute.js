const express = require("express");
const router = express.Router();

const url = require("../models/url");
const Analytics = require("../models/analytics");
//----------------------------------------------class----------------------------------------------
class AnalyticsController {
  //function to Get URL Analytics
  async urlAnalytics(req, res) {
    const analytics = await Analytics.findOne({ customAlias: req.params.alias });
    
    if (!analytics) {
      return res.status(404).json({ error: "Data not found" });
    }

    // Aggregate data for the past 7 days
    const recentClicks = analytics.clicksByDate.filter(
      (click) =>
        new Date(click.date).getTime() >= new Date() - 7 * 24 * 60 * 60 * 1000
    );

    res.json({
      totalClicks: analytics.totalClicks,
      uniqueUsers: analytics.uniqueUsers,
      clicksByDate: recentClicks,
      osType: analytics.osType,
      deviceType: analytics.deviceType,
    });
  }
}

//created class instance
const analyticsController = new AnalyticsController();

//----------------------------------------------routes----------------------------------------------

//Get URL Analytics API
router.get(
  "/:alias",
  analyticsController.urlAnalytics.bind(analyticsController)
);

module.exports = router;
