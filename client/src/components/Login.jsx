import { useState, useEffect } from "react";
import { FiPhone, FiLock, FiBriefcase, FiMapPin, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import API from "../services/api";

function Login({ onLoginSuccess }) {
    const [mobileNumber, setMobileNumber] = useState("");
    const [password, setPassword] = useState("");
    const [organizationId, setOrganizationId] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Location coordinates state
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

    // Auto-fetch location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude.toString());
                    setLongitude(position.coords.longitude.toString());
                },
                (err) => {
                    console.warn("Geolocation permission denied/failed:", err.message);
                    setLatitude("20.349393");
                    setLongitude("85.8078099");
                }
            );
        } else {
            setLatitude("20.349393");
            setLongitude("85.8078099");
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!mobileNumber.trim()) {
            setErrorMsg("Mobile number is required.");
            return;
        }
        if (!password.trim()) {
            setErrorMsg("Password is required.");
            return;
        }
        if (!organizationId.trim()) {
            setErrorMsg("Company Organization ID is required.");
            return;
        }

        setLoading(true);

        try {
            const response = await API.post("/auth/login", {
                mobileNumber: mobileNumber.trim(),
                password: password,
                organizationId: organizationId.trim(),
                location: {
                    latitude: parseFloat(latitude) || 20.349393,
                    longitude: parseFloat(longitude) || 85.8078099
                }
            });

            if (response.data && response.data.success) {
                setSuccessMsg("Logged in successfully!");
                const authData = response.data.data;
                
                // Store session details in localStorage
                localStorage.setItem("tms_token", authData.accessToken || authData.token || "");
                localStorage.setItem("tms_user", JSON.stringify(authData.user || { name: "TMS User" }));
                localStorage.setItem("tms_org_id", organizationId.trim());

                // Trigger UI reload or context update
                setTimeout(() => {
                    if (onLoginSuccess) onLoginSuccess();
                }, 800);
            } else {
                setErrorMsg(response.data.message || "Authentication failed.");
            }
        } catch (err) {
            console.error("Login request failed:", err);
            const apiError = err.response?.data?.message 
                || err.response?.data?.error?.message 
                || "Failed to authenticate. Verify credentials and backend server connection.";
            setErrorMsg(apiError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-card">
                <div className="login-card-header">
                    <div className="login-logo-badge">DocuScan AI</div>
                    <h2 className="login-title">TMS Login</h2>
                    <p className="login-subtitle">Sign in to your Translogs Innovation account</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
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

                    <div className="login-field-group">
                        <label className="login-field-label">Mobile Number</label>
                        <div className="login-field-wrapper">
                            <FiPhone className="login-field-icon" />
                            <input
                                type="tel"
                                className="login-field-input"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                placeholder="Enter mobile number"
                                required
                            />
                        </div>
                    </div>

                    <div className="login-field-group">
                        <label className="login-field-label">Password</label>
                        <div className="login-field-wrapper">
                            <FiLock className="login-field-icon" />
                            <input
                                type="password"
                                className="login-field-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                    </div>

                    <div className="login-field-group">
                        <label className="login-field-label">Company Organization ID</label>
                        <div className="login-field-wrapper">
                            <FiBriefcase className="login-field-icon" />
                            <input
                                type="text"
                                className="login-field-input"
                                value={organizationId}
                                onChange={(e) => setOrganizationId(e.target.value)}
                                placeholder="Enter organization ID"
                                required
                            />
                        </div>
                    </div>

                    <div className="login-location-badge d-flex align-items-center gap-1 mb-4">
                        <FiMapPin className="text-primary" />
                        <span>GPS Location Detected: {latitude ? `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}` : "Detecting..."}</span>
                    </div>

                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner-ring-mini"></span>
                                <span>Signing you in...</span>
                            </>
                        ) : (
                            <span>Login to Portal</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
