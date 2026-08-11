const express = require("express");
const controller = require("../controllers/authController");

const router = express.Router();

router.post("/login", controller.loginUser);
router.get("/tms-token", controller.getTmsToken);

module.exports = router;
