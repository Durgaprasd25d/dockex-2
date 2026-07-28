const ocrService = require("../services/ocrService");
const parser = require("../services/parser");

exports.uploadDocument = async (req, res) => {
    try {
        let text = req.body ? req.body.text : "";
        let docType = (req.body ? req.body.type : "").toUpperCase();

        // If text was not provided directly by client browser OCR, execute server OCR
        if (!text && req.file) {
            try {
                text = await ocrService.readText(req.file.buffer || req.file.path);
            } catch (ocrErr) {
                console.error("Server OCR error:", ocrErr.message);
                return res.status(400).json({
                    success: false,
                    message: "Server OCR failed or timed out. Please try uploading again.",
                    error: ocrErr.message
                });
            }
        }

        if (!text || !text.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "No readable text found in image. Please ensure image is clear." 
            });
        }

        let data = {};
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
            if (/Vehicle\s*Registration|Registration|Regn|Chassis|Engine|Owner\s*Name|Maker|Model|Financier|Vehicle\s*Class/i.test(text)) {
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
                docType = "DOCUMENT";
                data = parser.extractGeneric(text);
            }
        }

        return res.json({
            success: true,
            detectedType: docType,
            text: text,
            data: data
        });
    } catch (error) {
        console.error("Error in uploadDocument:", error);
        return res.status(500).json({
            success: false,
            message: "Document extraction failed",
            error: error.message
        });
    }
};