# DocuScan AI: Intelligent ID & Document Card OCR Reader

DocuScan AI is an intelligent, high-accuracy document scanning and OCR extraction platform designed for Indian Identification cards and documents. It extracts structured text details from uploaded images of **Driving Licences (DL)**, **Vehicle Registration Certificates (RC)**, **Aadhaar Cards**, and **PAN Cards**. 

The system leverages a hybrid OCR execution model (client-side compression & OCR fallback combined with server-side extraction logic) to guarantee high accuracy, zero timeout crashes, and fast load times.

---

## 🏗️ Architecture & Detailed System Flow

DocuScan AI uses a split client-server architecture built on **React (Vite) + Node.js (Express)**.

```
[ User Uploads Image ]
          │
          ▼
[ Client-Side: compressImage.js ] (Reduces image file size for speed)
          │
          ▼
[ Client-Side: processImageOCR ] (Runs browser-level OCR as initial draft / fallback)
          │
          ▼
[ POST /api/upload ] (Sends compressed file & client-extracted text to Local Server)
          │
          ├──────────────────────────┐ (If no client text / server-side verification needed)
          ▼                          ▼
[ Server-Side Tesseract OCR ]   [ parser.js ] (Performs pattern matches & data correction)
          │                          │
          └───────────┬──────────────┘
                      ▼
        [ Structured JSON Response ]
                      │
                      ▼
      [ Client UI: ResultCard.jsx ] (Displays interactive input fields with copy buttons)
```

### Detailed Step-by-Step Flow:
1. **Selection & Drag-Drop**: The user selects or drops an image into one of the specialized scanner cards (DL, RC, Aadhaar, PAN) on the React frontend.
2. **Compression**: [`client/src/utils/compressImage.js`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/client/src/utils/compressImage.js) compresses the image file down to a manageable size to save upload bandwidth and speed up the server processing times.
3. **Browser OCR**: [`client/src/services/clientOcr.js`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/client/src/services/clientOcr.js) initiates a fast browser-side text recognition task using local WASM.
4. **API Dispatch**: The client uploads the image file (and the client-extracted text, if successful) to the local server via [`client/src/services/api.js`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/client/src/services/api.js) targeting `http://localhost:5000/api/upload`.
5. **Server Processing**: The server's [`uploadController`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/server/controllers/uploadController.js) checks the upload. If server-side OCR is needed, it calls [`ocrService`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/server/services/ocrService.js) to run a higher-accuracy node-level Tesseract scan.
6. **Parsing & Clean-up**: The text is passed to the specialized parser functions inside [`server/services/parser.js`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/server/services/parser.js) where regex rules clean up OCR artifacts, auto-correct common state prefixes, format dates, and extract structured key-value maps.
7. **Interactive Display**: The client displays the extracted properties inside [`ResultCard.jsx`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/client/src/components/ResultCard.jsx) in formatted inputs, allowing the user to inspect, modify, or copy the fields.

---

## 📂 File-by-File Codebase Directory

Here is the exact purpose of every core file in this repository:

### 🖥️ Client-Side (`/client`)

*   **[`client/src/App.jsx`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/client/src/App.jsx)**: Main entry layout of the frontend. Configures tabs ("All Scanner Tools", "Driving Licence", "Vehicle RC", "Aadhaar Card", "PAN Card") and renders active components.
*   **[`client/src/App.css`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/client/src/App.css)**: Implements custom premium glassmorphism dark theme styling and responsive layout rules.
*   **[`client/src/components/Navbar.jsx`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/client/src/components/Navbar.jsx)**: Renders the header logo and metadata bar.
*   **[`client/src/components/ResultCard.jsx`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/client/src/components/ResultCard.jsx)**: Generates the structured detail cards. Maps camelCase keys to user-friendly titles and provides copy buttons.
*   **[`client/src/components/UploadDL.jsx`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/client/src/components/UploadDL.jsx)**, **`UploadRC.jsx`**, **`UploadAadhaar.jsx`**, **`UploadPAN.jsx`**: Document-specific upload boxes. Handle drag-drop events, call client OCR, post uploads, and manage state.
*   **[`client/src/services/api.js`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/client/src/services/api.js)**: Central API base URL setup. Automatically points to the local backend `http://localhost:5000/api` when running locally.
*   **[`client/src/services/clientOcr.js`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/client/src/services/clientOcr.js)**: Client-side WASM OCR processing script.
*   **[`client/src/utils/compressImage.js`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/client/src/utils/compressImage.js)**: Uses a canvas renderer to scale down and compress uploaded images before posting.

### ⚙️ Server-Side (`/server`)

*   **[`server/server.js`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/server/server.js)**: Bootstraps the Express app, configures CORS/body-parsers, mounts routes, and defines health checks.
*   **[`server/routes/upload.js`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/server/routes/upload.js)**: Declares `/api/upload` endpoint using `multer` for memory storage image uploads.
*   **[`server/controllers/uploadController.js`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/server/controllers/uploadController.js)**: Orchestrates server OCR fallback and routes parsed text payload to matching parsing algorithms.
*   **[`server/services/ocrService.js`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/server/services/ocrService.js)**: Handles node-level `tesseract.js` image character recognition.
*   **[`server/services/parser.js`](file:///Users/mindbrain/Desktop/Durgaprasad/Codes/OCR-DL-RC/server/services/parser.js)**: The core engine of the system. Contains helper functions (`cleanField`, `cleanDate`) and specialized extraction regex matrices:
    *   **DL**: Captures DL Numbers (supports 15 & 16 chars), clean full names (strips trailing lowercase signature noise), guardian details, DOB, blood groups, and headers-based dates (Issue Date, NT validity, TR validity, Issuing Authority).
    *   **RC**: Extracts registrations (with fuzzy corrections e.g. `ODOS` -> `OD05`), owners, chassis numbers (handles spaces, caps, and strips border characters like `I`/`L` if > 17 chars), engine numbers, RTO codes, financiers, registration dates (including `MM-YYYY` formats), and registration validity (cross-matching fitness validity e.g. `As per Fitness (07-2021)`).
    *   **Aadhaar**: Extracts names, genders, DOBs, and numbers.
    *   **PAN**: Matches names, father names, DOBs, and alphanumeric PAN numbers.

---

## 🚀 Running the Project Locally

### Prerequisites
- Node.js (v18+)
- Python 3 (only for running test scripts)

### Step 1: Start the Backend Server
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   The backend will start on **`http://localhost:5000`**.

### Step 2: Start the Frontend Client
1. Open a new terminal tab and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development build:
   ```bash
   npm run dev
   ```
   The client will open in your browser at **`http://localhost:5173`**.

---

## 🧪 Testing the Parser

You can run automated tests using curl requests directly from your terminal to verify extraction accuracy.

### Run Local Terminal OCR Tests
This python test script uploads synthetic sample cards in the repository to your running local server and reports structured results:
```bash
python3 run_terminal_ocr_tests.py
```

### Run Custom Images OCR Tests
If you want to test the script against a folder of raw images (e.g. WhatsApp download directory), modify the path in `test_whatsapp_photos.py` and run:
```bash
python3 test_whatsapp_photos.py
```
