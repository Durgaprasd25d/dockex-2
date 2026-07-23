const cleanField = (str) => {
    if (!str) return "";
    return str.replace(/\s*(?:PHOTO|SAMPLE|TEST|CARD).*$/i, '').trim();
};

exports.extractDL = (text) => {
    const dlMatch = text.match(/DL\s*No\s*:?\s*([A-Z0-9\s\-]{10,20})/i) || text.match(/Licence\s*No\s*:?\s*([A-Z0-9\s\-]{10,20})/i);
    const nameMatch = text.match(/Name\s*:?\s*([A-Za-z ]+)/i);
    const fatherMatch = text.match(/(?:Son|Daughter|Wife)\s*of\s*:?\s*([A-Za-z ]+)/i);
    const dobMatch = text.match(/(?:DOB|Date of Birth)\s*:?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i) || text.match(/\d{2}[-\/]\d{2}[-\/]\d{4}/);
    const bloodMatch = text.match(/Blood Group\s*:?\s*([A-Z][+-]?)/i);

    return {
        dlNumber: dlMatch ? cleanField(dlMatch[1]) : (text.match(/([A-Z]{2}\d{2}\s?\d{11})/)?.[0] || ""),
        name: nameMatch ? cleanField(nameMatch[1]) : "",
        father: fatherMatch ? cleanField(fatherMatch[1]) : "",
        dob: dobMatch ? (dobMatch[1] || dobMatch[0]) : "",
        blood: bloodMatch ? cleanField(bloodMatch[1]) : ""
    };
};

exports.extractRC = (text) => {
    const regMatch = text.match(/(?:Reg\s*No|Registration\s*No|Regn\s*No)\s*:?\s*([A-Z0-9\- ]{8,12})/i);
    const ownerMatch = text.match(/Owner\s*Name\s*:?\s*([A-Za-z ]+)/i);
    const engineMatch = text.match(/Engine\s*(?:No)?\s*:?\s*([A-Z0-9]+)/i);
    const chassisMatch = text.match(/Chassis\s*(?:No)?\s*:?\s*([A-Z0-9]+)/i);

    return {
        registration: regMatch ? regMatch[1].trim() : (text.match(/([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})/)?.[0] || text.match(/OD[A-Z0-9]{8}/)?.[0] || ""),
        owner: ownerMatch ? cleanField(ownerMatch[1]) : "",
        engine: engineMatch ? cleanField(engineMatch[1]) : "",
        chassis: chassisMatch ? cleanField(chassisMatch[1]) : ""
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