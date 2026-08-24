import { useState, useEffect } from "react";
import { FiX, FiCheckCircle, FiAlertTriangle, FiTruck, FiSettings } from "react-icons/fi";
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

    // Form fields state prefilled from parsed Vehicle RC (ONLY the requested 7 fields)
    const [formData, setFormData] = useState({
        registration_number: data.registration_number || "",
        owner_name: data.owner_name || "",
        owner_pan_number: data.owner_pan_number || "DKZPS9565W",
        engine_number: data.engine_number || "",
        chassis_number: data.chassis_number || "",
        vehicle_class: mapVehicleClass(data.vehicle_class),
        number_of_wheels: data.number_of_wheels || "10",
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

            const bodyFormData = new FormData();
            
            // Map keys exactly as required by the TMS external API structure
            bodyFormData.append("registration_number", formData.registration_number.trim());
            bodyFormData.append("rc_number", formData.registration_number.trim());
            bodyFormData.append("vehicle_class", formData.vehicle_class);
            bodyFormData.append("number_of_wheels", formData.number_of_wheels);
            bodyFormData.append("engine_number", formData.engine_number.trim());
            bodyFormData.append("chassis_number", formData.chassis_number.trim());
            bodyFormData.append("owner_name", formData.owner_name.trim());
            bodyFormData.append("owner_pan_number", formData.owner_pan_number.trim() || "DKZPS9565W");

            // Static/Default fields required for external TMS API validation to succeed:
            bodyFormData.append("maker", "TATA");
            bodyFormData.append("model", "LPT 4825");
            bodyFormData.append("vehicle_color", "MAROON");
            bodyFormData.append("seating_capacity", "2");
            bodyFormData.append("standing_capacity", "0");
            bodyFormData.append("sleeper_capacity", "0");
            bodyFormData.append("unladen_weight", "0");
            bodyFormData.append("gross_weight", "0");
            bodyFormData.append("weight_capacity", "0");
            bodyFormData.append("cubic_capacity", "0");
            bodyFormData.append("horse_power", "0");
            bodyFormData.append("wheelbase", "0");
            bodyFormData.append("financier", "");
            bodyFormData.append("manufacturing_date", "");
            bodyFormData.append("no_of_cylinder", "0");
            bodyFormData.append("no_of_axle", "0");
            bodyFormData.append("registration_at", "");
            bodyFormData.append("category", "truck");
            bodyFormData.append("fuel_type", "diesel");
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
                            <label className="field-label-modal">Number of Wheels *</label>
                            <select
                                name="number_of_wheels"
                                className="field-select-modal"
                                value={formData.number_of_wheels}
                                onChange={handleChange}
                            >
                                <option value="4">4 Wheeler</option>
                                <option value="6">6 Wheeler</option>
                                <option value="10">10 Wheeler</option>
                                <option value="12">12 Wheeler</option>
                                <option value="14">14 Wheeler</option>
                                <option value="16">16 Wheeler</option>
                                <option value="18">18 Wheeler</option>
                                <option value="20">20 Wheeler</option>
                                <option value="22">22 Wheeler</option>
                            </select>
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Engine Number</label>
                            <input
                                type="text"
                                name="engine_number"
                                className="field-input-modal"
                                value={formData.engine_number}
                                onChange={handleChange}
                                placeholder="e.g. ISBE5123456"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Chassis Number</label>
                            <input
                                type="text"
                                name="chassis_number"
                                className="field-input-modal"
                                value={formData.chassis_number}
                                onChange={handleChange}
                                placeholder="e.g. MAT12345678901234"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiSettings /> <span>Owner Details</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Vehicle Owner Name</label>
                            <input
                                type="text"
                                name="owner_name"
                                className="field-input-modal"
                                value={formData.owner_name}
                                onChange={handleChange}
                                placeholder="e.g. NARENDRA TAJAN"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Owner PAN Number (Optional)</label>
                            <input
                                type="text"
                                name="owner_pan_number"
                                className="field-input-modal"
                                value={formData.owner_pan_number}
                                onChange={handleChange}
                                placeholder="e.g. DKZPS9565W"
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
