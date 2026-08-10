const express = require("express");
const controller = require("../controllers/vehicleController");

const router = express.Router();

router.post("/", controller.registerVehicle);

module.exports = router;
