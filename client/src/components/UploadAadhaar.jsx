import { useState } from "react";
import { FiFileText, FiUploadCloud, FiSearch, FiX, FiAlertTriangle, FiFile } from "react-icons/fi";
import API from "../services/api";
import ResultCard from "./ResultCard";
import { compressImage } from "../utils/compressImage";
import { processImageOCR } from "../services/clientOcr";

function UploadAadhaar() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [rawText, setRawText] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isDragActive, setIsDragActive] = useState(false);

    const handleFileSelect = (selectedFile) => {
        if (!selectedFile) return;
        if (!selectedFile.type.startsWith("image/")) {
            setErrorMsg("Please upload a valid image file (PNG, JPG, JPEG, WEBP)");
            return;
        }
        setErrorMsg("");
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setResult(null);
        setRawText("");
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const upload = async () => {
        if (!file) {
            setErrorMsg("Please select or drop an Aadhaar Card image first");
            return;
        }

        setErrorMsg("");
        setLoading(true);

        try {
            const compressedFile = await compressImage(file);
            const recognizedText = await processImageOCR(compressedFile);

            const form = new FormData();
            if (recognizedText && recognizedText.trim().length > 5) {
                form.append("text", recognizedText);
            } else {
                form.append("image", compressedFile);
            }
            form.append("type", "AADHAAR");

            const res = await API.post("/upload", form);
            if (res.data && res.data.data) {
                setResult(res.data.data);
                if (res.data.text) setRawText(res.data.text);
            } else {
                setErrorMsg("Could not extract data from document");
            }
        } catch (err) {
            console.error("Upload Error:", err);
            setErrorMsg(err.response?.data?.message || "Upload or OCR processing failed. Check server connection.");
        }
        setLoading(false);
    };

    const resetSelection = () => {
        setFile(null);
        setPreview("");
        setResult(null);
        setRawText("");
        setErrorMsg("");
    };

    return (
        <div className="custom-card">
            <div className="card-header-clean">
                <div>
                    <h2 className="card-title-clean">
                        <FiFileText className="text-success" style={{ fontSize: '20px' }} />
                        <span>Aadhaar Card OCR</span>
                    </h2>
                    <p className="card-subtitle mb-0">Upload or drop Government Aadhaar card image</p>
                </div>
                <span className="badge-tag badge-green">Type: Aadhaar</span>
            </div>

            <div className="p-4">
                {errorMsg && (
                    <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-center justify-content-between" style={{ borderRadius: '8px', fontSize: '13px' }}>
                        <span className="d-flex align-items-center gap-2">
                            <FiAlertTriangle /> {errorMsg}
                        </span>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setErrorMsg("")}></button>
                    </div>
                )}

                {!preview ? (
                    <div
                        className={`dropzone-container ${isDragActive ? "drag-active" : ""}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("aadhaar-file-input").click()}
                    >
                        <input
                            id="aadhaar-file-input"
                            type="file"
                            className="d-none"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files[0])}
                        />
                        <div className="upload-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                            <FiUploadCloud />
                        </div>
                        <h4 className="fw-semibold text-white mb-1" style={{ fontSize: '15px' }}>
                            Click to browse or drag & drop Aadhaar card
                        </h4>
                        <p className="text-muted mb-0" style={{ fontSize: '12px' }}>
                            Supports PNG, JPG, JPEG, WEBP (Max 10MB)
                        </p>
                    </div>
                ) : (
                    <div className="mb-3">
                        <div className="preview-box mb-3">
                            <img src={preview} alt="Aadhaar Preview" />
                            <button
                                type="button"
                                className="remove-btn"
                                onClick={resetSelection}
                                title="Remove and choose another image"
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className="d-flex align-items-center justify-content-between text-muted px-1 mb-3" style={{ fontSize: '12px' }}>
                            <span className="d-flex align-items-center gap-1">
                                <FiFile /> {file?.name}
                            </span>
                            <span>{(file?.size / 1024).toFixed(1)} KB</span>
                        </div>
                    </div>
                )}

                <button
                    className="btn-action-primary mt-2"
                    style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)' }}
                    onClick={upload}
                    disabled={loading || !file}
                >
                    {loading ? (
                        <>
                            <span className="spinner-ring"></span>
                            <span>Extracting Aadhaar Data...</span>
                        </>
                    ) : (
                        <>
                            <FiSearch style={{ fontSize: '16px' }} />
                            <span>Extract Aadhaar Details</span>
                        </>
                    )}
                </button>

                <ResultCard data={result} text={rawText} docType="Aadhaar Card" />
            </div>
        </div>
    );
}

export default UploadAadhaar;
