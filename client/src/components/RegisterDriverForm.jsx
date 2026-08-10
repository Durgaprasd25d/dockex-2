import { useState, useEffect } from "react";
import { FiX, FiCheckCircle, FiAlertTriangle, FiUser, FiPhone, FiTruck, FiMapPin, FiCalendar } from "react-icons/fi";
import API from "../services/api";
import axios from "axios";

function RegisterDriverForm({ data, onClose }) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    
    // Form fields state prefilled from parsed Driving Licence
    const [formData, setFormData] = useState({
        driver_license_number: data.dlNumber || "",
        driver_name: data.name || "",
        dob: data.dob || "",
        mobile_number: "",
        additional_mobile_number: "",
        aadhar_number: data.aadhaarNumber || "",
        blood_group: data.blood || "",
        vehicle_type: "container_truck",
        driver_address: data.address || "",
        driver_pin_code: "",
        driver_area: "",
        driver_district: "",
        driver_state: data.issuingAuthority || "",
        state: data.issuingAuthority || "",
        rto: data.issuingAuthority || "",
        rto_code: "",
        transport_valid_form: data.issueDate || "",
        transport_valid_upto: data.validityTr || data.validityNt || "",
        valid_form: data.issueDate || "",
        valid_upto: data.validityNt || data.validityTr || "",
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
                    // Use mock default values matching documentation
                    setFormData(prev => ({
                        ...prev,
                        latitude: "20.3493603",
                        longitude: "85.8078294"
                    }));
                }
            );
        } else {
            setFormData(prev => ({
                ...prev,
                latitude: "20.3493603",
                longitude: "85.8078294"
            }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // Keep state and driver_state synchronized
            if (name === "state") {
                updated.driver_state = value;
            }
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!formData.driver_license_number.trim()) {
            setErrorMsg("License Number is required.");
            return;
        }
        if (!formData.driver_name.trim()) {
            setErrorMsg("Driver Name is required.");
            return;
        }
        if (!formData.mobile_number.trim()) {
            setErrorMsg("Mobile Number is required.");
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
                if (value !== undefined && value !== null) {
                    if (["dob", "transport_valid_form", "transport_valid_upto", "valid_form", "valid_upto"].includes(key)) {
                        value = convertToISODate(value);
                    }
                    bodyFormData.append(key, value);
                }
            });

            // Override location with serialized JSON object
            bodyFormData.set("location", JSON.stringify({
                latitude: parseFloat(formData.latitude) || 20.3493603,
                longitude: parseFloat(formData.longitude) || 85.8078294
            }));

            // Direct Axios POST to external TMS API
            const response = await axios.post("https://tms.traanslogsinnovation.com/api/drivers", bodyFormData, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json, text/plain, */*"
                    // Content-Type header is intentionally left blank so browser configures boundary stream automatically
                }
            });

            if (response.status === 200 || response.status === 201) {
                setSuccessMsg("Driver registered successfully in the TMS system!");
            } else {
                setErrorMsg("Driver registration failed: " + (response.data?.message || "Unknown error"));
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
                            <span>TMS Driver Registration</span>
                        </h3>
                        <p className="registration-modal-subtitle">Submit scanned driver identity details directly to TMS Portal</p>
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
                        <FiUser /> <span>Driver Personal Information</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Driver Name *</label>
                            <input
                                type="text"
                                name="driver_name"
                                className="field-input-modal"
                                value={formData.driver_name}
                                onChange={handleChange}
                                placeholder="Enter driver name"
                                required
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Date of Birth</label>
                            <input
                                type="text"
                                name="dob"
                                className="field-input-modal"
                                value={formData.dob}
                                onChange={handleChange}
                                placeholder="DD-MM-YYYY or Date representation"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Blood Group</label>
                            <input
                                type="text"
                                name="blood_group"
                                className="field-input-modal"
                                value={formData.blood_group}
                                onChange={handleChange}
                                placeholder="e.g. O+, B+, A-"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Aadhaar Number</label>
                            <input
                                type="text"
                                name="aadhar_number"
                                className="field-input-modal"
                                value={formData.aadhar_number}
                                onChange={handleChange}
                                placeholder="12-digit Aadhaar Card Number"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiPhone /> <span>Contact Information</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Mobile Number *</label>
                            <input
                                type="tel"
                                name="mobile_number"
                                className="field-input-modal"
                                value={formData.mobile_number}
                                onChange={handleChange}
                                placeholder="10-digit primary mobile number"
                                required
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Additional Mobile Number</label>
                            <input
                                type="tel"
                                name="additional_mobile_number"
                                className="field-input-modal"
                                value={formData.additional_mobile_number}
                                onChange={handleChange}
                                placeholder="Secondary contact number"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiTruck /> <span>License & Vehicle Details</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">License Number *</label>
                            <input
                                type="text"
                                name="driver_license_number"
                                className="field-input-modal"
                                value={formData.driver_license_number}
                                onChange={handleChange}
                                placeholder="Enter driving license number"
                                required
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Vehicle Type</label>
                            <select
                                name="vehicle_type"
                                className="field-select-modal"
                                value={formData.vehicle_type}
                                onChange={handleChange}
                            >
                                <option value="container_truck">Container Truck</option>
                                <option value="open_truck">Open Body Truck</option>
                                <option value="trailer_truck">Trailer Truck</option>
                                <option value="flatbed_truck">Flatbed Truck</option>
                                <option value="tanker_truck">Tanker Truck</option>
                                <option value="tipper_truck">Tipper Truck</option>
                                <option value="mini_truck">Mini Commercial Truck</option>
                                <option value="other_truck">Other Heavy Truck</option>
                            </select>
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">RTO Name</label>
                            <input
                                type="text"
                                name="rto"
                                className="field-input-modal"
                                value={formData.rto}
                                onChange={handleChange}
                                placeholder="e.g. CUTTACK RTO"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">RTO Code</label>
                            <input
                                type="text"
                                name="rto_code"
                                className="field-input-modal"
                                value={formData.rto_code}
                                onChange={handleChange}
                                placeholder="e.g. OD05"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiCalendar /> <span>Validity Lifespan</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">License Valid From</label>
                            <input
                                type="text"
                                name="valid_form"
                                className="field-input-modal"
                                value={formData.valid_form}
                                onChange={handleChange}
                                placeholder="Issue date of driving license"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">License Valid To</label>
                            <input
                                type="text"
                                name="valid_upto"
                                className="field-input-modal"
                                value={formData.valid_upto}
                                onChange={handleChange}
                                placeholder="Expiry date (NT Validity)"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Transport Valid From</label>
                            <input
                                type="text"
                                name="transport_valid_form"
                                className="field-input-modal"
                                value={formData.transport_valid_form}
                                onChange={handleChange}
                                placeholder="Transport category start date"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Transport Valid To</label>
                            <input
                                type="text"
                                name="transport_valid_upto"
                                className="field-input-modal"
                                value={formData.transport_valid_upto}
                                onChange={handleChange}
                                placeholder="Transport validity expiry date"
                            />
                        </div>
                    </div>

                    <div className="form-section-title">
                        <FiMapPin /> <span>Address & Geolocation Details</span>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">State</label>
                            <input
                                type="text"
                                name="state"
                                className="field-input-modal"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="Odisha, Maharashtra, etc."
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">District</label>
                            <input
                                type="text"
                                name="driver_district"
                                className="field-input-modal"
                                value={formData.driver_district}
                                onChange={handleChange}
                                placeholder="e.g. KHORDHA, CUTTACK"
                            />
                        </div>

                        <div className="col-12">
                            <label className="field-label-modal">Street Address</label>
                            <textarea
                                name="driver_address"
                                className="field-input-modal"
                                style={{ height: "60px", resize: "none" }}
                                value={formData.driver_address}
                                onChange={handleChange}
                                placeholder="Complete street address details"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">Area / Locality</label>
                            <input
                                type="text"
                                name="driver_area"
                                className="field-input-modal"
                                value={formData.driver_area}
                                onChange={handleChange}
                                placeholder="e.g. Cuttack South Division"
                            />
                        </div>

                        <div className="col-12 col-md-6">
                            <label className="field-label-modal">PIN Code</label>
                            <input
                                type="text"
                                name="driver_pin_code"
                                className="field-input-modal"
                                value={formData.driver_pin_code}
                                onChange={handleChange}
                                placeholder="6-digit PIN code"
                            />
                        </div>

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

export default RegisterDriverForm;
