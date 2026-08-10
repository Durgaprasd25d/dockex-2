import { useState, useEffect } from "react";
import { FiPhone, FiLock, FiBriefcase, FiMapPin, FiAlertTriangle, FiCheckCircle, FiCalendar } from "react-icons/fi";
import axios from "axios";

function Login({ onLoginSuccess }) {
    const [mobileNumber, setMobileNumber] = useState("9658947277"); // Prefilled from screenshot
    const [password, setPassword] = useState("Garg@1234"); // Prefilled from screenshot
    const [organizationId, setOrganizationId] = useState("6895b6269bb6e4001c31dfc4"); // Prefilled Garg Logistics
    const [financialYear, setFinancialYear] = useState("2026-2027");
    const [organizations, setOrganizations] = useState([
        {
            _id: "6895b6269bb6e4001c31dfc4",
            name: "GARG LOGISTICS (A UNIT OF GARG BEVERAGES PVT. LTD.)"
        },
        {
            _id: "68778009daf263001cf8167f",
            name: "TransLogsInnovation Pvt. Ltd."
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Location coordinates state
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

    // Auto-fetch location and organizations on mount
    useEffect(() => {
        // Geolocation
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

        // Fetch organizations list from public endpoint
        const fetchOrganizations = async () => {
            try {
                const response = await axios.get("https://tms.traanslogsinnovation.com/api/organization");
                if (response.data && response.data.data) {
                    setOrganizations(response.data.data);
                    // Match organization ID from list or default to Garg Logistics ID
                    const match = response.data.data.find(org => org.name.toLowerCase().includes("garg"));
                    if (match) {
                        setOrganizationId(match._id);
                    }
                }
            } catch (err) {
                console.warn("Failed to fetch organizations list from TMS, using fallback defaults:", err.message);
            }
        };

        fetchOrganizations();
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
            setErrorMsg("Please select your company name.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post("https://tms.traanslogsinnovation.com/authentication", {
                mobileNumber: mobileNumber.trim(),
                password: password,
                strategy: "local",
                organizationId: organizationId.trim(),
                location: {
                    latitude: parseFloat(latitude) || 20.349393,
                    longitude: parseFloat(longitude) || 85.8078099
                }
            }, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json, text/plain, */*"
                }
            });

            if (response.data && response.data.accessToken) {
                setSuccessMsg("Logged in successfully!");
                const authData = response.data;
                
                // Store session details in localStorage
                localStorage.setItem("tms_token", authData.accessToken || "");
                localStorage.setItem("tms_user", JSON.stringify(authData.user || { name: "TMS User" }));
                localStorage.setItem("tms_org_id", organizationId.trim());
                localStorage.setItem("tms_fin_year", financialYear);

                // Trigger UI reload or context update
                setTimeout(() => {
                    if (onLoginSuccess) onLoginSuccess();
                }, 800);
            } else {
                setErrorMsg("Authentication failed: No access token received.");
            }
        } catch (err) {
            console.error("Login request failed:", err);
            const apiError = err.response?.data?.message 
                || err.response?.data?.error?.message 
                || "Failed to authenticate. Please verify credentials.";
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
                        <label className="login-field-label">Company Name</label>
                        <div className="login-field-wrapper">
                            <FiBriefcase className="login-field-icon" />
                            <select
                                className="login-field-input"
                                style={{ paddingRight: "28px", appearance: "auto" }}
                                value={organizationId}
                                onChange={(e) => setOrganizationId(e.target.value)}
                                required
                            >
                                <option value="">Select Company Name</option>
                                {organizations.map((org) => (
                                    <option key={org._id} value={org._id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="login-field-group">
                        <label className="login-field-label">Financial Year</label>
                        <div className="login-field-wrapper">
                            <FiCalendar className="login-field-icon" />
                            <select
                                className="login-field-input"
                                style={{ appearance: "auto" }}
                                value={financialYear}
                                onChange={(e) => setFinancialYear(e.target.value)}
                                required
                            >
                                <option value="2026-2027">2026-2027</option>
                                <option value="2025-2026">2025-2026</option>
                                <option value="2024-2025">2024-2025</option>
                            </select>
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

                    <div className="login-location-badge d-flex align-items-center gap-1 mb-4">
                        <FiMapPin className="text-primary" />
                        <span>GPS Location: {latitude ? `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}` : "Detecting..."}</span>
                    </div>

                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner-ring-mini"></span>
                                <span>Signing you in...</span>
                            </>
                        ) : (
                            <span>Login</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
