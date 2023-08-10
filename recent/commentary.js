const axios = require("axios");
const cheerio = require("cheerio");

class CommentaryExtractor {
  constructor(cheerio) {
    this.cheerio = cheerio;
  }

  async getCommentary(matchID, title) {
    try {
      const commentaryURL = `https://www.crictable.com/commentary/${matchID}/${title}`;
      const response = await axios.get(commentaryURL);
      return this.extractCommentaryData(response.data);
    } catch (error) {
      console.error("Error fetching commentary:", error.message);
      return null;
    }
  }

  extractCommentaryData(html) {
    const $ = this.cheerio.load(html);

    const matchInfo = this.extractMatchInfo($);
    const commentaryData = this.extractCommentaryList($);
    const loadMoreButton = this.extractLoadMoreButton($);

    return {
      MatchInfo: matchInfo,
      Commentary: commentaryData,
      LoadMoreButton: loadMoreButton,
    };
  }

  extractMatchInfo($) {
    const matchInfoElement = $(".cb-list-item.ui-header.ui-branding-header");
    const statusElement = $(".cbz-ui-status");

    const crrElement = $(".list-content span.crr");
    const playerOfTheMatchElement = $(".col-xs-12 h3.ui-li-heading ");

    const matchInfo = matchInfoElement.text().trim();
    const statusText = statusElement.text().trim();

    const crrText = crrElement.text().trim().replace("CRR: ", "");

    const teamScoresElement = $(".ui-allscores");
    const teamScoresText = teamScoresElement.text().trim();
    const teamScores = teamScoresText.match(/([A-Z]+)\s-\s(\d+\/\d+)/g);
    const [team1Score, team2Score] = teamScores.map((score) => {
      const [teamAbbreviation, scoreInfo] = score.split(" - ");
      return `${teamAbbreviation} ${scoreInfo}`;
    });

    const playerOfTheMatchName = playerOfTheMatchElement
      .next()
      .find("a")
      .text()
      .trim();
    const playerOfTheMatchIdMatch = playerOfTheMatchElement
      .next()
      .find("a")
      .attr("href")
      ?.match(/\/player\/(\d+)\//);
    const playerOfTheMatchId = playerOfTheMatchIdMatch
      ? playerOfTheMatchIdMatch[1]
      : "";

    return {
      Match: matchInfo.replace(/[\r\n]/g, "").replace(/\s+/g, " "),
      Status: statusText,
      Team1Score: team1Score,
      Team2Score: team2Score,
      CRR: crrText,
      PlayerOfTheMatch: {
        Name: playerOfTheMatchName,
        ID: playerOfTheMatchId,
      },
    };
  }

  extractCommentaryList($) {
    const commentaryList = [];

    $(".list-group .commtext").each((index, element) => {
      const text = $(element).text().trim();

      commentaryList.push({ [index]: text });
    });

    return commentaryList;
  }

  extractLoadMoreButton($) {
    const loadMoreButton = {
      value: $("#loadMorePagination").attr("value") || "",
      id: $("#loadMorePagination").attr("id") || "",
      onclick: $("#loadMorePagination").attr("onclick") || "",
      class: $("#loadMorePagination").attr("class") || "",
      style: $("#loadMorePagination").attr("style") || "",
      buttonText: $("#button-text").text().trim() || "",
    };

    return loadMoreButton;
  }
}

module.exports = { CommentaryExtractor };
