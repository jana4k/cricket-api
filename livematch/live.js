const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { CommentaryExtractor } = require("./commentary");
const { ScorecardExtractor } = require("./scorecard");
const app = express();
const port = 3000;
const { getFlagURL } = require("../data/flags");

class MatchDetailsExtractor {
  constructor(cheerio) {
    this.cheerio = cheerio;
  }

  extractMatchID(url) {
    const matchIDRegex = /scorecard\/(\d+)/;
    const matchIDMatch = url.match(matchIDRegex);
    return matchIDMatch ? matchIDMatch[1] : null;
  }

  extractURL(html, selector) {
    const $ = this.cheerio.load(html);
    const element = $(selector);
    return element.length ? element.attr("href") : null;
  }

  async getMatchDetails(url) {
    try {
      const response = await axios.get(url);
      const commentaryURL = this.extractURL(
        response.data,
        "a[href*='commentary']"
      );
      const scorecardURL = this.extractURL(
        response.data,
        "a[href*='scorecard']"
      );

      if (!scorecardURL) {
        throw new Error("No scorecardURL found.");
      }

      const matchID = this.extractMatchID(scorecardURL);

      const titleRegex = /\/scorecard\/\d+\/([^/]+)/;
      const titleMatch = scorecardURL.match(titleRegex);
      const titlePart = titleMatch ? titleMatch[1] : "";

      const constructedCommentaryURL = `https://www.crictable.com/commentary/${matchID}/${titlePart}`;
      const scorecardAbsoluteUrl = "https://www.crictable.com" + scorecardURL;
      return {
        matchID,
        commentaryURL: constructedCommentaryURL,
        scorecardURL: scorecardAbsoluteUrl,
      };
    } catch (error) {
      console.error("Error fetching match details:", error.message);
      return null;
    }
  }
}

async function processLiveMatch($, element, matchDetailsExtractor) {
  const title = $(element).find(".matchheader").text().trim();
  const teamElements = $(element).find(".cb-ovr-flo");
  const teams = [];

  for (let i = 0; i < teamElements.length; i += 2) {
    const name = teamElements.eq(i).text().trim();
    const score = teamElements
      .eq(i + 1)
      .text()
      .trim();
    const team = { name, score };
    teams.push(team);
  }

  const score = $(element)
    .find(".ui-bat-team-scores .cb-ovr-flo")
    .text()
    .trim();
  const status = $(element).find(".tls-ui-status").text().trim();
  const scorecardUrl = $(element).find(".btn.btn-default").attr("href");

  if (scorecardUrl) {
    // Fetch scorecard and match details in parallel to speed up the process
    try {
      const [scorecardResponse, matchDetails] = await Promise.all([
        axios.get(scorecardUrl),
        matchDetailsExtractor.getMatchDetails(scorecardUrl),
      ]);

      const scorecardData = cheerio.load(scorecardResponse.data);
      const matchElement = scorecardData(
        ".list-group h4.cb-list-item.ui-header.ui-branding-header"
      )
        .text()
        .trim();
      const match = matchElement.replace("•", "").trim();
      const filteredTeams = teams.filter((team) => team.name !== title);

      // Fetch team flags in parallel to speed up the process
      const flagPromises = teams.map((team) => getFlagURL(team.name));
      const teamFlags = await Promise.all(flagPromises);

      teams.forEach((team, index) => {
        team.flagUrl = teamFlags[index];
      });

      return {
        title,
        teams: filteredTeams,
        score,
        status,
        match,
        matchDetails,
      };
    } catch (error) {
      console.error("Error processing live matchs:", error.message);
      return null;
    }
  }
}

// Caching the live match data for a short duration (e.g., 1 minute) to reduce redundant requests
const cache = {
  data: null,
  timestamp: 0,
  duration: 60 * 1000, // 1 minute
};

async function getLiveMatchesData() {
  // Check if data exists in cache and not expired
  if (cache.data && Date.now() - cache.timestamp < cache.duration) {
    return cache.data;
  }

  const url = "https://www.crictable.com/live-matches/";
  const response = await axios.get(url);
  const data = cheerio.load(response.data);

  // Cache the data
  cache.data = data;
  cache.timestamp = Date.now();
  return data;
}

app.get("/matches", async (req, res) => {
  try {
    const $ = await getLiveMatchesData();
    const liveMatches = $(".ui-live-matches");
    const matchPromises = [];

    const matchDetailsExtractor = new MatchDetailsExtractor(cheerio);

    liveMatches.each((index, element) => {
      matchPromises.push(processLiveMatch($, element, matchDetailsExtractor));
    });

    const matches = await Promise.all(matchPromises);
    res.json(matches.filter(Boolean));
  } catch (error) {
    console.error("Internal server error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/commentary/:matchID/:title", async (req, res) => {
  try {
    const { matchID, title } = req.params;
    const commentaryExtractor = new CommentaryExtractor(cheerio);
    const commentary = await commentaryExtractor.getCommentary(matchID, title);
    res.json(commentary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/scorecard/:matchID/:title", async (req, res) => {
  try {
    const { matchID, title } = req.params;
    const scorecardExtractor = new ScorecardExtractor(cheerio);
    const scorecard = await scorecardExtractor.getScorecard(matchID, title);
    res.json(scorecard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = app;
