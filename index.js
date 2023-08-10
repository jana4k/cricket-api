const express = require("express");
const app = express();
const port = 3000;
const liveApi = require("./livematch/live");
const upcomingApi = require("./upcoming/upcoming");
const recentApi = require("./recent/recent");
app.get("/", (req, res) => {
  res.send("Welcome to the Cricket API!");
});

app.use(liveApi);
app.use(recentApi);
app.use(upcomingApi);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
