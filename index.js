const express = require("express");
const app = express();
const port = 3006;

const axios = require("axios");
const cheerio = require("cheerio");
const { getFlagURL } = require("./flags");

app.get("/", (req, res) => {
  res.send("Welcome to the Cricket API!");
});

app.get("/matches", async (req, res) => {
  try {
    const url = "https://www.crictable.com/live-matches/";
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const matches = [];

    $(".ui-live-matches").each((index, element) => {
      const title = $(element).find(".matchheader").text().trim();

      const teamsData = [];
      $(element)
        .find(".ui-allscores")
        .each((i, el) => {
          const teamName = $(el).find(".cb-ovr-flo").eq(0).text().trim();
          const teamScore = $(el).find(".cb-ovr-flo").eq(1).text().trim();
          const flag = getFlagURL(teamName); // Get the flag URL here
          teamsData.push({ teamName, flag, teamScore });
        });

      const status = $(element).find(".tls-ui-status").text().trim();

      matches.push({ title, teams: teamsData, status });
    });

    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
