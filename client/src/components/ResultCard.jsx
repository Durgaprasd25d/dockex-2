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
    owner: "Vehicle Owner Name",
    dob: "Date of Birth",
    blood: "Blood Group",
    engine: "Engine Number",
    chassis: "Chassis Number",
    gender: "Gender",
    issueDate: "Issue Date",
    validityNt: "Validity (NT)",
    validityTr: "Validity (TR)",
    issuingAuthority: "Issuing Authority",
    registrationDate: "Registration Date",
    registrationValidity: "Registration Validity",
    fitnessValidity: "Fitness Validity",
    
    // Flattened RC Schema Fields
    vehicle_class: "Vehicle Class",
    registration_number: "Registration Number",
    maker_name: "Maker Name",
    model_name: "Model Name",
    colour: "Colour",
    body_type: "Body Type",
    seating: "Seating Capacity",
    standing: "Standing Capacity",
    sleeper: "Sleeper Capacity",
    unladen_kg: "Unladen Weight (Kg)",
    laden_kg: "Laden Weight (Kg)",
    gross_combination_weight_kg: "Gross Combination Weight (Kg)",
    cubic_capacity: "Cubic Capacity (CC)",
    horse_power: "Horse Power (BHP)",
    wheel_base_mm: "Wheel Base (mm)",
    financier: "Financier",
    month_year_of_manufacture: "Month-Year of Mfg.",
    number_of_cylinders: "Number of Cylinders",
    number_of_axles: "Number of Axles",
    registration_authority: "Registration Authority"
};

function ResultCard({ data, text, docType }) {
    const [copiedKey, setCopiedKey] = useState(null);
    const [copiedJson, setCopiedJson] = useState(false);
    const [showRawText, setShowRawText] = useState(false);
    const [formData, setFormData] = useState({});
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [showVehicleForm, setShowVehicleForm] = useState(false);

    if (!data) return null;

    // Helper to dynamically flatten any nested properties (specifically RC grouped fields)
    const getFlattenedData = (rawObj) => {
        if (!rawObj) return {};
        const flat = {};
        Object.keys(rawObj).forEach(key => {
            const val = rawObj[key];
            if (val && typeof val === "object" && !Array.isArray(val)) {
                Object.keys(val).forEach(subKey => {
                    flat[subKey] = val[subKey];
                });
            } else {
                flat[key] = val;
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
        // Construct the full object containing edits
        const fullData = {};
        
        // Reconstruct nested structure if RC, or flat if other types
        if (data.seating_standing_sleeper_capacity || data.weight || data.cubic_capacity_horse_power_wheel_base) {
            fullData.vehicle_class = formData.vehicle_class !== undefined ? formData.vehicle_class : (data.vehicle_class || "");
            fullData.registration_number = formData.registration_number !== undefined ? formData.registration_number : (data.registration_number || "");
            fullData.maker_name = formData.maker_name !== undefined ? formData.maker_name : (data.maker_name || "");
            fullData.model_name = formData.model_name !== undefined ? formData.model_name : (data.model_name || "");
            fullData.colour = formData.colour !== undefined ? formData.colour : (data.colour || "");
            fullData.body_type = formData.body_type !== undefined ? formData.body_type : (data.body_type || "");
            
            fullData.seating_standing_sleeper_capacity = {
                seating: formData.seating !== undefined ? formData.seating : (data.seating_standing_sleeper_capacity?.seating || ""),
                standing: formData.standing !== undefined ? formData.standing : (data.seating_standing_sleeper_capacity?.standing || ""),
                sleeper: formData.sleeper !== undefined ? formData.sleeper : (data.seating_standing_sleeper_capacity?.sleeper || "")
            };
            fullData.weight = {
                unladen_kg: formData.unladen_kg !== undefined ? formData.unladen_kg : (data.weight?.unladen_kg || ""),
                laden_kg: formData.laden_kg !== undefined ? formData.laden_kg : (data.weight?.laden_kg || ""),
                gross_combination_weight_kg: formData.gross_combination_weight_kg !== undefined ? formData.gross_combination_weight_kg : (data.weight?.gross_combination_weight_kg || "")
            };
            fullData.cubic_capacity_horse_power_wheel_base = {
                cubic_capacity: formData.cubic_capacity !== undefined ? formData.cubic_capacity : (data.cubic_capacity_horse_power_wheel_base?.cubic_capacity || ""),
                horse_power: formData.horse_power !== undefined ? formData.horse_power : (data.cubic_capacity_horse_power_wheel_base?.horse_power || ""),
                wheel_base_mm: formData.wheel_base_mm !== undefined ? formData.wheel_base_mm : (data.cubic_capacity_horse_power_wheel_base?.wheel_base_mm || "")
            };
            
            fullData.financier = formData.financier !== undefined ? formData.financier : (data.financier || "");
            fullData.month_year_of_manufacture = formData.month_year_of_manufacture !== undefined ? formData.month_year_of_manufacture : (data.month_year_of_manufacture || "");
            fullData.number_of_cylinders = formData.number_of_cylinders !== undefined ? formData.number_of_cylinders : (data.number_of_cylinders || "");
            fullData.number_of_axles = formData.number_of_axles !== undefined ? formData.number_of_axles : (data.number_of_axles || "");
            fullData.registration_authority = formData.registration_authority !== undefined ? formData.registration_authority : (data.registration_authority || "");
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
                    <span className="badge-tag badge-green">
                        ✓ Verified
                    </span>
                </div>
            </div>

            <div className="p-4">
                <div className="row g-3">
                    {Object.keys(flatData).map((key) => {
                        const val = formData[key] !== undefined ? formData[key] : (flatData[key] || "");
                        const isCopied = copiedKey === key;
                        return (
                            <div className="col-12 col-md-6" key={key}>
                                <div className="result-field-group">
                                    <label className="field-label">{formatLabel(key)}</label>
                                    <div className="field-input-wrapper">
                                        <input
                                            className="field-input"
                                            value={val}
                                            onChange={(e) => handleInputChange(key, e.target.value)}
                                            placeholder={`No ${formatLabel(key).toLowerCase()} detected`}
                                        />
                                        <button
                                            type="button"
                                            className={`copy-mini-btn ${isCopied ? "copied" : ""}`}
                                            onClick={() => handleCopy(key, val)}
                                            title="Copy field value"
                                        >
                                            {isCopied ? (
                                                <>
                                                    <FiCheck style={{ fontSize: '12px' }} /> Copied
                                                </>
                                            ) : (
                                                <>
                                                    <FiCopy style={{ fontSize: '12px' }} /> Copy
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4 pt-3 border-top border-secondary border-opacity-25">
                    <div className="d-flex align-items-center gap-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-light d-flex align-items-center gap-2"
                            onClick={handleCopyAll}
                            style={{ borderRadius: '8px', fontSize: '13px', padding: '6px 14px' }}
                        >
                            {copiedJson ? (
                                <>
                                    <FiCheck className="text-success" />
                                    <span>Copied JSON</span>
                                </>
                            ) : (
                                <>
                                    <FiCode />
                                    <span>Copy All JSON</span>
                                </>
                            )}
                        </button>

                        {(docType === "Driving Licence" || docType === "DL") && (
                            <button
                                type="button"
                                className="btn btn-sm btn-primary d-flex align-items-center gap-2"
                                onClick={() => setShowRegisterForm(true)}
                                style={{ borderRadius: '8px', fontSize: '13px', padding: '6px 14px' }}
                            >
                                <FiTruck style={{ fontSize: '14px' }} />
                                <span>Register Driver in TMS</span>
                            </button>
                        )}

                        {(docType === "Registration Certificate" || docType === "Vehicle RC" || docType === "RC") && (
                            <button
                                type="button"
                                className="btn btn-sm btn-primary d-flex align-items-center gap-2"
                                onClick={() => setShowVehicleForm(true)}
                                style={{ borderRadius: '8px', fontSize: '13px', padding: '6px 14px' }}
                            >
                                <FiTruck style={{ fontSize: '14px' }} />
                                <span>Register Vehicle in TMS</span>
                            </button>
                        )}
                    </div>

                    {text && (
                        <button
                            type="button"
                            className="btn btn-sm btn-link text-decoration-none text-muted p-0 d-flex align-items-center gap-1"
                            onClick={() => setShowRawText(!showRawText)}
                            style={{ fontSize: '13px' }}
                        >
                            <FiTerminal style={{ fontSize: '14px' }} />
                            <span>{showRawText ? "Hide Raw OCR Text" : "View Raw OCR Text"}</span>
                            {showRawText ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                    )}
                </div>

                {text && showRawText && (
                    <div className="mt-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="field-label mb-0">Raw Tesseract Output</span>
                            <button
                                type="button"
                                className="copy-mini-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(text);
                                    alert("Raw OCR text copied!");
                                }}
                            >
                                <FiCopy style={{ fontSize: '12px' }} /> Copy Raw Text
                            </button>
                        </div>
                        <div className="raw-text-box">
                            {text}
                        </div>
                    </div>
                )}
            </div>
            {showRegisterForm && (
                <RegisterDriverForm
                    data={{ ...flatData, ...formData }}
                    onClose={() => setShowRegisterForm(false)}
                />
            )}
            {showVehicleForm && (
                <RegisterVehicleForm
                    data={{ ...flatData, ...formData }}
                    onClose={() => setShowVehicleForm(false)}
                />
            )}
        </div>
    );
}

export default ResultCard;