const tmsAuth = require("../services/tmsAuth");

const registerVehicle = async (req, res) => {
    try {
        const {
            category,
            manufacturing_date,
            registration_number,
            vehicle_class,
            number_of_wheels,
            weight_capacity,
            engine_number,
            chassis_number,
            maker,
            model,
            body_type,
            fuel_type,
            vehicle_color,
            cubic_capacity,
            gross_weight,
            unladen_weight,
            passing_weight,
            ownership_start_date,
            owner_pan_number,
            owner_name,
            owner_address,
            owner_contact,
            owner_email,
            rc_number,
            registration_at,
            fitness_valid_till,
            wheel,
            owner_district,
            owner_state,
            owner_area,
            owner_pin_code,
            registration_date_from,
            registration_date_to,
            location
        } = req.body;

        // Validation for mandatory fields
        if (!registration_number || !vehicle_class || !number_of_wheels || !owner_name || !owner_contact) {
            return res.status(400).json({
                success: false,
                message: "Missing mandatory fields: registration_number, vehicle_class, number_of_wheels, owner_name, and owner_contact are required."
            });
        }

        // Retrieve token automatically via Token Manager service
        let token = "";
        try {
            token = await tmsAuth.getValidToken();
        } catch (authErr) {
            return res.status(500).json({
                success: false,
                message: "Authentication with TMS failed: " + authErr.message
            });
        }

        // Initialize native Node.js FormData
        const formData = new global.FormData();
        formData.append("registration_number", registration_number.trim());
        formData.append("vehicle_class", vehicle_class.trim());
        formData.append("number_of_wheels", number_of_wheels.toString());
        formData.append("owner_pan_number", owner_pan_number ? owner_pan_number.trim() : "");
        formData.append("owner_name", owner_name.trim());
        formData.append("owner_contact", owner_contact.trim());

        if (category) formData.append("category", category);
        if (manufacturing_date) formData.append("manufacturing_date", manufacturing_date);
        if (weight_capacity) formData.append("weight_capacity", weight_capacity.toString());
        if (engine_number) formData.append("engine_number", engine_number);
        if (chassis_number) formData.append("chassis_number", chassis_number);
        if (maker) formData.append("maker", maker);
        if (model) formData.append("model", model);
        if (body_type) formData.append("body_type", body_type);
        if (fuel_type) formData.append("fuel_type", fuel_type);
        if (vehicle_color) formData.append("vehicle_color", vehicle_color);
        if (cubic_capacity) formData.append("cubic_capacity", cubic_capacity.toString());
        if (gross_weight) formData.append("gross_weight", gross_weight.toString());
        if (unladen_weight) formData.append("unladen_weight", unladen_weight.toString());
        if (passing_weight) formData.append("passing_weight", passing_weight.toString());
        if (ownership_start_date) formData.append("ownership_start_date", ownership_start_date);
        if (owner_address) formData.append("owner_address", owner_address);
        if (owner_email) formData.append("owner_email", owner_email);
        if (rc_number) formData.append("rc_number", rc_number);
        if (registration_at) formData.append("registration_at", registration_at);
        if (fitness_valid_till) formData.append("fitness_valid_till", fitness_valid_till);
        if (wheel) formData.append("wheel", wheel);
        if (owner_district) formData.append("owner_district", owner_district);
        if (owner_state) formData.append("owner_state", owner_state);
        if (owner_area) formData.append("owner_area", owner_area);
        if (owner_pin_code) formData.append("owner_pin_code", owner_pin_code.toString());
        if (registration_date_from) formData.append("registration_date_from", registration_date_from);
        if (registration_date_to) formData.append("registration_date_to", registration_date_to);
        
        if (location) {
            formData.append("location", typeof location === "string" ? location : JSON.stringify(location));
        }

        console.log("Forwarding vehicle registration to TMS API for truck:", registration_number);

        // Fetch to external API
        const response = await global.fetch("https://tms.traanslogsinnovation.com/api/vehicles", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json, text/plain, */*"
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
            console.error("TMS API vehicle error response:", response.status, responseData);
            return res.status(response.status).json({
                success: false,
                message: "External TMS API returned an error status.",
                error: responseData
            });
        }

        return res.json({
            success: true,
            message: "Vehicle registered successfully in TMS",
            data: responseData
        });

    } catch (error) {
        console.error("Error registering vehicle:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during vehicle registration proxy.",
            error: error.message
        });
    }
};

module.exports = {
    registerVehicle
};
