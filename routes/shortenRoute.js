const express = require("express");
const router = express.Router();
const { nanoid } = require("nanoid");

const url = require("../models/url");

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
      const existingAlias = await url.findOne({ alias: body.customAlias });
      if (existingAlias) {
        return res.status(400).json({ error: "Alias already taken" });
      }
      customAlias = body.customAlias;
    }

    if (!body.topic) {
      await url.create({
        shortUrl: `http://localhost:8000/api/shorten/${customAlias}`,
        longUrl: body.longUrl,
        customAlias: customAlias,
      });
    } else {
      await url.create({
        shortUrl: `http://localhost:8000/api/shorten/${customAlias}`,
        longUrl: body.longUrl,
        customAlias: customAlias,
        topic: body.topic,
      });
    }

    return res.json({
      shortUrl: `http://localhost:8000/api/shorten/${customAlias}`,
      createdAt: Date.now(),
    });
  }

  async redirectShortUrl() {}
}

//created class instance
const shortenController = new ShortenController();

//----------------------------------------------routes----------------------------------------------
router.post("/", shortenController.createShortUrl.bind(shortenController));

router.get("/", shortenController.redirectShortUrl.bind(shortenController));

module.exports = router;
