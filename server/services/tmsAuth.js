let cachedToken = null;
let tokenExpiry = null;

const getValidToken = async () => {
    // If token is cached and not expired, return it
    if (cachedToken && (!tokenExpiry || Date.now() < tokenExpiry)) {
        return cachedToken;
    }

    console.log("No valid cached TMS token. Performing backend auto-login...");

    const mobileNumber = process.env.TMS_OFFICE_MOBILE || "9658947277";
    const password = process.env.TMS_OFFICE_PASSWORD || "Garg@1234";
    const organizationId = process.env.TMS_OFFICE_ORG_ID || "6895b6269bb6e4001c31dfc4";

    try {
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
                location: { latitude: 20.349393, longitude: 85.8078099 }
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
            throw new Error(`TMS Auth failed with status ${response.status}: ${responseData.message || rawText}`);
        }

        const token = responseData.accessToken;
        if (!token) {
            throw new Error("No accessToken returned from TMS authentication.");
        }

        // Cache the token
        cachedToken = token;

        // Decode JWT payload to get expiry (exp claim is standard)
        try {
            const payloadBase64 = token.split(".")[1];
            const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
            if (payload.exp) {
                // Set expiry with 5 minutes safety buffer (exp is in seconds)
                tokenExpiry = (payload.exp * 1000) - (5 * 60 * 1000);
            } else {
                // Default cache 12 hours if no exp claim
                tokenExpiry = Date.now() + (12 * 60 * 60 * 1000);
            }
        } catch (decodeErr) {
            // Default cache 12 hours
            tokenExpiry = Date.now() + (12 * 60 * 60 * 1000);
        }

        console.log("TMS auto-login successful. Token cached.");
        return cachedToken;

    } catch (err) {
        console.error("Failed to perform TMS auto-login:", err.message);
        throw err;
    }
};

module.exports = {
    getValidToken
};
