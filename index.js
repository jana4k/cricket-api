const express = require("express");
const app = express();
const port = 3006;
const liveApi = require("./livematch/live");
const axios = require("axios");
const cheerio = require("cheerio");
const { getFlagURL } = require("./data/flags");

app.get("/", (req, res) => {
  res.send("Welcome to the Cricket API!");
});

app.use(liveApi);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
