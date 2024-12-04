const express = require("express");
const router = express.Router();
const homeController = require("../controllers/homeController");

router.get("/", homeController.getHome);
router.get("/mysql-data", homeController.getMysqlData);
router.get("/redis-data", homeController.getRedisData);

module.exports = router;
