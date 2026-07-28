const express = require("express");
const multer = require("multer");
const controller = require("../controllers/uploadController");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.post("/upload", upload.single("image"), controller.uploadDocument);

module.exports = router;