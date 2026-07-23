import { TbScan } from "react-icons/tb";
import { FiCpu, FiServer } from "react-icons/fi";

function Navbar() {
    return (
        <header className="app-header">
            <div className="container">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center bg-primary rounded-3 text-white shadow-sm" style={{ width: '42px', height: '42px', fontSize: '22px' }}>
                            <TbScan />
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h1 className="h5 fw-bold mb-0 text-white">DocuScan AI</h1>
                                <span className="brand-badge">PRO OCR</span>
                            </div>
                            <p className="card-subtitle mb-0 d-none d-sm-block" style={{ fontSize: '12px' }}>
                                Intelligent Driving Licence, Vehicle RC, Aadhaar & PAN Card Reader
                            </p>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <div className="badge-tag badge-green">
                            <span className="status-dot"></span>
                            <FiCpu style={{ fontSize: '13px' }} />
                            <span className="d-none d-md-inline">Tesseract v5.1 Active</span>
                            <span className="d-md-none">v5.1</span>
                        </div>
                        <div className="badge-tag badge-blue">
                            <FiServer style={{ fontSize: '13px' }} />
                            <span>API :5000</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Navbar;