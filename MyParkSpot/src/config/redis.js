const redis = require("redis");
require("dotenv").config();

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => {
  console.error("Error connecting to Redis:", err);
});

async function connectRedis() {
  await client.connect();
  console.log("Connected to Redis");
}

connectRedis();

module.exports = client;
