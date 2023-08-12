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
    const battingData = this.extractBattingData($);
    const bowlingData = this.extractBowlingData($);
    return {
      MatchInfo: matchInfo,
      TeamScoresAndCRR: teamScoresAndCRR,
      Partnership: partnershipData,
      "Last Wkt": lastWicketData,
      "Recent Balls": recentBallsData,
      Batting: battingData,
      Bowling: bowlingData,
      commentary: commentaryData,
      loadMoreButton: loadMoreButton,
    };
  }
  extractBattingData($) {
    const battingData = [];

    $("table.table-condensed tbody tr:has(td span.bat-bowl-miniscore)").each(
      (index, element) => {
        const nameElement = $(element).find("td a.cbz-ui-align-left");
        const playerName = nameElement.text().trim();
        const playerId = nameElement.attr("href").match(/\/player\/(\d+)\//)[1];

        const runsElement = $(element).find("td:eq(1)");
        const runsText = runsElement.text().trim();
        const runsMatch = runsText.match(/(\d+)\((\d+)\)/);
        const runs = runsMatch ? runsMatch[1] : "";
        const ballsFaced = runsMatch ? runsMatch[2] : "";

        const foursElement = $(element).find("td:eq(2)");
        const foursText = foursElement.text().trim();
        const sixesElement = $(element).find("td:eq(3)");
        const sixesText = sixesElement.text().trim();
        const srElement = $(element).find("td:eq(4)");
        const srText = srElement.text().trim();

        if (playerName && playerId && runs !== "") {
          const battingEntry = {
            PlayerName: playerName,
            PlayerId: playerId,
            Runs: runs,
            BallsFaced: ballsFaced,
            Fours: foursText,
            Sixes: sixesText,
            StrikeRate: srText,
          };
          battingData.push(battingEntry);
        }
      }
    );

    return battingData;
  }

  extractBowlingData($) {
    const bowlingData = [];

    $("table.table-condensed tbody tr:has(td span.bat-bowl-miniscore)").each(
      (index, element) => {
        const nameElement = $(element).find("td a.cbz-ui-align-left");
        const playerName = nameElement.text().trim();
        const playerId = nameElement.attr("href").match(/\/player\/(\d+)\//)[1];

        const oversElement = $(element).find("td:eq(1)");
        const oversText = oversElement.text().trim();
        const oversMatch = oversText.match(/(\d+(\.\d+)?)$/);
        const overs = oversMatch ? oversMatch[1] : "";

        const maidensElement = $(element).find("td:eq(2)");
        const maidensText = maidensElement.text().trim();
        const runsElement = $(element).find("td:eq(3)");
        const runsText = runsElement.text().trim();
        const wicketsElement = $(element).find("td:eq(4)");
        const wicketsText = wicketsElement.text().trim();

        if (playerName && playerId && overs !== "") {
          const bowlingEntry = {
            PlayerName: playerName,
            PlayerId: playerId,
            Overs: overs,
            Maidens: maidensText,
            Runs: runsText,
            Wickets: wicketsText,
          };
          bowlingData.push(bowlingEntry);
        }
      }
    );

    return bowlingData;
  }

  extractMatchInfo($) {
    const matchInfoElement = $(".list-group h4.cb-list-item");
    const matchInfo = matchInfoElement.text().trim();

    const statusElement = $(".col-xs-12 h3.ui-li-heading div.cbz-ui-status");
    const statusText = statusElement.text().trim();

    return {
      Match: matchInfo,
      Status: statusText,
    };
  }
  extractTeamScoresAndCRR($) {
    const teamScoresElement = $("h3.ui-li-heading span.teamscores");
    const crrElement = $(".list-content span.crr");
    const crrText = crrElement.text().trim().replace("CRR: ", "");
    const rrElement = $(".list-content span:contains('RR :')");
    const rrText = rrElement.text().trim().replace("RR : ", "");

    return {
      TeamScores: teamScoresElement.text().trim(),
      CRR: crrText || "",
      RR: rrText || "",
    };
  }

  extractPartnershipData($) {
    const partnershipSpan = $('.list-content span:contains("Partnership:")');
    const partnershipText = partnershipSpan.next().text().trim();
    const [partnershipRuns, partnershipBalls] = partnershipText.split("(");

    return {
      Runs: partnershipRuns?.trim() || "",
      Balls: partnershipBalls?.replace(")", "").trim() || "",
    };
  }

  extractLastWicketData($) {
    const lastWktSpan = $('.list-content span:contains("Last wkt:")');
    const lastWktText = lastWktSpan.next().text().trim();
    const [batsmanName, wicketInfo] = lastWktText.split(" - ");

    return {
      Batsman: batsmanName?.trim() || "",
      WicketInfo: wicketInfo?.trim() || "",
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
