import { useState, useEffect } from "react";
import { FiX, FiCheckCircle, FiAlertTriangle, FiUser, FiPhone, FiTruck, FiMapPin, FiCalendar, FiSettings } from "react-icons/fi";
import API from "../services/api";
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
        category: "truck",
        manufacturing_date: "",
        registration_number: data.registration || "",
        vehicle_class: mapVehicleClass(data.vehicleClass),
        number_of_wheels: "10",
        weight_capacity: "",
        engine_number: data.engine || "",
        chassis_number: data.chassis || "",
        maker: data.maker || "",
        model: data.model || "",
        body_type: "open trolly",
        fuel_type: "diesel",
        vehicle_color: "",
        cubic_capacity: "",
        gross_weight: "",
        unladen_weight: "",
        passing_weight: "",
        ownership_start_date: data.registrationDate || "",
        owner_pan_number: "",
        owner_name: data.owner || "",
        owner_address: "",
        owner_contact: "",
        owner_email: "",
        rc_number: data.registration || "",
        registration_at: data.authority || "",
        fitness_valid_till: data.fitnessValidity || "",
        wheel: "",
        owner_district: "",
        owner_state: "",
        owner_area: "",
        owner_pin_code: "",
        registration_date_from: data.registrationDate || "",
        registration_date_to: data.fitnessValidity || "",
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
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === "registration_number") {
                updated.rc_number = value;
            }
            if (name === "registrationDate") {
                updated.ownership_start_date = value;
                updated.registration_date_from = value;
            }
            if (name === "fitnessValidity") {
                updated.fitness_valid_till = value;
                updated.registration_date_to = value;
            }
            return updated;
        });
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
        if (!formData.number_of_wheels.trim()) {
            setErrorMsg("Number of Wheels is required.");
            return;
        }
        if (!formData.owner_pan_number.trim()) {
            setErrorMsg("Owner PAN is required.");
            return;
        }
        if (!formData.owner_name.trim()) {
            setErrorMsg("Owner Name is required.");
            return;
        }
        if (!formData.owner_contact.trim()) {
            setErrorMsg("Owner Contact phone is required.");
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem("tms_token");
            if (!token) {
                setErrorMsg("You are not authenticated. Please log in.");
                return;
            }

            const convertToISODate = (dateStr) => {
                if (!dateStr) return "";
                const cleanStr = dateStr.trim();
                if (cleanStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    return cleanStr;
                }
                const dmyMatch = cleanStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
                if (dmyMatch) {
                    const [_, day, month, year] = dmyMatch;
                    return `${year}-${month}-${day}`;
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
            Object.keys(formData).forEach(key => {
                let value = formData[key];
                if (value !== undefined && value !== null && value !== "") {
                    if (["manufacturing_date", "ownership_start_date", "fitness_valid_till", "registration_date_from", "registration_date_to"].includes(key)) {
                        value = convertToISODate(value);
                    }
                    bodyFormData.append(key, value);
                }
            });

            // Adjust numerical parameters
            bodyFormData.set("number_of_wheels", (parseInt(formData.number_of_wheels) || 10).toString());
            if (formData.weight_capacity) bodyFormData.set("weight_capacity", parseFloat(formData.weight_capacity).toString());
            if (formData.cubic_capacity) bodyFormData.set("cubic_capacity", parseFloat(formData.cubic_capacity).toString());
            if (formData.gross_weight) bodyFormData.set("gross_weight", parseFloat(formData.gross_weight).toString());
            if (formData.unladen_weight) bodyFormData.set("unladen_weight", parseFloat(formData.unladen_weight).toString());
            if (formData.passing_weight) bodyFormData.set("passing_weight", parseFloat(formData.passing_weight).toString());

            // Override location with serialized JSON object
            bodyFormData.set("location", JSON.stringify({
                latitude: parseFloat(formData.latitude) || 20.3493551,
                longitude: parseFloat(formData.longitude) || 85.8077988
            }));

            // Direct Axios POST to external TMS API
            const response = await axios.post("https://tms.traanslogsinnovation.com/api/vehicles", bodyFormData, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json, text/plain, */*"
                    // Content-Type header is intentionally left blank so browser configures boundary stream automatically
                }
            });

            if (response.status === 200 || response.status === 201) {
                setSuccessMsg("Vehicle registered successfully in the TMS system!");
            } else {
                setErrorMsg("Vehicle registration failed: " + (response.data?.message || "Unknown error"));
            }
        } catch (err) {
            console.error("Registration request failed:", err);
            if (err.response && err.response.status === 401) {
                console.warn("Dynamic token expired. Triggering page reload...");
                localStorage.removeItem("tms_token");
                localStorage.removeItem("tms_user");
                localStorage.removeItem("tms_org_id");
                window.location.reload();
                return;
            }
            const apiError = err.response?.data?.message 
                || err.response?.data?.error?.message 
                || "Failed to connect to TMS server. Please check credentials and connection.";
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
                        <p className="registration-modal-subtitle">Submit scanned vehicle registration certificate (RC) directly to TMS Portal</p>
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
                            <label className="field-label-modal">Registration Number (Truck Number) *</label>
                            <input
                                type="text"
                                name="registration_number"
                                className="field-input-modal"
                                value={formData.registration_number}
                                onChange={handleChange}
                                placeholder="e.g. OR054518"
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
                                <option value="other">Other Spec</option>
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
                            <label className="field-label-modal">Category</label>
                            <input
                                type="text"
                                name="category"
                                className="field-input-modal"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="e.g. truck"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiSettings /> <span>Technical Specifications</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Chassis Number</label>
                            <input
                                type="text"
                                name="chassis_number"
                                className="field-input-modal"
                                value={formData.chassis_number}
                                onChange={handleChange}
                                placeholder="17-character VIN/Chassis Number"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Engine Number</label>
                            <input
                                type="text"
                                name="engine_number"
                                className="field-input-modal"
                                value={formData.engine_number}
                                onChange={handleChange}
                                placeholder="Engine serial identifier"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Maker</label>
                            <input
                                type="text"
                                name="maker"
                                className="field-input-modal"
                                value={formData.maker}
                                onChange={handleChange}
                                placeholder="e.g. TATA, LEYLAND"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Model Name</label>
                            <input
                                type="text"
                                name="model"
                                className="field-input-modal"
                                value={formData.model}
                                onChange={handleChange}
                                placeholder="e.g. LPT 4825"
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
                                placeholder="e.g. open trolly, container"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Fuel Type</label>
                            <input
                                type="text"
                                name="fuel_type"
                                className="field-input-modal"
                                value={formData.fuel_type}
                                onChange={handleChange}
                                placeholder="e.g. diesel, petrol"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Vehicle Color</label>
                            <input
                                type="text"
                                name="vehicle_color"
                                className="field-input-modal"
                                value={formData.vehicle_color}
                                onChange={handleChange}
                                placeholder="Color details"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Cubic Capacity (cc)</label>
                            <input
                                type="number"
                                name="cubic_capacity"
                                className="field-input-modal"
                                value={formData.cubic_capacity}
                                onChange={handleChange}
                                placeholder="e.g. 5600"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiCalendar /> <span>Weights & Validity Lifespans</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Weight Capacity (Tons)</label>
                            <input
                                type="number"
                                name="weight_capacity"
                                className="field-input-modal"
                                value={formData.weight_capacity}
                                onChange={handleChange}
                                placeholder="Capacity in tons"
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Gross Weight (Kg)</label>
                            <input
                                type="number"
                                name="gross_weight"
                                className="field-input-modal"
                                value={formData.gross_weight}
                                onChange={handleChange}
                                placeholder="Gross weight"
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">Unladen Weight (Kg)</label>
                            <input
                                type="number"
                                name="unladen_weight"
                                className="field-input-modal"
                                value={formData.unladen_weight}
                                onChange={handleChange}
                                placeholder="Unladen weight"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Manufacturing Date</label>
                            <input
                                type="text"
                                name="manufacturing_date"
                                className="field-input-modal"
                                value={formData.manufacturing_date}
                                onChange={handleChange}
                                placeholder="Manufacturing Date representation"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Fitness Valid Till</label>
                            <input
                                type="text"
                                name="fitness_valid_till"
                                className="field-input-modal"
                                value={formData.fitness_valid_till}
                                onChange={handleChange}
                                placeholder="Fitness expiry date"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Ownership Start Date</label>
                            <input
                                type="text"
                                name="ownership_start_date"
                                className="field-input-modal"
                                value={formData.ownership_start_date}
                                onChange={handleChange}
                                placeholder="Purchase or registration date"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Registration Office (RTO)</label>
                            <input
                                type="text"
                                name="registration_at"
                                className="field-input-modal"
                                value={formData.registration_at}
                                onChange={handleChange}
                                placeholder="Registration Authority name"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiUser /> <span>Owner Details & Contact</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Owner Name *</label>
                            <input
                                type="text"
                                name="owner_name"
                                className="field-input-modal"
                                value={formData.owner_name}
                                onChange={handleChange}
                                placeholder="Enter vehicle owner name"
                                required
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Owner PAN *</label>
                            <input
                                type="text"
                                name="owner_pan_number"
                                className="field-input-modal"
                                value={formData.owner_pan_number}
                                onChange={handleChange}
                                placeholder="10-digit PAN code (e.g. GPMPS5467E)"
                                required
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Phone Number *</label>
                            <input
                                type="tel"
                                name="owner_contact"
                                className="field-input-modal"
                                value={formData.owner_contact}
                                onChange={handleChange}
                                placeholder="Primary owner contact phone"
                                required
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Owner Email</label>
                            <input
                                type="email"
                                name="owner_email"
                                className="field-input-modal"
                                value={formData.owner_email}
                                onChange={handleChange}
                                placeholder="Owner email address"
                            />
                        </div>

                        <div className="col-12">
                            <label className="field-label-modal">Owner Address</label>
                            <textarea
                                name="owner_address"
                                className="field-input-modal"
                                style={{ height: "60px", resize: "none" }}
                                value={formData.owner_address}
                                onChange={handleChange}
                                placeholder="Owner complete address"
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">State</label>
                            <input
                                type="text"
                                name="owner_state"
                                className="field-input-modal"
                                value={formData.owner_state}
                                onChange={handleChange}
                                placeholder="Odisha, etc."
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">District</label>
                            <input
                                type="text"
                                name="owner_district"
                                className="field-input-modal"
                                value={formData.owner_district}
                                onChange={handleChange}
                                placeholder="District name"
                            />
                        </div>

                        <div className="col-12 col-md-4">
                            <label className="field-label-modal">PIN Code</label>
                            <input
                                type="text"
                                name="owner_pin_code"
                                className="field-input-modal"
                                value={formData.owner_pin_code}
                                onChange={handleChange}
                                placeholder="PIN code"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiMapPin /> <span>Locational Parameters</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">GPS Latitude</label>
                            <input
                                type="text"
                                name="latitude"
                                className="field-input-modal"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="Latitude coordinate"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">GPS Longitude</label>
                            <input
                                type="text"
                                name="longitude"
                                className="field-input-modal"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="Longitude coordinate"
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
