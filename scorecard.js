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
    const scorecardData = {};

    // Extract match info
    scorecardData.matchInfo = this.extractMatchInfo($);

    // Extract innings data
    scorecardData.inningsData = this.extractInningsData($);

    return scorecardData;
  }

  extractMatchInfo($) {
    const matchInfo = {};
    // Implement logic to extract match information
    matchInfo.match = $(".ui-li-heading").eq(0).text().trim();
    matchInfo.date = $(".ui-li-heading").eq(1).text().trim();
    matchInfo.matchTime = $(".ui-li-heading").eq(2).text().trim();
    matchInfo.tossResult = $(".ui-li-heading").eq(3).text().trim();
    matchInfo.stadium = $(".ui-li-heading").eq(4).text().trim();
    matchInfo.umpires = $(".ui-li-heading").eq(5).text().trim();
    matchInfo.thirdUmpire = $(".ui-li-heading").eq(6).text().trim();
    matchInfo.matchReferee = $(".ui-li-heading").eq(7).text().trim();
    matchInfo.seriesName = $(".ui-li-heading").eq(8).text().trim();
    matchInfo.wiPlayingXI = $(".ui-li-heading").eq(9).text().trim();
    matchInfo.wiStandBy = $(".ui-li-heading").eq(10).text().trim();
    matchInfo.wiSupportStaff = $(".ui-li-heading").eq(11).text().trim();
    matchInfo.indPlayingXI = $(".ui-li-heading").eq(12).text().trim();
    matchInfo.indStandBy = $(".ui-li-heading").eq(13).text().trim();
    matchInfo.indSupportStaff = $(".ui-li-heading").eq(14).text().trim();

    return matchInfo;
  }

  extractInningsData($) {
    const inningsData = [];
    // Implement logic to extract innings data
    $(".cb-list-item.ui-header.ui-header-small").each((index, element) => {
      const innings = $(element).text().trim();
      const tableRows = $(element).next().find(".table-row");
      const players = [];

      tableRows.each((index, row) => {
        const playerName = $(row).find(".bat-bowl-data").text().trim();
        const runs = $(row).find(".bat-bowl-data b").text().trim();
        const balls = $(row).find(".bat-bowl-data span").text().trim();
        const fours = $(row).find(".cbz-grid-table-fix").eq(2).text().trim();
        const sixes = $(row).find(".cbz-grid-table-fix").eq(3).text().trim();
        const strikeRate = $(row)
          .find(".cbz-grid-table-fix")
          .eq(4)
          .text()
          .trim();
        const outDesc = $(row).find(".out-desc").text().trim();

        players.push({
          playerName,
          runs,
          balls,
          fours,
          sixes,
          strikeRate,
          outDesc,
        });
      });

      inningsData.push({ innings, players });
    });

    return inningsData;
  }
}

module.exports = { ScorecardExtractor };
