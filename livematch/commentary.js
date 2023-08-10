const axios = require("axios");
const cheerio = require("cheerio");

class CommentaryExtractor {
  constructor() {}

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
    const $ = cheerio.load(html);

    const matchInfo = this.extractMatchInfo($);
    const teamScoresAndCRR = this.extractTeamScoresAndCRR($);
    const partnershipData = this.extractPartnershipData($);
    const lastWicketData = this.extractLastWicketData($);
    const recentBallsData = this.extractRecentBallsData($);
    const commentaryData = this.extractCommentaryList($);
    const loadMoreButton = this.extractLoadMoreButton($);

    return {
      MatchInfo: matchInfo,
      TeamScoresAndCRR: teamScoresAndCRR,
      Partnership: partnershipData,
      "Last Wkt": lastWicketData,
      "Recent Balls": recentBallsData,
      commentary: commentaryData,
      loadMoreButton: loadMoreButton,
    };
  }

  extractMatchInfo($) {
    const matchInfoElement = $(".cb-list-item.miniscore-data h3.ui-li-heading");
    const statusElement = $(".cbz-ui-status");

    const matchInfo = matchInfoElement.text().trim();
    const statusText = statusElement.text().trim();

    const teamScoresElement = $(".ui-allscores");
    const teamScoresText = teamScoresElement.text().trim();
    const [team1Score, team2Score] = teamScoresText.split("\n");

    const crrElement = $(".list-content span.crr");
    const crrText = crrElement.text().trim().replace("CRR: ", "");

    return {
      Match: matchInfo,
      Status: statusText,
      Team1Score: team1Score.trim(),
      Team2Score: team2Score.trim(),
      CRR: crrText,
    };
  }

  extractTeamScoresAndCRR($) {
    const teamScoresElement = $("h3.ui-li-heading span.teamscores");
    const teamScoresText = teamScoresElement.text().trim();

    const crrElement = $(".list-content span.crr");
    const rrElement = $(".list-content span:contains('RR :')");

    const crrText = crrElement.text().trim().replace("CRR: ", "");
    const rrText = rrElement.text().trim().replace("RR : ", "");

    return {
      TeamScores: teamScoresText,
      CRR: crrText,
      RR: rrText,
    };
  }
  extractPartnershipData($) {
    const partnershipSpan = $('.list-content span:contains("Partnership:")');
    const partnershipText = partnershipSpan.next().text().trim();
    const [partnershipRuns, partnershipBalls] = partnershipText.split("(");

    return {
      Runs: partnershipRuns ? partnershipRuns.trim() : "",
      Balls: partnershipBalls ? partnershipBalls.replace(")", "").trim() : "",
    };
  }

  extractLastWicketData($) {
    const lastWktSpan = $('.list-content span:contains("Last wkt:")');
    const lastWktText = lastWktSpan.next().text().trim();
    const [batsmanName, wicketInfo] = lastWktText.split(" - ");

    return {
      Batsman: batsmanName ? batsmanName.trim() : "",
      WicketInfo: wicketInfo ? wicketInfo.trim() : "",
    };
  }

  extractRecentBallsData($) {
    const recentBallsSpan = $('.list-content span:contains("Recent balls:")');
    const recentBallsText = recentBallsSpan.next().text().trim();
    const recentBalls = recentBallsText.split(" | ");

    return recentBalls.map((ball) => ball.trim());
  }

  extractCommentaryList($) {
    const commentaryList = [];

    $(".list-group .commtext").each((index, element) => {
      const text = $(element).text().trim();

      const data = {
        [index]: text,
      };

      commentaryList.push(data);
    });

    return commentaryList;
  }

  extractLoadMoreButton($) {
    const loadMoreButton = {
      value: "",
      id: "",
      onclick: "",
      class: "",
      style: "",
      buttonText: "",
    };

    const loadMoreElem = $("#loadMorePagination");
    if (loadMoreElem) {
      loadMoreButton.value = loadMoreElem.attr("value") || "";
      loadMoreButton.id = loadMoreElem.attr("id") || "";
      loadMoreButton.onclick = loadMoreElem.attr("onclick") || "";
      loadMoreButton.class = loadMoreElem.attr("class") || "";
      loadMoreButton.style = loadMoreElem.attr("style") || "";
    }

    const buttonTextElem = $("#button-text");
    if (buttonTextElem) {
      loadMoreButton.buttonText = buttonTextElem.text().trim() || "";
    }

    return loadMoreButton;
  }
}

module.exports = { CommentaryExtractor };
