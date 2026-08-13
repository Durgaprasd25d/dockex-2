import { useState, useEffect } from "react";
import { FiX, FiCheckCircle, FiAlertTriangle, FiTruck, FiSettings, FiCalendar } from "react-icons/fi";
import axios from "axios";

function RegisterVehicleForm({ data, onClose }) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    
    // Map vehicle Class to light/heavy default
    const mapVehicleClass = (cls) => {
        if (!cls) return "heavy";
        const val = cls.toLowerCase();
        if (val.includes("light") || val.includes("lmv") || val.includes("car") || val.includes("jeep")) {
            return "light";
        }
        return "heavy";
    };

    // Form fields state prefilled from parsed Vehicle RC
    const [formData, setFormData] = useState({
        vehicle_class: mapVehicleClass(data.vehicle_class),
        registration_number: data.registration_number || "",
        maker_name: data.maker_name || "",
        model_name: data.model_name || "",
        colour: data.colour || "",
        body_type: data.body_type || "",
        seating: data.seating_standing_sleeper_capacity?.seating || "",
        standing: data.seating_standing_sleeper_capacity?.standing || "",
        sleeper: data.seating_standing_sleeper_capacity?.sleeper || "",
        unladen_kg: data.weight?.unladen_kg || "",
        laden_kg: data.weight?.laden_kg || "",
        gross_combination_weight_kg: data.weight?.gross_combination_weight_kg || "",
        cubic_capacity: data.cubic_capacity_horse_power_wheel_base?.cubic_capacity || "",
        horse_power: data.cubic_capacity_horse_power_wheel_base?.horse_power || "",
        wheel_base_mm: data.cubic_capacity_horse_power_wheel_base?.wheel_base_mm || "",
        financier: data.financier || "",
        month_year_of_manufacture: data.month_year_of_manufacture || "",
        number_of_cylinders: data.number_of_cylinders || "",
        number_of_axles: data.number_of_axles || "",
        registration_authority: data.registration_authority || "",
        latitude: "",
        longitude: ""
    });

    // Auto-fetch geolocation on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude.toString(),
                        longitude: position.coords.longitude.toString()
                    }));
                },
                (err) => {
                    console.warn("Geolocation permission denied/failed:", err.message);
                    setFormData(prev => ({
                        ...prev,
                        latitude: "20.3493551",
                        longitude: "85.8077988"
                    }));
                }
            );
        } else {
            setFormData(prev => ({
                ...prev,
                latitude: "20.3493551",
                longitude: "85.8077988"
            }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!formData.registration_number.trim()) {
            setErrorMsg("Registration Number is required.");
            return;
        }
        if (!formData.vehicle_class.trim()) {
            setErrorMsg("Vehicle Class is required.");
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem("tms_token");
            if (!token) {
                setErrorMsg("Auto-login token is not loaded. Please wait a moment and try again.");
                return;
            }

            const convertToISODate = (dateStr, isExpiry = false) => {
                if (!dateStr) return "";
                let cleanStr = dateStr.trim();

                const rangeParts = cleanStr.split(/ - | to |(?<=\d{4})-(?=\d{4})/i);
                if (rangeParts.length > 1) {
                    cleanStr = (isExpiry ? rangeParts[rangeParts.length - 1] : rangeParts[0]).trim();
                } else if (cleanStr.includes("-") && cleanStr.split("-").length === 2) {
                    const parts = cleanStr.split("-");
                    const targetYear = (isExpiry ? parts[1] : parts[0]).trim();
                    if (targetYear.length === 4) {
                        return `${targetYear}-${isExpiry ? "12-31" : "01-01"}`;
                    }
                }

                if (cleanStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    return cleanStr;
                }

                const dmyMatch = cleanStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
                if (dmyMatch) {
                    const [_, day, month, year] = dmyMatch;
                    return `${year}-${month}-${day}`;
                }

                if (cleanStr.match(/^\d{4}$/)) {
                    return `${cleanStr}-${isExpiry ? "12-31" : "01-01"}`;
                }

                try {
                    const d = new Date(cleanStr);
                    if (!isNaN(d.getTime())) {
                        return d.toISOString().split('T')[0];
                    }
                } catch (e) {}

                return cleanStr;
            };

            const bodyFormData = new FormData();
            
            // Map keys exactly as required by the TMS external API structure
            bodyFormData.append("registration_number", formData.registration_number.trim());
            bodyFormData.append("rc_number", formData.registration_number.trim());
            bodyFormData.append("vehicle_class", formData.vehicle_class);
            bodyFormData.append("maker", formData.maker_name);
            bodyFormData.append("model", formData.model_name);
            bodyFormData.append("vehicle_color", formData.colour);
            bodyFormData.append("body_type", formData.body_type);
            
            bodyFormData.append("seating_capacity", formData.seating || "0");
            bodyFormData.append("standing_capacity", formData.standing || "0");
            bodyFormData.append("sleeper_capacity", formData.sleeper || "0");
            
            bodyFormData.append("unladen_weight", formData.unladen_kg ? parseFloat(formData.unladen_kg).toString() : "0");
            bodyFormData.append("gross_weight", formData.laden_kg ? parseFloat(formData.laden_kg).toString() : "0");
            bodyFormData.append("weight_capacity", formData.gross_combination_weight_kg ? parseFloat(formData.gross_combination_weight_kg).toString() : "0");
            
            bodyFormData.append("cubic_capacity", formData.cubic_capacity ? parseFloat(formData.cubic_capacity).toString() : "0");
            bodyFormData.append("horse_power", formData.horse_power ? parseFloat(formData.horse_power).toString() : "0");
            bodyFormData.append("wheelbase", formData.wheel_base_mm ? parseInt(formData.wheel_base_mm).toString() : "0");
            
            bodyFormData.append("financier", formData.financier);
            
            // Format month-year of manufacture to valid date format
            bodyFormData.append("manufacturing_date", convertToISODate(formData.month_year_of_manufacture));
            bodyFormData.append("no_of_cylinder", formData.number_of_cylinders || "0");
            bodyFormData.append("no_of_axle", formData.number_of_axles || "0");
            bodyFormData.append("registration_at", formData.registration_authority);

            // Derive number of wheels from axles
            let numberOfWheels = "10";
            const axles = parseInt(formData.number_of_axles);
            if (axles === 2) numberOfWheels = "6";
            else if (axles === 3) numberOfWheels = "10";
            else if (axles === 4) numberOfWheels = "12";
            else if (axles === 5) numberOfWheels = "10";
            else if (axles >= 6) numberOfWheels = "12";
            bodyFormData.append("number_of_wheels", numberOfWheels);

            bodyFormData.append("category", "truck");
            bodyFormData.append("fuel_type", "diesel");

            // Static mandatory fields required for user context validation
            bodyFormData.append("owner_name", "GARG LOGISTICS");
            bodyFormData.append("owner_pan_number", "ABCDE1234F");
            bodyFormData.append("owner_contact", "9658947277");

            // Geolocation
            bodyFormData.append("location", JSON.stringify({
                latitude: parseFloat(formData.latitude) || 20.3493551,
                longitude: parseFloat(formData.longitude) || 85.8077988
            }));

            // Direct Axios POST to external TMS API
            const baseUrl = import.meta.env.VITE_THIRDPARTY_URL || "https://tms.traanslogsinnovation.com/api/";
            const response = await axios.post(baseUrl + (baseUrl.endsWith("/") ? "vehicles" : "/vehicles"), bodyFormData, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json, text/plain, */*"
                }
            });

            if (response.status === 200 || response.status === 201) {
                setSuccessMsg("Vehicle registered successfully in the TMS system!");
            } else {
                setErrorMsg("Vehicle registration failed: " + (response.data?.message || "Unknown error"));
            }
        } catch (err) {
            console.error("Registration request failed:", err);
            const apiError = err.response?.data?.message 
                || err.response?.data?.error?.message 
                || "Failed to register vehicle. Please check your network and credentials.";
            setErrorMsg(apiError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registration-modal-overlay">
            <div className="registration-modal-container">
                <div className="registration-modal-header">
                    <div>
                        <h3 className="registration-modal-title">
                            <FiTruck className="text-primary" />
                            <span>TMS Vehicle Registration</span>
                        </h3>
                        <p className="registration-modal-subtitle">Submit scanned vehicle registration certificate (RC) details to TMS Portal</p>
                    </div>
                    <button type="button" className="close-icon-btn" onClick={onClose} title="Close form">
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="registration-form-body">
                    {errorMsg && (
                        <div className="alert alert-danger px-3 py-2 d-flex align-items-center gap-2 mb-3" style={{ fontSize: "13px", borderRadius: "8px" }}>
                            <FiAlertTriangle className="shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="alert alert-success px-3 py-2 d-flex align-items-center gap-2 mb-3" style={{ fontSize: "13px", borderRadius: "8px" }}>
                            <FiCheckCircle className="shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    <div className="form-section-title">
                        <FiTruck /> <span>Vehicle Identity Details</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Registration Number *</label>
                            <input
                                type="text"
                                name="registration_number"
                                className="field-input-modal"
                                value={formData.registration_number}
                                onChange={handleChange}
                                placeholder="e.g. OD05BE1209"
                                required
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Vehicle Class *</label>
                            <select
                                name="vehicle_class"
                                className="field-select-modal"
                                value={formData.vehicle_class}
                                onChange={handleChange}
                            >
                                <option value="light">Light Commercial Vehicle (LMV)</option>
                                <option value="heavy">Heavy Goods Vehicle (HGV)</option>
                                <option value="medium">Medium Goods Vehicle (MGV)</option>
                            </select>
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Maker Name</label>
                            <input
                                type="text"
                                name="maker_name"
                                className="field-input-modal"
                                value={formData.maker_name}
                                onChange={handleChange}
                                placeholder="e.g. TATA MOTORS LTD"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Model Name</label>
                            <input
                                type="text"
                                name="model_name"
                                className="field-input-modal"
                                value={formData.model_name}
                                onChange={handleChange}
                                placeholder="e.g. TATA LPT 4825"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Colour</label>
                            <input
                                type="text"
                                name="colour"
                                className="field-input-modal"
                                value={formData.colour}
                                onChange={handleChange}
                                placeholder="e.g. MAROON ORANGE"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Body Type</label>
                            <input
                                type="text"
                                name="body_type"
                                className="field-input-modal"
                                value={formData.body_type}
                                onChange={handleChange}
                                placeholder="e.g. TRUCK OPEN"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiSettings /> <span>Dimensions, Capacities & Axles</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Seating Capacity</label>
                            <input
                                type="text"
                                name="seating"
                                className="field-input-modal"
                                value={formData.seating}
                                onChange={handleChange}
                                placeholder="e.g. 2"
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Standing Capacity</label>
                            <input
                                type="text"
                                name="standing"
                                className="field-input-modal"
                                value={formData.standing}
                                onChange={handleChange}
                                placeholder="e.g. 0"
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Sleeper Capacity</label>
                            <input
                                type="text"
                                name="sleeper"
                                className="field-input-modal"
                                value={formData.sleeper}
                                onChange={handleChange}
                                placeholder="e.g. 0"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Number of Axles</label>
                            <input
                                type="text"
                                name="number_of_axles"
                                className="field-input-modal"
                                value={formData.number_of_axles}
                                onChange={handleChange}
                                placeholder="e.g. 5"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Number of Cylinders</label>
                            <input
                                type="text"
                                name="number_of_cylinders"
                                className="field-input-modal"
                                value={formData.number_of_cylinders}
                                onChange={handleChange}
                                placeholder="e.g. 6"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiSettings /> <span>Weight Details (Kg)</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Unladen Weight (Kg)</label>
                            <input
                                type="text"
                                name="unladen_kg"
                                className="field-input-modal"
                                value={formData.unladen_kg}
                                onChange={handleChange}
                                placeholder="e.g. 13880"
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Laden Weight (Kg)</label>
                            <input
                                type="text"
                                name="laden_kg"
                                className="field-input-modal"
                                value={formData.laden_kg}
                                onChange={handleChange}
                                placeholder="e.g. 47500"
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Gross Combination Weight</label>
                            <input
                                type="text"
                                name="gross_combination_weight_kg"
                                className="field-input-modal"
                                value={formData.gross_combination_weight_kg}
                                onChange={handleChange}
                                placeholder="e.g. 0"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiSettings /> <span>Engine & Base Dimensions</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Cubic Capacity (CC)</label>
                            <input
                                type="text"
                                name="cubic_capacity"
                                className="field-input-modal"
                                value={formData.cubic_capacity}
                                onChange={handleChange}
                                placeholder="e.g. 6702.00"
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Horse Power (BHP)</label>
                            <input
                                type="text"
                                name="horse_power"
                                className="field-input-modal"
                                value={formData.horse_power}
                                onChange={handleChange}
                                placeholder="e.g. 249.24"
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Wheel Base (mm)</label>
                            <input
                                type="text"
                                name="wheel_base_mm"
                                className="field-input-modal"
                                value={formData.wheel_base_mm}
                                onChange={handleChange}
                                placeholder="e.g. 6730"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiCalendar /> <span>Administration & Finance</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Month-Year of Mfg.</label>
                            <input
                                type="text"
                                name="month_year_of_manufacture"
                                className="field-input-modal"
                                value={formData.month_year_of_manufacture}
                                onChange={handleChange}
                                placeholder="e.g. 07-2021"
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Financier</label>
                            <input
                                type="text"
                                name="financier"
                                className="field-input-modal"
                                value={formData.financier}
                                onChange={handleChange}
                                placeholder="e.g. TATA MOTORS FINANCE LIMITED"
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Registration Authority</label>
                            <input
                                type="text"
                                name="registration_authority"
                                className="field-input-modal"
                                value={formData.registration_authority}
                                onChange={handleChange}
                                placeholder="e.g. CUTTACK RTO"
                            />
                        </div>
                    </div>

                    <div className="modal-footer-actions">
                        <button type="button" className="btn btn-outline-light px-4 py-2" style={{ borderRadius: "8px", fontSize: "14px" }} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2" style={{ borderRadius: "8px", fontSize: "14px" }} disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-ring-mini"></span>
                                    <span>Registering...</span>
                                </>
                            ) : (
                                <span>Submit Registration</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterVehicleForm;
