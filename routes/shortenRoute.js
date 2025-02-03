const express = require("express");
const rateLimit = require("express-rate-limit");

const userAgentParser = require("user-agent");

const router = express.Router();
const { nanoid } = require("nanoid");

const url = require("../models/url");

//limiter to limit repeted request to generate short url
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2, // limit each IP to 2 requests per minute
  message: "Too many requests, please try again later.",
});
//----------------------------------------------class----------------------------------------------
class ShortenController {
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

    return res.json({
      shortUrl: `http://localhost:8000/api/shorten/${customAlias}`,
      createdAt: Date.now(),
    });
  }

  //function to redirect short url to long url
  async redirectShortUrl(req, res) {
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
