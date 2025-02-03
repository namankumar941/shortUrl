const express = require("express");
const router = express.Router();

const url = require("../models/url");
const Analytics = require("../models/analytics");
//----------------------------------------------class----------------------------------------------
class AnalyticsController {
  //function to Get URL Analytics
  async urlAnalytics(req, res) {
    const analytics = await Analytics.findOne({
      customAlias: req.params.alias,
    });

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

  //function to Get Topic-Based Analytics
  async topicAnalytics(req, res) {
    //get all urls under topic
    const allUrls = await url.find({ topic: req.params.topic });

    let totalClicks = 0;
    let uniqueUsers = 0;
    let clicksByDate = [];
    let urls = [];

    for (const url of allUrls) {
      const analytics = await Analytics.findOne({
        customAlias: url.customAlias,
      });

      //increment number of total clicks
      totalClicks = totalClicks + analytics.totalClicks;

      //increment number of unique Users
      uniqueUsers = uniqueUsers + analytics.uniqueUsers;

      //generate and update clicksByDate array for all url present in topic
      for (const date of analytics.clicksByDate) {
        const todayClick = clicksByDate.find(
          (click) => click.date === date.date
        );
        if (todayClick) {
          todayClick.clickCount = todayClick.clickCount + date.clickCount;
        } else {
          clicksByDate.push({
            date: date.date,
            clickCount: date.clickCount,
          });
        }
      }

      // push every url data required at client side
      urls.push({
        shortUrl: url.shortUrl,
        totalClicks: analytics.totalClicks,
        uniqueUsers: analytics.uniqueUsers,
      });
    }

    res.json({
      totalClicks: totalClicks,
      uniqueUsers: uniqueUsers,
      clicksByDate: clicksByDate,
      urls: urls,
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

// Get Topic-Based Analytics API
router.get(
  "/topic/:topic",
  analyticsController.topicAnalytics.bind(analyticsController)
);

module.exports = router;
