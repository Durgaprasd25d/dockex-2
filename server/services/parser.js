const cleanField = (str) => {
    if (!str) return "";
    return str
        .replace(/Holders?\s*Signature.*$/i, '')
        .replace(/Holders?.*$/i, '')
        .replace(/Signature.*$/i, '')
        .replace(/Organ\s*Donor.*$/i, '')
        .replace(/\s*(?:PHOTO|SAMPLE|TEST|CARD).*$/i, '')
        .replace(/^(?:Ee:\s*are\s*|S\s*\n*\s*\d?\s*Flite\s*Fle\s*|[‘'"`\s\-\:]+)/gi, '')
        .replace(/[\r\n]+/g, ' ')
        .trim();
};

exports.extractDL = (text) => {
    // DL Number matching (e.g., 0D11R20200000262, OD11R20190000621, OD19 20160236049, OR02K20030042677, DL-1420110012345)
    const dlMatch = text.match(/(?:ISSUED\s*BY[^\n]*\n+)\s*([0-9O][D0A-Z][0-9A-Z\s\-\+]{11,18})/i)
        || text.match(/(?:DL\s*No|Licence\s*No|Licence|No)\s*:?\s*([0-9O][D0A-Z][0-9A-Z\s\-\+]{11,18})/i)
        || text.match(/\b([0-9O][D0A-Z]\d{2}[A-Z0-9\s]{9,14})\b/i)
        || text.match(/([A-Z]{2}[-\s]?\d{2}[-\s]?\d{11})/i);

    // Name matching
    const nameMatch = text.match(/Name\s*:?\s*([A-Za-z ]+)/i)
        || text.match(/\n([A-Z\s]{4,30})\n\s*(?:Date\s*Of\s*Birth|DOB)/i);

    // Father Name matching
    const fatherMatch = text.match(/(?:Son\/Daughter\/Wife|Son|Daughter|Wife)\s*of\s*:?\s*([A-Za-z ]+)/i)
        || text.match(/(?:Father's\s*Name|Father\s*Name)\s*:?\s*([A-Za-z ]+)/i);

    // Date of Birth matching (Prioritize explicit Date Of Birth / DOB header)
    const dobMatch = text.match(/(?:Date\s*Of\s*Birth|DOB)\s*:?\s*(\d{2}[-\/\.]\d{2}[-\/\.]\d{4})/i)
        || text.match(/(\d{2}[-\/\.][01]\d[-\/\.](?:19|20)\d{2})/);

    // Blood Group matching
    const bloodMatch = text.match(/Blood\s*Group\s*:?\s*([ABO][+-]|[ABO]B[+-])/i)
        || text.match(/Blood\s*Group\s*:?\s*([A-Z]{1,2}[+-]?)/i);

    return {
        dlNumber: dlMatch ? cleanField(dlMatch[1] || dlMatch[0]) : "",
        name: nameMatch ? cleanField(nameMatch[1]) : "",
        father: fatherMatch ? cleanField(fatherMatch[1]) : "",
        dob: dobMatch ? (dobMatch[1] || dobMatch[0]) : "",
        blood: bloodMatch ? cleanField(bloodMatch[1]) : ""
    };
};

exports.extractRC = (text) => {
    // 1. Registration Number matching & auto-correction (e.g. ODO0SBE1209 -> OD05BE1209, OD35D7229, OD05BE1209, OD02AB1234)
    let rawReg = text.match(/(?:Regn\s*Number|Regn\s*No|Registration\s*No|Reg\s*No)[^\n]*\n*\|?\s*([A-Z0-9]{8,12})/i)?.[1]
        || text.match(/\b([O00-9][D0A-Z][O0S0-9A-Z]{7,10})\b/i)?.[1]
        || text.match(/([A-Z0-9]{8,11})/i)?.[0] || "";

    let registration = "";
    if (rawReg) {
        let cleaned = rawReg.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleaned.startsWith("ODO0")) cleaned = "OD05" + cleaned.slice(4);
        else if (cleaned.startsWith("ODOS")) cleaned = "OD05" + cleaned.slice(4);
        else if (cleaned.startsWith("0D")) cleaned = "OD" + cleaned.slice(2);
        else if (cleaned.startsWith("OR0")) cleaned = "OD0" + cleaned.slice(3);
        registration = cleaned;
    }

    // 2. Owner Name matching
    const ownerMatch = text.match(/Owner\s*Name[^\n]*\n+\s*([A-Za-z ]+)/i)
        || text.match(/Owner\s*Name\s*:?\s*([A-Za-z ]+)/i)
        || text.match(/Owner\s*:?\s*([A-Za-z ]+)/i);

    // 3. Father Name matching
    const fatherMatch = text.match(/(?:Son\/Daughter\/Wife\s*of|Son\/Wife\/Daughter\s*of)[^\n]*\n+(?:Fuel\s*)?([A-Za-z ]+)/i)
        || text.match(/(?:Son\/Daughter\/Wife\s*of|Son\/Wife\/Daughter\s*of)\s*(?:\([^)]*\))?\s*:?\s*([A-Za-z ]+)/i);

    // 4. Engine Number matching
    const engineMatch = text.match(/(?:Engine\/Motor\s*No|Engine\s*No|ENG\.\s*NO\.|Engine)\s*[\/\\:\s\-]*\n?\s*([A-Z0-9\.]+)/i);

    // 5. Chassis Number matching
    const chassisMatch = text.match(/(?:Chassis\s*No|CH\.\s*NO\.|Chassis)\s*[\/\\:\s\-]*\n?\s*([A-Z0-9\.]+)/i);

    // 6. Maker's Name matching & auto-cleaning
    let maker = "";
    const makerMatch = text.match(/(?:Maker's\s*Name|Maker|REF\.MFG)[^\n]*\n?\s*:?\s*([A-Za-z0-9\s]+)/i);
    const knownMaker = text.match(/(TATA\s*MOTORS\s*(?:LTD)?|ASHOK\s*LEYLAND|MAHINDRA|MARUTI\s*SUZUKI|HYUNDAI|HERO|HONDA|BAJAJ|EICHER|VOLVO|ROYAL\s*ENFIELD)/i);
    if (knownMaker) {
        maker = knownMaker[0].trim();
    } else if (makerMatch) {
        let val = cleanField(makerMatch[1]);
        maker = (val.length < 3 || /^(ih|jE|Fi|j|A)$/i.test(val)) ? "" : val;
    }

    // 7. Model Name matching & auto-cleaning
    let model = "";
    const modelLineBelow = text.match(/Model\s*Name[^\n]*\n+([^\n]+)/i);
    if (modelLineBelow) {
        model = cleanField(modelLineBelow[1]);
    } else {
        const modelMatch = text.match(/(?:Model\s*Name|Model)[^\n]*\n?\s*:?\s*([A-Za-z0-9\s\.\-]+)/i);
        if (modelMatch) {
            let val = cleanField(modelMatch[1]);
            model = (val.length < 3 || /^\d{1,3}$/.test(val)) ? "" : val;
        }
    }

    // 8. Vehicle Class matching
    const classMatch = text.match(/Vehicle\s*Class\s*:?\s*([A-Za-z0-9\s\(\)]+)/i);

    // 9. Registration Authority matching
    const authorityMatch = text.match(/(?:Registration\s*Authority|Authority)\s*[^\n]*\n+\s*([A-Za-z0-9\s]+RTO|[A-Za-z0-9\s]+R\.T\.O)/i)
        || text.match(/([A-Z\s]+RTO)/i);

    // 10. Financier matching
    const financierMatch = text.match(/Financier\s*:?\s*\n?\s*([A-Z0-9\s]+(?:LIMITED|BANK|FINANCE|LTD))/i);

    return {
        registration: registration,
        owner: ownerMatch ? cleanField(ownerMatch[1]) : "",
        father: fatherMatch ? cleanField(fatherMatch[1]) : "",
        engine: engineMatch ? cleanField(engineMatch[1]) : "",
        chassis: chassisMatch ? cleanField(chassisMatch[1]) : "",
        maker: maker,
        model: model,
        vehicleClass: classMatch ? cleanField(classMatch[1]) : "",
        authority: authorityMatch ? cleanField(authorityMatch[1]) : "",
        financier: financierMatch ? cleanField(financierMatch[1]) : ""
    };
};

exports.extractAadhaar = (text) => {
    const numMatch = text.match(/\d{4}\s\d{4}\s\d{4}/) || text.match(/\d{12}/);
    const nameMatch = text.match(/Name\s*:?\s*([A-Za-z ]+)/i);
    const dobMatch = text.match(/(?:DOB|Date of Birth)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i) || text.match(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/);
    const genderMatch = text.match(/(Male|Female|Transgender)/i);

    return {
        aadhaarNumber: numMatch ? numMatch[0] : "",
        name: nameMatch ? cleanField(nameMatch[1]) : "",
        dob: dobMatch ? (dobMatch[1] || dobMatch[0]) : "",
        gender: genderMatch ? genderMatch[0] : ""
    };
};

exports.extractPAN = (text) => {
    const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
    const nameMatch = text.match(/Name\s*:?\s*([A-Za-z ]+)/i);
    const fatherMatch = text.match(/(?:Father's Name|Father Name)\s*:?\s*([A-Za-z ]+)/i);
    const dobMatch = text.match(/(?:Date of Birth|DOB)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i) || text.match(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/);

    return {
        panNumber: panMatch ? panMatch[0] : "",
        name: nameMatch ? cleanField(nameMatch[1]) : "",
        father: fatherMatch ? cleanField(fatherMatch[1]) : "",
        dob: dobMatch ? (dobMatch[1] || dobMatch[0]) : ""
    };
};

exports.extractGeneric = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const documentTitle = lines.length > 0 ? lines[0] : "Document";

    // Extract all dates
    const dates = text.match(/\b\d{2}[-\/\.]\d{2}[-\/\.]\d{4}\b/g) || [];

    // Extract reference numbers (alphanumeric codes)
    const numbers = text.match(/\b[A-Z0-9]{6,20}\b/g) || [];

    // Extract potential names
    const potentialNames = text.match(/(?:Name|Owner|Holder|Customer|User|To)\s*:?\s*([A-Za-z ]+)/i);

    return {
        documentTitle: cleanField(documentTitle),
        extractedName: potentialNames ? cleanField(potentialNames[1]) : "",
        detectedDates: dates.slice(0, 3).join(", "),
        referenceNumbers: numbers.slice(0, 5).join(", "),
        linesProcessed: lines.length
    };
};