import { useState } from "react";
import { FiCheckCircle, FiCopy, FiCheck, FiCode, FiChevronDown, FiChevronUp, FiTerminal, FiTruck } from "react-icons/fi";
import RegisterDriverForm from "./RegisterDriverForm";
import RegisterVehicleForm from "./RegisterVehicleForm";

const LABEL_MAP = {
    dlNumber: "Driving Licence Number",
    registration: "Vehicle Registration No",
    aadhaarNumber: "Aadhaar Number",
    panNumber: "PAN Card Number",
    name: "Full Name",
    father: "Father / Guardian Name",
    dob: "Date of Birth",
    blood: "Blood Group",
    gender: "Gender",
    issueDate: "Issue Date",
    validityNt: "Validity (NT)",
    validityTr: "Validity (TR)",
    issuingAuthority: "Issuing Authority",
    
    // Flat RC Schema Fields (ONLY the 7 allowed fields)
    registration_number: "Registration Number",
    owner_name: "Vehicle Owner Name",
    owner_pan_number: "Owner PAN Number",
    engine_number: "Engine Number",
    chassis_number: "Chassis Number",
    vehicle_class: "Vehicle Class",
    number_of_wheels: "Number of Wheels"
};

function ResultCard({ data, text, docType }) {
    const [copiedKey, setCopiedKey] = useState(null);
    const [copiedJson, setCopiedJson] = useState(false);
    const [showRawText, setShowRawText] = useState(false);
    const [formData, setFormData] = useState({});
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [showVehicleForm, setShowVehicleForm] = useState(false);

    if (!data) return null;

    // Helper to flatten nested properties and filter out non-supported fields if RC
    const getFlattenedData = (rawObj) => {
        if (!rawObj) return {};
        const flat = {};
        
        // Check if this is an RC document
        const isRC = rawObj.registration_number !== undefined || docType === "Registration Certificate";

        Object.keys(rawObj).forEach(key => {
            const val = rawObj[key];
            if (val && typeof val === "object" && !Array.isArray(val)) {
                Object.keys(val).forEach(subKey => {
                    if (!isRC || LABEL_MAP[subKey] !== undefined) {
                        flat[subKey] = val[subKey];
                    }
                });
            } else {
                if (!isRC || LABEL_MAP[key] !== undefined) {
                    flat[key] = val;
                }
            }
        });
        return flat;
    };

    const flatData = getFlattenedData(data);

    const formatLabel = (key) => {
        if (LABEL_MAP[key]) return LABEL_MAP[key];
        return key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
    };

    const handleCopy = (key, value) => {
        const valToCopy = formData[key] !== undefined ? formData[key] : value;
        navigator.clipboard.writeText(valToCopy || "");
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1800);
    };

    const handleCopyAll = () => {
        const fullData = {};
        const isRC = data.registration_number !== undefined || docType === "Registration Certificate";

        if (isRC) {
            fullData.registration_number = formData.registration_number !== undefined ? formData.registration_number : (data.registration_number || "");
            fullData.owner_name = formData.owner_name !== undefined ? formData.owner_name : (data.owner_name || "");
            fullData.owner_pan_number = formData.owner_pan_number !== undefined ? formData.owner_pan_number : (data.owner_pan_number || "");
            fullData.engine_number = formData.engine_number !== undefined ? formData.engine_number : (data.engine_number || "");
            fullData.chassis_number = formData.chassis_number !== undefined ? formData.chassis_number : (data.chassis_number || "");
            fullData.vehicle_class = formData.vehicle_class !== undefined ? formData.vehicle_class : (data.vehicle_class || "");
            fullData.number_of_wheels = formData.number_of_wheels !== undefined ? formData.number_of_wheels : (data.number_of_wheels || "");
        } else {
            Object.assign(fullData, data, formData);
        }

        navigator.clipboard.writeText(JSON.stringify(fullData, null, 2));
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
    };

    const handleInputChange = (key, val) => {
        setFormData(prev => ({ ...prev, [key]: val }));
    };

    return (
        <div className="custom-card mt-4">
            <div className="card-header-clean">
                <div>
                    <h3 className="card-title-clean text-white">
                        <FiCheckCircle className="text-success" style={{ fontSize: '18px' }} />
                        <span>Extracted Details</span>
                    </h3>
                    <p className="card-subtitle mb-0">Review, edit, or copy extracted document fields</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    {docType && (
                        <span className="badge-tag badge-blue">
                            {docType}
                        </span>
                    )}
                    <button
                        onClick={handleCopyAll}
                        className="btn-action-outline d-flex align-items-center gap-2"
                        title="Copy all details to clipboard"
                    >
                        {copiedJson ? <FiCheck className="text-success" /> : <FiCode />}
                        <span>{copiedJson ? "Copied JSON" : "Copy JSON"}</span>
                    </button>
                </div>
            </div>

            <div className="card-body-clean">
                <div className="row g-3">
                    {Object.keys(flatData).map((key) => {
                        const originalValue = flatData[key];
                        const currentValue = formData[key] !== undefined ? formData[key] : originalValue;

                        return (
                            <div key={key} className="col-12 col-md-6">
                                <div className="result-item-card">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="field-label-clean">{formatLabel(key)}</span>
                                        <button
                                            onClick={() => handleCopy(key, currentValue)}
                                            className="copy-field-btn"
                                            title={`Copy ${formatLabel(key)}`}
                                        >
                                            {copiedKey === key ? (
                                                <FiCheck className="text-success" />
                                            ) : (
                                                <FiCopy />
                                            )}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className="field-value-input"
                                        value={currentValue || ""}
                                        onChange={(e) => handleInputChange(key, e.target.value)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="action-row-footer mt-4 pt-3 d-flex justify-content-between align-items-center gap-3">
                    <button
                        onClick={() => setShowRawText(!showRawText)}
                        className="btn-action-text d-flex align-items-center gap-2"
                    >
                        <FiTerminal />
                        <span>{showRawText ? "Hide Raw OCR Log" : "Show Raw OCR Log"}</span>
                        {showRawText ? <FiChevronUp /> : <FiChevronDown />}
                    </button>

                    {docType === "Driving Licence" && (
                        <button
                            onClick={() => setShowRegisterForm(true)}
                            className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2"
                            style={{ borderRadius: "8px", fontWeight: "500" }}
                        >
                            <span>Verify & Register Driver</span>
                        </button>
                    )}

                    {(docType === "Registration Certificate" || docType === "RC") && (
                        <button
                            onClick={() => setShowVehicleForm(true)}
                            className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2"
                            style={{ borderRadius: "8px", fontWeight: "500" }}
                        >
                            <FiTruck />
                            <span>Verify & Register Vehicle</span>
                        </button>
                    )}
                </div>

                {showRawText && (
                    <div className="raw-text-panel mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2 px-3 py-2 border-bottom border-secondary-subtle">
                            <span className="raw-panel-title">Raw Document Text Output</span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(text);
                                    setCopiedKey("raw");
                                    setTimeout(() => setCopiedKey(null), 1000);
                                }}
                                className="copy-field-btn"
                            >
                                {copiedKey === "raw" ? <FiCheck className="text-success" /> : <FiCopy />}
                            </button>
                        </div>
                        <pre className="raw-text-content">{text}</pre>
                    </div>
                )}
            </div>

            {showRegisterForm && (
                <RegisterDriverForm
                    data={flatData}
                    onClose={() => setShowRegisterForm(false)}
                />
            )}

            {showVehicleForm && (
                <RegisterVehicleForm
                    data={flatData}
                    onClose={() => setShowVehicleForm(false)}
                />
            )}
        </div>
    );
}

export default ResultCard;