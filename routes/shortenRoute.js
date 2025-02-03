const express = require("express");
const rateLimit = require("express-rate-limit");

const UAParser = require("ua-parser-js");

const { createClient } = require("redis");
const client = createClient();

const router = express.Router();
const { nanoid } = require("nanoid");

const url = require("../models/url");
const Analytics = require("../models/analytics");

//limiter to limit repeted request to generate short url
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2, // limit each IP to 2 requests per minute
  message: "Too many requests, please try again later.",
});
//----------------------------------------------class----------------------------------------------
class ShortenController {
  constructor() {
    this.connectClient();
  }

  //connect to redis client
  async connectClient() {
    await client.connect();
  }

  //function to create short url and store it in database
  async createShortUrl(req, res) {
    const body = req.body;
    //if body is empty or long url is not present then return error
    if (!body || !body.longUrl) {
      return res.status(400).json({ error: "long URL is required" });
    }

    let customAlias;
    //generating customAlias if not present in body
    if (!body.customAlias) {
      customAlias = nanoid(8);
    } else {
      const existingAlias = await url.findOne({
        customAlias: body.customAlias,
      });
      if (existingAlias) {
        return res.status(400).json({ error: "Alias already taken" });
      }
      customAlias = body.customAlias;
    }

    if (!body.topic) {
      await url.create({
        userId: req.user.userId,
        shortUrl: `http://localhost:8000/api/shorten/${customAlias}`,
        longUrl: body.longUrl,
        customAlias: customAlias,
      });
    } else {
      await url.create({
        userId: req.user.userId,
        shortUrl: `http://localhost:8000/api/shorten/${customAlias}`,
        longUrl: body.longUrl,
        customAlias: customAlias,
        topic: body.topic,
      });
    }

    await Analytics.create({ customAlias: customAlias });

    await client.sAdd(customAlias, body.longUrl);

    return res.json({
      shortUrl: `http://localhost:8000/api/shorten/${customAlias}`,
      createdAt: Date.now(),
    });
  }

  //function to redirect short url to long url
  async redirectShortUrl(req, res) {
    let analytics = await Analytics.findOne({ customAlias: req.params.alias });

    if (analytics) {
      //increment total clicks
      analytics.totalClicks++;

      // Increment clicks for today
      const today = new Date().toISOString().split("T")[0];
      const todayClick = analytics.clicksByDate.find(
        (click) => click.date === today
      );
      if (todayClick) {
        todayClick.clickCount++;
      } else {
        analytics.clicksByDate.push({ date: today, clickCount: 1 });
      }

      //increment uniqueUsers clicks
      const clientIp = req.connection.remoteAddress;
      const currentIp = await client.sIsMember("ips", clientIp);
      if (!currentIp) {
        analytics.uniqueUsers++;
        await client.sAdd(`ips`, clientIp);
      }

      // retrieve the OS (Operating System) and device type from the request object
      const userAgent = req.headers["user-agent"];
      const parser = new UAParser();
      parser.setUA(userAgent);
      const result = parser.getResult();

      // modify os type
      const osType = analytics.osType.find(
        (os) => os.osName === result.os.name
      );
      if (osType) {
        osType.uniqueClicks++;
        if (!currentIp) {
          osType.uniqueUsers++;
        }
      } else {
        analytics.osType.push({
          osName: result.os.name,
          uniqueClicks: 1,
          uniqueUsers: 1,
        });
      }

      // modify os type
      const deviceName = result.device.type || "desktop"
      const deviceType = analytics.deviceType.find(
        (device) => device.deviceName === deviceName
      );
      if (deviceType) {
        deviceType.uniqueClicks++;
        if (!currentIp) {
          deviceType.uniqueUsers++;
        }
      } else {
        analytics.deviceType.push({
          deviceName: deviceName,
          uniqueClicks: 1,
          uniqueUsers: 1,
        });
      }

      //save all changes to database
      await analytics.save();
    }

    //check if redirecting url is present in redis or not
    const currentURL = await client.sMembers(req.params.alias);
    if (currentURL[0]) {
      // redirect to original URL
      return res.redirect(currentURL[0]);
    }

    const urlData = await url.findOne({ customAlias: req.params.alias });

    if (!urlData) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    // redirect to original URL
    res.redirect(urlData.longUrl);
  }
}

//created class instance
const shortenController = new ShortenController();

//----------------------------------------------routes----------------------------------------------

//post request to create short url and store it in database
router.post(
  "/",
  limiter,
  shortenController.createShortUrl.bind(shortenController)
);

//get request to redirect short url to long url
router.get(
  "/:alias",
  shortenController.redirectShortUrl.bind(shortenController)
);

module.exports = router;
