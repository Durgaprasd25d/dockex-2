import { useState } from "react";
import { FiGrid, FiUserCheck, FiTruck, FiFileText, FiCreditCard } from "react-icons/fi";
import Navbar from "./components/Navbar";
import UploadDL from "./components/UploadDL";
import UploadRC from "./components/UploadRC";
import UploadAadhaar from "./components/UploadAadhaar";
import UploadPAN from "./components/UploadPAN";

function App() {
    const [activeTab, setActiveTab] = useState("all");

    return (
        <div className="min-vh-100 pb-5">
            <Navbar />

            <div className="container mt-4">
                {/* Document Type Selector Bar */}
                <div className="doc-type-pills">
                    <button
                        type="button"
                        className={`doc-pill ${activeTab === "all" ? "active" : ""}`}
                        onClick={() => setActiveTab("all")}
                    >
                        <FiGrid style={{ fontSize: '15px' }} />
                        <span>All Scanner Tools</span>
                    </button>
                    <button
                        type="button"
                        className={`doc-pill ${activeTab === "DL" ? "active" : ""}`}
                        onClick={() => setActiveTab("DL")}
                    >
                        <FiUserCheck style={{ fontSize: '15px' }} />
                        <span>Driving Licence</span>
                    </button>
                    <button
                        type="button"
                        className={`doc-pill ${activeTab === "RC" ? "active" : ""}`}
                        onClick={() => setActiveTab("RC")}
                    >
                        <FiTruck style={{ fontSize: '15px' }} />
                        <span>Vehicle RC</span>
                    </button>
                    <button
                        type="button"
                        className={`doc-pill ${activeTab === "AADHAAR" ? "active" : ""}`}
                        onClick={() => setActiveTab("AADHAAR")}
                    >
                        <FiFileText style={{ fontSize: '15px' }} />
                        <span>Aadhaar Card</span>
                    </button>
                    <button
                        type="button"
                        className={`doc-pill ${activeTab === "PAN" ? "active" : ""}`}
                        onClick={() => setActiveTab("PAN")}
                    >
                        <FiCreditCard style={{ fontSize: '15px' }} />
                        <span>PAN Card</span>
                    </button>
                </div>

                {/* Content View */}
                {activeTab === "all" && (
                    <div className="row g-4">
                        <div className="col-12 col-lg-6">
                            <UploadDL />
                        </div>
                        <div className="col-12 col-lg-6">
                            <UploadRC />
                        </div>
                        <div className="col-12 col-lg-6">
                            <UploadAadhaar />
                        </div>
                        <div className="col-12 col-lg-6">
                            <UploadPAN />
                        </div>
                    </div>
                )}

                {activeTab === "DL" && (
                    <div className="row justify-content-center">
                        <div className="col-12 col-lg-8">
                            <UploadDL />
                        </div>
                    </div>
                )}

                {activeTab === "RC" && (
                    <div className="row justify-content-center">
                        <div className="col-12 col-lg-8">
                            <UploadRC />
                        </div>
                    </div>
                )}

                {activeTab === "AADHAAR" && (
                    <div className="row justify-content-center">
                        <div className="col-12 col-lg-8">
                            <UploadAadhaar />
                        </div>
                    </div>
                )}

                {activeTab === "PAN" && (
                    <div className="row justify-content-center">
                        <div className="col-12 col-lg-8">
                            <UploadPAN />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;