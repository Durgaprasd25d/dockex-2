const express = require("express");
const controller = require("../controllers/authController");

const router = express.Router();

router.post("/login", controller.loginUser);

module.exports = router;
