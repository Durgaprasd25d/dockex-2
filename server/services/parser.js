const cleanField = (str) => {
    if (!str) return "";
    return str
        .replace(/Holders?\s*Signature.*$/i, '')
        .replace(/Holders?.*$/i, '')
        .replace(/Signature.*$/i, '')
        .replace(/Organ\s*Donor.*$/i, '')
        .replace(/\s*(?:PHOTO|SAMPLE|TEST|CARD).*$/i, '')
        .replace(/^[‘'"`\s\-\:]+/, '')
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
    // Registration Number matching (e.g. OD35D7229, OD05BE1209, OD05MS860, OD02AB1234)
    const regMatch = text.match(/\b([O00-9][D0A-Z]\d{2}[A-Z0-9]{4,6})\b/i)
        || text.match(/(?:Regn\s*No|Reg\s*No|Registration\s*No)[^\n]*\n+\s*([A-Z0-9]+)/i)
        || text.match(/(?:Regn\s*No|Registration\s*No)\s*:?\s*([A-Z0-9\-\s]{7,13})/i);

    // Owner Name matching
    const ownerMatch = text.match(/Owner\s*Name\s*(?:\n|[A-Z\s])*\s*:?\s*([A-Za-z ]+)/i)
        || text.match(/Owner\s*:?\s*([A-Za-z ]+)/i);

    // Father Name for RC matching
    const fatherMatch = text.match(/(?:Son\/Daughter\/Wife\s*of|Son\/Wife\/Daughter\s*of)\s*(?:\([^)]*\))?\s*:?\s*([A-Za-z ]+)/i);

    // Engine Number matching
    const engineMatch = text.match(/(?:Engine\/Motor\s*No|Engine\s*No|ENG\.\s*NO\.|Engine)\s*:?\s*([A-Z0-9\.]+)/i);

    // Chassis Number matching
    const chassisMatch = text.match(/(?:Chassis\s*No|CH\.\s*NO\.|Chassis)\s*:?\s*([A-Z0-9\.]+)/i);

    // Maker / Model matching
    const makerMatch = text.match(/(?:Maker's\s*Name|Maker|REF\.MFG)\s*:?\s*([A-Za-z0-9 ]+)/i);
    const modelMatch = text.match(/(?:Model\s*Name|Model)\s*:?\s*([A-Za-z0-9 ]+)/i);

    return {
        registration: regMatch ? cleanField(regMatch[1] || regMatch[0]) : "",
        owner: ownerMatch ? cleanField(ownerMatch[1]) : "",
        father: fatherMatch ? cleanField(fatherMatch[1]) : "",
        engine: engineMatch ? cleanField(engineMatch[1]) : "",
        chassis: chassisMatch ? cleanField(chassisMatch[1]) : "",
        maker: makerMatch ? cleanField(makerMatch[1]) : "",
        model: modelMatch ? cleanField(modelMatch[1]) : ""
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