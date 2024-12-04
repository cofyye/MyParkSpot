const mysqlConnection = require("../config/mysql");
const redisClient = require("../config/redis");

exports.getHome = (req, res) => {
  res.send("Welcome to the Home Page");
};

exports.getMysqlData = (req, res) => {
  mysqlConnection.query("SELECT * FROM events", (err, results) => {
    if (err) {
      console.error("Error fetching data from MySQL:", err);
      res.status(500).send("Error fetching data from MySQL");
      return;
    }
    res.send(results);
  });
};

exports.getRedisData = async (req, res) => {
  try {
    const value = await redisClient.get("kljuc");
    res.send(value);
  } catch (error) {
    console.error("Error getting data from Redis:", error);
    res.status(500).send("Error getting data from Redis");
  }
};
