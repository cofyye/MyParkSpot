const express = require("express");
const app = express();
const port = 3000;

const path = require("path");
const homeRoutes = require("./src/routes/homeRoutes");
const redisClient = require("./src/config/redis");

app.use(express.static(path.join(__dirname, "public")));

app.use("/", homeRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
