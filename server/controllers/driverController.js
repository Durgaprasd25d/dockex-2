const registerDriver = async (req, res) => {
    try {
        const {
            driver_license_number,
            mobile_number,
            driver_name,
            dob,
            driver_address,
            additional_mobile_number,
            aadhar_number,
            blood_group,
            vehicle_type,
            transport_valid_form,
            transport_valid_upto,
            valid_form,
            valid_upto,
            rto,
            rto_code,
            state,
            driver_district,
            driver_state,
            driver_area,
            driver_pin_code,
            location
        } = req.body;

        // Validation for mandatory fields
        if (!driver_license_number || !mobile_number || !driver_name) {
            return res.status(400).json({
                success: false,
                message: "Missing mandatory fields: driver_license_number, mobile_number, and driver_name are required."
            });
        }

        const token = process.env.TMS_BEARER_TOKEN;
        if (!token) {
            console.error("TMS_BEARER_TOKEN environment variable is not defined");
            return res.status(500).json({
                success: false,
                message: "Server configuration error: TMS_BEARER_TOKEN is not defined in backend .env."
            });
        }

        // Initialize native Node.js FormData
        const formData = new global.FormData();
        formData.append("driver_license_number", driver_license_number.trim());
        formData.append("mobile_number", mobile_number.trim());
        formData.append("driver_name", driver_name.trim());

        if (dob) formData.append("dob", dob);
        if (driver_address) formData.append("driver_address", driver_address);
        if (additional_mobile_number) formData.append("additional_mobile_number", additional_mobile_number);
        if (aadhar_number) formData.append("aadhar_number", aadhar_number);
        if (blood_group) formData.append("blood_group", blood_group);
        if (vehicle_type) formData.append("vehicle_type", vehicle_type);
        if (transport_valid_form) formData.append("transport_valid_form", transport_valid_form);
        if (transport_valid_upto) formData.append("transport_valid_upto", transport_valid_upto);
        if (valid_form) formData.append("valid_form", valid_form);
        if (valid_upto) formData.append("valid_upto", valid_upto);
        if (rto) formData.append("rto", rto);
        if (rto_code) formData.append("rto_code", rto_code);
        if (state) formData.append("state", state);
        if (driver_district) formData.append("driver_district", driver_district);
        if (driver_state) formData.append("driver_state", driver_state);
        if (driver_area) formData.append("driver_area", driver_area);
        if (driver_pin_code) formData.append("driver_pin_code", driver_pin_code);
        if (location) {
            formData.append("location", typeof location === "string" ? location : JSON.stringify(location));
        }

        console.log("Forwarding driver registration to TMS API for license:", driver_license_number);

        // Fetch to external API
        const response = await global.fetch("https://tms.traanslogsinnovation.com/api/drivers", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json, text/plain, */*"
                // Content-Type is intentionally NOT set so fetch configures the boundary parameter automatically
            },
            body: formData
        });

        const rawText = await response.text();
        let responseData = {};
        try {
            responseData = JSON.parse(rawText);
        } catch (jsonErr) {
            responseData = { rawResponse: rawText };
        }

        if (!response.ok) {
            console.error("TMS API error response:", response.status, responseData);
            return res.status(response.status).json({
                success: false,
                message: "External TMS API returned an error status.",
                error: responseData
            });
        }

        return res.json({
            success: true,
            message: "Driver registered successfully in TMS",
            data: responseData
        });

    } catch (error) {
        console.error("Error registering driver:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during driver registration proxy.",
            error: error.message
        });
    }
};

module.exports = {
    registerDriver
};
