import { useState } from "react";
import { FiCheckCircle, FiCopy, FiCheck, FiCode, FiChevronDown, FiChevronUp, FiTerminal, FiTruck } from "react-icons/fi";
import RegisterDriverForm from "./RegisterDriverForm";

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
    fitnessValidity: "Fitness Validity"
};

function ResultCard({ data, text, docType }) {
    const [copiedKey, setCopiedKey] = useState(null);
    const [copiedJson, setCopiedJson] = useState(false);
    const [showRawText, setShowRawText] = useState(false);
    const [formData, setFormData] = useState({});
    const [showRegisterForm, setShowRegisterForm] = useState(false);

    if (!data) return null;

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
        const fullData = { ...data, ...formData };
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
                    {Object.keys(data).map((key) => {
                        const val = formData[key] !== undefined ? formData[key] : (data[key] || "");
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

                        {docType === "Driving Licence" && (
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
                    data={{ ...data, ...formData }}
                    onClose={() => setShowRegisterForm(false)}
                />
            )}
        </div>
    );
}

export default ResultCard;