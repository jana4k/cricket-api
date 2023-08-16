const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");

const app = express();

app.get("/schedule", async (req, res) => {
  try {
    const response = await axios.get("https://www.crictable.com/schedule/");
    const html = response.data;

    const $ = cheerio.load(html);

    const matches = [];

    $(".imso-hov[role='link']").each((index, element) => {
      const match = {};

      match.date = $(element).find(".imspo_mt__pm-inf.imso-medium-font").text();
      match.teams = [];

      $(element)
        .find(".ellipsisize[data-df-team-mid]")
        .each((i, teamElement) => {
          const team = $(teamElement).text();
          match.teams.push(team);
        });

      match.format = $(element).find(".imspo_mt__lg-st-co").text();
      match.startTime = $(element).find(".imspo_mt__game-status").text();

      const imageUrls = [];
      $(element)
        .find(".imso_btl__mh-logo")
        .each((i, imgElement) => {
          const imgUrl = $(imgElement).attr("src");
          imageUrls.push(imgUrl);
        });
      match.imageUrls = imageUrls;

      matches.push(match);
    });

    res.json(matches);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = app;
