const express = require("express");
const cors = require("cors");

const uploadRoute = require("./routes/upload");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

// Default Root Route - Server Info
app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "DocuScan OCR API Server is Running",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        endpoints: {
            upload: "POST /api/upload (form-data: image, type: DL | RC | AADHAAR | PAN)",
            health: "GET /health",
            uploads: "GET /uploads/:filename"
        }
    });
});

// Health Check Route
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        uptime: `${Math.floor(process.uptime())}s`,
        timestamp: new Date().toISOString()
    });
});

app.use("/api", uploadRoute);

// Catch-all 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl}. Route not found on DocuScan OCR Server.`,
        availableRoutes: ["GET /", "GET /health", "POST /api/upload"]
    });
});

// Only listen on port when NOT running on Vercel Serverless
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log("Server Running on Port " + PORT);
    });
}

module.exports = app;