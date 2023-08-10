const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const url = "https://www.crictable.com/upcoming-matches/";

app.get("/upcoming", async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.crictable.com/upcoming-matches/"
    );
    const html = response.data;

    const $ = cheerio.load(html);
    const upcomingMatches = [];

    $(".ui-live-matches").each((index, element) => {
      const matchDetails = {};

      const matchHeader = $(element)
        .find(".matchheader.cb-ovr-flo")
        .text()
        .trim();
      matchDetails.matchTitle = matchHeader;

      const teams = $(element)
        .find(".ui-allscores.ui-bat-team-scores")
        .map((i, el) => $(el).text())
        .get();
      matchDetails.teams = teams;

      const startTime = $(element)
        .find(".tls-ui-status.cbz-ui-home-yellow")
        .text()
        .trim();
      matchDetails.startTime = startTime;

      const matchFactsLink = $(element)
        .find(".btn-group.cbz-btn-group a")
        .attr("href");
      matchDetails.matchFactsLink = matchFactsLink;

      upcomingMatches.push(matchDetails);
    });

    // Inside the matchFactsPromises part of the code
    const matchFactsPromises = upcomingMatches.map(async (match) => {
      if (match.matchFactsLink) {
        try {
          const matchFactsResponse = await axios.get(match.matchFactsLink);
          const matchFactsHtml = matchFactsResponse.data;

          const matchFacts = {};
          const matchFacts$ = cheerio.load(matchFactsHtml);

          matchFacts.match = matchFacts$(
            "h4.cb-list-item.ui-header.ui-branding-header"
          )
            .text()
            .trim();
          matchFacts.tournament = matchFacts$(".row.cb-list-item .poll-text")
            .eq(0)
            .text()
            .trim();
          matchFacts.date = matchFacts$(".row.cb-list-item .poll-text")
            .eq(1)
            .text()
            .trim();
          matchFacts.time = matchFacts$(".row.cb-list-item .poll-text")
            .eq(2)
            .text()
            .trim();
          matchFacts.venue = matchFacts$(".row.cb-list-item .poll-text")
            .eq(3)
            .text()
            .trim();
          matchFacts.series = matchFacts$(".row.cb-list-item .poll-text")
            .eq(4)
            .text()
            .trim();

          matchFacts.stadiumGuide = {
            stadium: matchFacts$(".row.cb-list-item .poll-text")
              .eq(5)
              .text()
              .trim(),
            city: matchFacts$(".row.cb-list-item .poll-text")
              .eq(6)
              .text()
              .trim(),
            capacity: matchFacts$(".row.cb-list-item .poll-text")
              .eq(7)
              .text()
              .trim(),
            ends: matchFacts$(".row.cb-list-item .poll-text")
              .eq(8)
              .text()
              .trim(),
          };

          return matchFacts;
        } catch (error) {
          // Handle error here if necessary
          console.error("Error fetching match facts:", error);
        }
      }
    });

    // Rest of the code remains the same

    const matchFactsDetails = await Promise.allSettled(matchFactsPromises);
    upcomingMatches.forEach((match, index) => {
      if (matchFactsDetails[index].status === "fulfilled") {
        match.matchFactsDetails = matchFactsDetails[index].value;
      } else {
        match.matchFactsDetails = null; // Or any default value for error cases
      }
    });
    res.json(upcomingMatches);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while fetching data.");
  }
});

module.exports = app;
