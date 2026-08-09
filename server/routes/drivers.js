const express = require("express");
const controller = require("../controllers/driverController");

const router = express.Router();

router.post("/", controller.registerDriver);

module.exports = router;
