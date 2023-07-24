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

    const partnershipData = this.extractPartnershipData($);
    const lastWicketData = this.extractLastWicketData($);
    const recentBallsData = this.extractRecentBallsData($);
    const commentaryData = this.extractCommentaryList($);
    const loadMoreButton = this.extractLoadMoreButton($);

    return {
      Partnership: partnershipData,
      "Last Wkt": lastWicketData,
      "Recent Balls": recentBallsData,
      commentary: commentaryData,
      loadMoreButton: loadMoreButton,
    };
  }

  extractPartnershipData($) {
    const partnershipSpan = $('.list-content span:contains("Partnership:")');
    const partnershipText = partnershipSpan.next().text().trim();
    const [partnershipRuns, partnershipBalls] = partnershipText.split("(");

    return {
      Runs: partnershipRuns.trim(),
      Balls: partnershipBalls.replace(")", "").trim(),
    };
  }

  extractLastWicketData($) {
    const lastWktSpan = $('.list-content span:contains("Last wkt:")');
    const lastWktText = lastWktSpan.next().text().trim();
    const [batsmanName, wicketInfo] = lastWktText.split(" - ");

    return {
      Batsman: batsmanName.trim(),
      WicketInfo: wicketInfo.trim(),
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
      value: $("#loadMorePagination").attr("value"),
      id: $("#loadMorePagination").attr("id"),
      onclick: $("#loadMorePagination").attr("onclick"),
      class: $("#loadMorePagination").attr("class"),
      style: $("#loadMorePagination").attr("style"),
      buttonText: $("#button-text").text().trim(),
    };

    return loadMoreButton;
  }
}

module.exports = { CommentaryExtractor };
