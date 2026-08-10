const loginUser = async (req, res) => {
    try {
        const { mobileNumber, password, organizationId, location } = req.body;

        // Validation
        if (!mobileNumber || !password || !organizationId) {
            return res.status(400).json({
                success: false,
                message: "Missing mandatory fields: mobileNumber, password, and organizationId are required."
            });
        }

        console.log("Forwarding authentication request to TMS for mobile:", mobileNumber);

        // Fetch to external API
        const response = await global.fetch("https://tms.traanslogsinnovation.com/authentication", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json, text/plain, */*"
            },
            body: JSON.stringify({
                mobileNumber: mobileNumber.trim(),
                password: password,
                strategy: "local",
                organizationId: organizationId.trim(),
                location: location || { latitude: 20.349393, longitude: 85.8078099 }
            })
        });

        const rawText = await response.text();
        let responseData = {};
        try {
            responseData = JSON.parse(rawText);
        } catch (jsonErr) {
            responseData = { rawResponse: rawText };
        }

        if (!response.ok) {
            console.error("TMS authentication failed response status:", response.status, responseData);
            return res.status(response.status).json({
                success: false,
                message: "TMS Login failed: " + (responseData.message || "Invalid credentials or organization ID"),
                error: responseData
            });
        }

        // Return the session details (including access token)
        return res.json({
            success: true,
            message: "Authentication successful",
            data: responseData
        });

    } catch (error) {
        console.error("Error in login proxy:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authentication proxy.",
            error: error.message
        });
    }
};

module.exports = {
    loginUser
};
