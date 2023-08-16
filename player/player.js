const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");

const app = express();

function parseBattingStats(html) {
  const $ = cheerio.load(html);
  const battingStats = [];

  // Find and extract batting statistics
  const battingStatsTable = $(
    '.cb-list-item:contains("Batting Statistics")'
  ).next();

  battingStatsTable.find("tbody tr").each((index, row) => {
    const [
      title,
      Test,
      ODI,
      T20I,
      IPL,
      strikeRate,
      highestScore,
      centuries,
      fifties,
      fours,
      sixes,
    ] = $(row)
      .find("td")
      .map((i, cell) => $(cell).text().trim())
      .get();

    battingStats.push({
      title,
      Test,
      ODI,
      T20I,
      IPL,
      strikeRate,
      highestScore,
      centuries,
      fifties,
      fours,
      sixes,
    });
  });

  return battingStats;
}

function parseBowlingStats(html) {
  const $ = cheerio.load(html);
  const bowlingStatsTable = $(
    '.cb-list-item:contains("Bowling Statistics")'
  ).next();
  const bowlingStats = [];

  bowlingStatsTable.find("tbody tr").each((index, row) => {
    const [
      title,
      Test,
      ODI,
      T20I,
      IPL,
      wickets,
      bestBowlingInnings,
      bestBowlingMatch,
      economy,
      average,
      fiveWickets,
      tenWickets,
    ] = $(row)
      .find("td")
      .map((i, cell) => $(cell).text().trim())
      .get();

    bowlingStats.push({
      title,
      Test,
      ODI,
      T20I,
      IPL,
      wickets,
      bestBowlingInnings,
      bestBowlingMatch,
      economy,
      average,
      fiveWickets,
      tenWickets,
    });
  });

  return bowlingStats;
}
app.get("/player/:playerId/:playerName", async (req, res) => {
  const playerId = req.params.playerId;
  const playerName = req.params.playerName;

  try {
    const response = await axios.get(
      `https://www.crictable.com/player/${playerId}/${playerName}`
    );
    const html = response.data;
    const $ = cheerio.load(html);

    const playerDetails = {
      name: $("h4.cb-list-item.ui-header.ui-branding-header").text(),
      born: $("td:contains('Born')").next().text(),
      age: $("td:contains('Age')").next().text(),
      teams: $("td:contains('Teams')").next().text(),
      nickname: $("td:contains('Nickname')").next().text(),
      batStyle: $("td:contains('Bat Style')").next().text(),
      bowlStyle: $("td:contains('Bowl Style')").next().text(),
    };

    const profile = $(".list-content span").text();
    const cleanedProfile = profile
      .replace(/TestODIT20IIPL/g, "")
      .replace(/\\/g, "");
    const profilePicUrl = $(".thumbnail img").attr("src");
    const battingStatsData = parseBattingStats(response.data);
    const bowlingStatsData = parseBowlingStats(response.data);
    res.json({
      playerId,
      profilePicUrl,
      playerName,
      playerDetails,

      battingStats: battingStatsData,
      bowlingStats: bowlingStatsData,

      cleanedProfile,
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = app;
