const axios = require("axios");
const cheerio = require("cheerio");

class ScorecardExtractor {
  constructor(cheerio) {
    this.cheerio = cheerio;
  }

  async getScorecard(matchID, title) {
    try {
      const scorecardURL = `https://www.crictable.com/scorecard/${matchID}/${title}`;
      const response = await axios.get(scorecardURL);
      return this.extractScorecardData(response.data);
    } catch (error) {
      console.error("Error fetching scorecard:", error.message);
      return null;
    }
  }

  extractScorecardData(html) {
    const $ = this.cheerio.load(html);
    const inningsData = this.extractInningsData($);
    const matchDetails = this.extractMatchDetails($, inningsData);

    return {
      matchDetails,
      inningsData,
    };
  }

  extractMatchDetails($, inningsData) {
    const matchDetails = {};

    matchDetails.match = $('div.cb-list-item h3:contains("Match")')
      .next()
      .text()
      .trim();
    matchDetails.date = $('div.cb-list-item h3:contains("Date")')
      .next()
      .text()
      .trim();
    matchDetails.matchTime = $('div.cb-list-item h3:contains("match time")')
      .next()
      .text()
      .trim();
    matchDetails.tossResult = $('div.cb-list-item h3:contains("toss result")')
      .next()
      .text()
      .trim();
    matchDetails.stadium = $('div.cb-list-item h3:contains("stadium")')
      .next()
      .text()
      .trim();
    matchDetails.umpires = $('div.cb-list-item h3:contains("Umpires")')
      .next()
      .text()
      .trim();
    matchDetails.thirdUmpire = $('div.cb-list-item h3:contains("Third Umpire")')
      .next()
      .text()
      .trim();
    matchDetails.matchReferee = $(
      'div.cb-list-item h3:contains("Match Referee")'
    )
      .next()
      .text()
      .trim();
    matchDetails.seriesName = $('div.cb-list-item h3:contains("Series Name")')
      .next()
      .text()
      .trim();

    for (const innings of inningsData) {
      const { teamAbbreviation } = innings;

      matchDetails[`${teamAbbreviation} PlayingXI`] = $(
        `div.cb-list-item h3:contains('${teamAbbreviation} playing xi')`
      )
        .next()
        .text()
        .trim();
      matchDetails[`${teamAbbreviation} StandBy`] = $(
        `div.cb-list-item h3:contains('${teamAbbreviation} Stand by')`
      )
        .next()
        .text()
        .trim();
      matchDetails[`${teamAbbreviation} SupportStaff`] = $(
        `div.cb-list-item h3:contains('${teamAbbreviation} support staff')`
      )
        .next()
        .text()
        .trim();

      matchDetails[`${teamAbbreviation} PlayingXI`] = $(
        `div.cb-list-item h3:contains('${teamAbbreviation} playing xi')`
      )
        .next()
        .text()
        .trim();
      matchDetails[`${teamAbbreviation} StandBy`] = $(
        `div.cb-list-item h3:contains('${teamAbbreviation} stand by')`
      )
        .next()
        .text()
        .trim();
      matchDetails[`${teamAbbreviation} SupportStaff`] = $(
        `div.cb-list-item h3:contains('${teamAbbreviation} support staff')`
      )
        .next()
        .text()
        .trim();
    }

    return matchDetails;
  }

  extractPlayerId(onclickValue) {
    const match = /show_innings_by_id\('(.+)',/.exec(onclickValue);
    return match ? match[1] : null;
  }

  extractPlayersData($, id) {
    const players = [];

    $(`div#${id} table tbody tr`).each((index, element) => {
      const playerName = $(element).find("td:nth-child(1) a b").text().trim();
      const runs = $(element).find("td:nth-child(2) b").text().trim();
      const balls = $(element).find("td:nth-child(2) span").text().trim();
      const fours = $(element).find("td:nth-child(3)").text().trim();
      const sixes = $(element).find("td:nth-child(4)").text().trim();
      const strikeRate = $(element).find("td:nth-child(5)").text().trim();
      let outDescription = ""; // Initialize outDescription as an empty string
      const playerId = this.extractPlayerIdFromLink(
        $(element).find("td:nth-child(1) a").attr("href")
      );
      // Use the "next" function to access the next row and retrieve outDescription
      const outDescriptionElement = $(element).next().find("span.out-desc");
      if (outDescriptionElement.length > 0) {
        outDescription = outDescriptionElement.text().trim();
      }

      if (playerName) {
        if (
          runs !== "" &&
          balls !== "" &&
          !(runs === "- (0)" && balls === "- (0)")
        ) {
          players.push({
            playerName,
            playerId,
            runs,
            balls,
            fours,
            sixes,
            strikeRate,
            outDescription,
          });
        } else {
          const oversBowled = $(element).find("td:nth-child(2)").text().trim();
          const maidens = $(element).find("td:nth-child(3)").text().trim();
          const runsGiven = $(element).find("td:nth-child(4)").text().trim();
          const wickets = $(element).find("td:nth-child(5) b").text().trim();

          players.push({
            playerName,
            playerId,
            oversBowled,
            maidens,
            runsGiven,
            wickets,
          });
        }
      }
    });

    return players;
  }

  extractInningsData($) {
    const inningsData = [];

    $("div.btn-group.cbz-btn-group a").each((index, element) => {
      const score = $(element).text().trim();
      const [title, scoreValue] = score.split("-").map((item) => item.trim());
      const teamAbbreviation = title.split(" ")[0];
      const id = this.extractPlayerId($(element).attr("onclick"));

      // Separate batting, bowling, and fall of wickets data
      const players = this.extractPlayersData($, id);
      const battingData = players.filter((player) => player.runs !== undefined);
      const bowlingData = players.filter((player) => player.runs === undefined);
      const fallOfWickets = this.extractFallOfWicketsData($, id);

      if (title !== "Commentary" && title !== "Summary" && title !== "Teams") {
        inningsData.push({
          title,
          teamAbbreviation,
          score,
          battingData,
          bowlingData,
          fallOfWickets,
        });
      }
    });

    return inningsData;
  }

  extractFallOfWicketsData($, id) {
    const fallOfWickets = [];

    $(
      `div#${id} div.list-group div.cb-list-item.ui-header.ui-header-small:contains("Fall Of Wickets")`
    )
      .next()
      .find("table tbody tr")
      .each((index, element) => {
        const wicketNumber = $(element).find("td:nth-child(1)").text().trim();
        const runsScored = $(element).find("td:nth-child(2)").text().trim();
        const oversPlayed = $(element).find("td:nth-child(3)").text().trim();
        const playerName = $(element).find("td:nth-child(4)").text().trim();

        fallOfWickets.push({
          wicketNumber,
          runsScored,
          oversPlayed,
          playerName,
        });
      });

    return fallOfWickets;
  }

  extractPlayerIdFromLink(link) {
    const match = /\/player\/(\d+)\//.exec(link);
    return match ? match[1] : null;
  }
}

module.exports = { ScorecardExtractor };
