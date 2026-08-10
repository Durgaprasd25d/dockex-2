const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const fs = require("fs");
const path = require("path");

// Native .env file loader
try {
    const envPath = path.join(__dirname, ".env");
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, "utf8");
        for (const line of envConfig.split(/\r?\n/)) {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || "";
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                process.env[key] = value.trim();
            }
        }
    }
} catch (err) {
    console.error("Failed to load .env file:", err);
}

const express = require("express");
const cors = require("cors");


const uploadRoute = require("./routes/upload");
const driversRoute = require("./routes/drivers");
const vehiclesRoute = require("./routes/vehicles");
const authRoute = require("./routes/auth");

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
app.use("/api/drivers", driversRoute);
app.use("/api/vehicles", vehiclesRoute);
app.use("/api/auth", authRoute);

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