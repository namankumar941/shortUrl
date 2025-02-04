const express = require("express");
const router = express.Router();
const axios = require("axios");

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

  //function to Get Overall Analytics
  async overallAnalytics(req, res) {
    //get userid from accesstoken when called through postman
    if (!req.user) {
      const token = req.headers["authorization"];
      if (!token) {
        return res.status(404).json({ error: "User not authenticated" });
      }
      const response = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: token, // Pass the access token in the Authorization header
          },
        }
      );
      req.user = { userId: response.data.sub };
    }

    //get all urls by the authenticated user
    const allUrls = await url.find({ userId: req.user.userId });
    const totalUrls = allUrls.length;
    let totalClicks = 0;
    let uniqueUsers = 0;
    let clicksByDate = [];
    let osType = [];
    let deviceType = [];

    //access all urls one by one
    for (const url of allUrls) {
      const analytics = await Analytics.findOne({
        customAlias: url.customAlias,
      });

      //increment number of total clicks
      totalClicks = totalClicks + analytics.totalClicks;

      //increment number of unique Users
      uniqueUsers = uniqueUsers + analytics.uniqueUsers;

      //generate and update clicksByDate array for all url generated by the authenticated user
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

      //generate and update osType array for all url generated by the authenticated user
      for (const analyticsOsType of analytics.osType) {
        const currentOsType = osType.find(
          (os) => os.osName === analyticsOsType.osName
        );
        if (currentOsType) {
          currentOsType.uniqueClicks =
            currentOsType.uniqueClicks + analyticsOsType.uniqueClicks;
          currentOsType.uniqueUsers =
            currentOsType.uniqueUsers + analyticsOsType.uniqueUsers;
        } else {
          osType.push({
            osName: analyticsOsType.osName,
            uniqueClicks: analyticsOsType.uniqueClicks,
            uniqueUsers: analyticsOsType.uniqueUsers,
          });
        }
      }

      //generate and update deviceType array for all url generated by the authenticated user
      for (const analyticsDeviceType of analytics.deviceType) {
        const currentDeviceType = deviceType.find(
          (device) => device.deviceName === analyticsDeviceType.deviceName
        );
        if (currentDeviceType) {
          currentDeviceType.uniqueClicks =
            currentDeviceType.uniqueClicks + analyticsDeviceType.uniqueClicks;
          currentDeviceType.uniqueUsers =
            currentDeviceType.uniqueUsers + analyticsDeviceType.uniqueUsers;
        } else {
          deviceType.push({
            deviceName: analyticsDeviceType.deviceName,
            uniqueClicks: analyticsDeviceType.uniqueClicks,
            uniqueUsers: analyticsDeviceType.uniqueUsers,
          });
        }
      }
    }

    res.json({
      totalUrls: totalUrls,
      totalClicks: totalClicks,
      uniqueUsers: uniqueUsers,
      clicksByDate: clicksByDate,
      osType: osType,
      deviceType: deviceType,
    });
  }
}

//created class instance
const analyticsController = new AnalyticsController();

//----------------------------------------------routes----------------------------------------------

// Get Overall Analytics API
router.get(
  "/overall",
  analyticsController.overallAnalytics.bind(analyticsController)
);

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
