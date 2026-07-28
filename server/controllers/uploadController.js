const OCR = require("../services/ocrService");
const parser = require("../services/parser");

exports.upload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const imageSource = req.file.buffer || req.file.path;
        const text = await OCR.readText(imageSource);
        let data;
        let docType = (req.body.type || "").toUpperCase();

        if (docType === "DL") {
            data = parser.extractDL(text);
        } else if (docType === "RC") {
            data = parser.extractRC(text);
        } else if (docType === "AADHAAR" || docType === "AADHAR") {
            data = parser.extractAadhaar(text);
            docType = "AADHAAR";
        } else if (docType === "PAN") {
            data = parser.extractPAN(text);
        } else {
            // Auto detect
            if (/Vehicle\s*Registration|Regn\s*No|Chassis|Engine|Owner\s*Name/i.test(text)) {
                docType = "RC";
                data = parser.extractRC(text);
            } else if (/Licence|DRIVING|Validity|DL\s*No|Son\/Daughter\/Wife\s*of/i.test(text)) {
                docType = "DL";
                data = parser.extractDL(text);
            } else if (/PERMANENT ACCOUNT|INCOME TAX|[A-Z]{5}[0-9]{4}[A-Z]{1}/i.test(text)) {
                docType = "PAN";
                data = parser.extractPAN(text);
            } else if (/Government of India|Aadhaar|\d{4}\s\d{4}\s\d{4}/i.test(text)) {
                docType = "AADHAAR";
                data = parser.extractAadhaar(text);
            } else {
                docType = "DL";
                data = parser.extractDL(text);
            }
        }

        res.json({
            success: true,
            detectedType: docType,
            text,
            data
        });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "OCR Processing Error"
        });
    }
};