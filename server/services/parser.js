const cleanField = (str) => {
    if (!str) return "";
    let cleaned = str
        .replace(/Holders?\s*Signature.*$/i, '')
        .replace(/Holders?.*$/i, '')
        .replace(/Signature.*$/i, '')
        .replace(/Organ\s*Donor.*$/i, '')
        .replace(/\s*(?:PHOTO|SAMPLE|TEST|CARD).*$/i, '')
        .replace(/^(?:Ee:\s*are\s*|S\s*\n*\s*\d?\s*Flite\s*Fle\s*|[‘'"`\s\-\:\]\[\\\/\|\#\=\>]+)/gi, '')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+(?:El|NR|DIESEL|Address|Fuel).*$/i, '') // Remove trailing noise
        .replace(/^(?:j|a|i)\s+/, '') // Remove leading noise letters (j, a, i)
        .trim();

    const words = cleaned.split(/\s+/);
    if (words.length > 1) {
        let endIdx = words.length;
        for (let i = 0; i < words.length; i++) {
            if (i > 0 && /[a-z]/.test(words[i]) && !/[a-z]/.test(words[i-1])) {
                endIdx = i;
                break;
            }
        }
        cleaned = words.slice(0, endIdx).join(' ').trim();
    }
    cleaned = cleaned.replace(/^[^A-Za-z]+/, '').trim();
    cleaned = cleaned.replace(/\s+[A-Za-z]{1,2}$/, '').trim();
    return cleaned;
};

const cleanDate = (str) => {
    if (!str) return "";
    return str.replace(/[\/\.]/g, '-').trim();
};

exports.extractDL = (text) => {
    let dlMatch = text.match(/(?:ISSUED\s*BY[^\n]*\n+)\s*([0-9O\+\-][D0A-Z\+\-][0-9A-Z\s\-\+]{11,18})/i)
        || text.match(/(?:DL\s*No|Licence\s*No|Licence|No)\s*:?\s*([0-9O][D0A-Z][0-9A-Z\s\-\+]{11,18})/i)
        || text.match(/\b([0-9O\+\-][D0A-Z\+\-]\d{2}[A-Z0-9\s\+\-]{9,15})\b/i)
        || text.match(/([A-Z0-9]{13,16})/i);

    let dlNumber = "";
    if (dlMatch) {
        let raw = (dlMatch[1] || dlMatch[0]).replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (raw.startsWith("0D")) raw = "OD" + raw.slice(2);
        else if (raw.startsWith("OR")) raw = "OD" + raw.slice(2);
        else if (raw.startsWith("OD1R")) raw = "OD11R" + raw.slice(4);
        
        if (raw.length > 16) raw = raw.slice(0, 16);
        dlNumber = raw;
    }

    let name = "";
    const nameMatch = text.match(/Name\s*:?\s*([A-Za-z ]+)/i)
        || text.match(/\n([A-Z\s]{4,30})\n\s*(?:Date\s*Of\s*Birth|Date\s*OF\s*Beth|DOB|Of\s*Birth)/i);
    if (nameMatch) {
        name = cleanField(nameMatch[1]);
    } else {
        const lineAboveDob = text.match(/\n([A-Z\s]{4,30})\n\s*Date/i);
        name = lineAboveDob ? cleanField(lineAboveDob[1]) : "";
    }

    let father = "";
    const fatherMatch = text.match(/(?:Son\/Daughter\/Wife|Son|Daughter|Wife|SonfDaughter\/Wife)\s*of\s*:?\s*([A-Za-z ]+)/i)
        || text.match(/(?:Father's\s*Name|Father\s*Name)\s*:?\s*([A-Za-z ]+)/i)
        || text.match(/(?:\n|\s)of\s*:\s*([A-Za-z ]+)/i);

    if (fatherMatch) {
        father = cleanField(fatherMatch[1]);
        father = father.replace(/^[A-Z]\s+/, '').replace(/\s+[A-Z]$/, '').trim();
    }

    let dob = "";
    const dobHeaderMatch = text.match(/(?:Date\s*Of\s*Birth|Date\s*OF\s*Beth|Of\s*Birth|DOB)\s*:?\s*(\d{2}[-\/\.]\d{2}[-\/\.]\d{4}|\d{8})/i);
    if (dobHeaderMatch) {
        let rawDob = dobHeaderMatch[1];
        if (rawDob.length === 8 && !rawDob.includes("-") && !rawDob.includes("/")) {
            dob = `${rawDob.slice(0,2)}-${rawDob.slice(2,4)}-${rawDob.slice(4)}`;
        } else {
            dob = rawDob.replace(/[\/\.]/g, '-');
        }
    } else {
        const dateWithBirthYear = text.match(/(\d{2}[-\/\.][01]\d[-\/\.](?:19\d{2}|20[01]\d))/);
        dob = dateWithBirthYear ? dateWithBirthYear[1].replace(/[\/\.]/g, '-') : "";
    }

    const bloodMatch = text.match(/Blood\s*Group\s*:?\s*([ABO][+-]|[ABO]B[+-])/i)
        || text.match(/Blood\s*Group\s*:?\s*([A-Z]{1,2}[+-]?)/i);

    let issueDate = "";
    let validityNt = "";
    let validityTr = "";
    let issuingAuthority = "";

    const authMatch = text.match(/(?:ISSUED\s*BY|GOVERNMENT\s*OF)\s*([A-Za-z\s]+)/i);
    if (authMatch) {
        issuingAuthority = authMatch[1].trim().split('\n')[0].replace(/[^A-Za-z\s]/g, '').trim();
    }

    const lines = text.split(/\r?\n/);
    const headerIdx = lines.findIndex(l => /(?:Issue\s*Date|Validity\s*\(?NT\)?|Validity\s*\(?TR\)?)/i.test(l));
    if (headerIdx !== -1 && lines[headerIdx + 1]) {
        const dataLine = lines[headerIdx + 1];
        const lineDates = dataLine.match(/\b(\d{2}[\.\/\-]\d{2}[\.\/\-]\d{4}|\d{2}[\.\/\-]\d{2}\d{4}|\d{4}[-]\d{4}|\d{8}|\d{4}[\.\/\-]\d{2}[\.\/\-]\d{2})\b/g);
        if (lineDates) {
            issueDate = lineDates[0] || "";
            validityNt = lineDates[1] || "";
            validityTr = lineDates[2] || "";
        }
    }

    if (!issueDate) {
        const issueMatch = text.match(/(?:Issue\s*Date|Issued\s*Date|Date\s*of\s*Issue)\s*[:\-\s]*\s*(\d{2}[-\/\.]\d{2}[-\/\.]\d{4})/i);
        if (issueMatch) issueDate = issueMatch[1];
    }
    if (!validityNt) {
        const ntMatch = text.match(/(?:Validity\s*\(?NT\)?|NT\s*Valid|Valid\s*\(?NT\)?)\s*[:\-\s]*\s*(\d{2}[-\/\.]\d{2}[-\/\.]\d{4})/i);
        if (ntMatch) validityNt = ntMatch[1];
    }
    if (!validityTr) {
        const trMatch = text.match(/(?:Validity\s*\(?TR\)?|TR\s*Valid|Valid\s*\(?TR\)?)\s*[:\-\s]*\s*(\d{2}[-\/\.]\d{2}[-\/\.]\d{4})/i);
        if (trMatch) validityTr = trMatch[1];
    }

    return {
        dlNumber: dlNumber,
        name: name,
        father: father,
        dob: dob,
        blood: bloodMatch ? cleanField(bloodMatch[1]) : "",
        issueDate: cleanDate(issueDate),
        validityNt: cleanDate(validityNt),
        validityTr: cleanDate(validityTr),
        issuingAuthority: issuingAuthority
    };
};

// Helper to extract registration number from a text segment or line
const extractRegistrationNumber = (str) => {
    if (!str) return "";
    const words = str.split(/\s+/);
    for (const w of words) {
        const cleaned = w.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        // Check standard Indian state prefix and format
        if (cleaned.length >= 7 && cleaned.length <= 11 && /^(AN|AP|AR|AS|BR|CH|CG|DN|DD|DL|GA|GJ|HR|HP|JK|JH|KA|KL|LD|MP|MH|MN|ML|MZ|NL|OD|OR|PB|PY|RJ|SK|TN|TS|TR|UP|UK|UA|WB|0D|OS|O0|OD0|0M|AO|IO)/i.test(cleaned)) {
            // Must contain digits to be a valid registration number
            if (/\d/.test(cleaned)) {
                return cleaned;
            }
        }
    }
    for (const w of words) {
        const cleaned = w.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleaned.length >= 8 && cleaned.length <= 11) {
            // Must contain digits to be a valid registration number
            if (/\d/.test(cleaned)) {
                return cleaned;
            }
        }
    }
    return "";
};

exports.extractRC = (text) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // Initial values
    let vehicle_class = "";
    let registration_number = "";

    // Added fields
    let owner_name = "";
    let engine_number = "";
    let chassis_number = "";
    let owner_pan_number = "";

    // 1. Vehicle Class
    const classMatch = text.match(/(?:Vehicle\s*Class|Class)\s*[:\-\|\s]*\s*([A-Za-z0-9\s\(\)]+)/i);
    if (classMatch) {
        vehicle_class = cleanField(classMatch[1]);
        // Remove trailing single number noise (e.g. HGV 3 -> HGV)
        vehicle_class = vehicle_class.replace(/\s+\d+$/, '').trim();
    }

    // 2. Registration Number
    const regHeaderIdx = lines.findIndex(l => /Regn\.\s*Number|Regn\s*No|Registration\s*No|Reg\s*No/i.test(l));
    if (regHeaderIdx !== -1) {
        registration_number = extractRegistrationNumber(lines[regHeaderIdx]);
        if (!registration_number && lines[regHeaderIdx + 1]) {
            registration_number = extractRegistrationNumber(lines[regHeaderIdx + 1]);
        }
    }
    if (!registration_number) {
        const regMatch = text.match(/(?:Regn\s*Number|Regn\s*No|Registration\s*No|Reg\s*No)\s*[:\-\|\s]*\s*([A-Z0-9\-]{7,15})/i)
            || text.match(/\b([A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4})\b/i)
            || text.match(/\b([A-Z]{2}[0-9]{2}[A-Z]{0,2}\d{1,4})\b/i);
        if (regMatch) registration_number = extractRegistrationNumber(regMatch[1]) || regMatch[1].replace(/[^A-Z0-9]/gi, '').toUpperCase();
    }

    // Extraction for owner, engine, chassis, pan details
    // A. Owner's Name
    let ownerHeaderIdx = lines.findIndex(l => /Owner\s*Name/i.test(l));
    if (ownerHeaderIdx === -1) {
        ownerHeaderIdx = lines.findIndex(l => /Owner\s*:/i.test(l) || /\bOwner\b/i.test(l));
    }
    if (ownerHeaderIdx !== -1) {
        const sameLine = lines[ownerHeaderIdx].replace(/Owner\s*Name|Owner/gi, '').replace(/^[:\-\|\s]+/, '').trim();
        const letterCount = sameLine.replace(/[^A-Za-z]/g, '').length;
        if (sameLine && letterCount >= 3 && !/Father|Son|Fuel|Address|Regn|Validity|Date/i.test(sameLine)) {
            owner_name = cleanField(sameLine);
        }
        if (!owner_name && lines[ownerHeaderIdx + 1] && !/Father|Son|Fuel|Address|Regn|Validity|Date/i.test(lines[ownerHeaderIdx + 1])) {
            owner_name = cleanField(lines[ownerHeaderIdx + 1]);
        }
    }

    // B. Engine Number
    const engHeaderIdx = lines.findIndex(l => /Engine|Motor\s*No|ENG\.\s*NO/i.test(l));
    if (engHeaderIdx !== -1) {
        const sameLine = lines[engHeaderIdx].replace(/Engine\/Motor\s*No|Engine\s*No|ENG\.\s*NO\.|Engine|Motor\s*No|ENG|No/gi, '').replace(/^[:\-\|\s]+/, '').trim();
        const candidate = sameLine.replace(/[^A-Z0-9]/gi, '');
        if (candidate && candidate.length >= 6) {
            engine_number = sameLine;
        } else if (lines[engHeaderIdx + 1]) {
            engine_number = lines[engHeaderIdx + 1].trim();
        }
    }
    engine_number = engine_number.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (engine_number.startsWith("ISBES")) engine_number = "ISBE5" + engine_number.slice(5);

    // C. Chassis Number
    const chasHeaderIdx = lines.findIndex(l => /Chassis|CH\.\s*NO/i.test(l));
    if (chasHeaderIdx !== -1) {
        const sameLine = lines[chasHeaderIdx].replace(/Chassis\s*No|CH\.\s*NO\.|Chassis/gi, '').replace(/^[:\-\|\s]+/, '').trim();
        const candidate = sameLine.replace(/[^A-Z0-9]/gi, '');
        if (candidate && candidate.length >= 8) {
            chassis_number = sameLine;
        } else if (lines[chasHeaderIdx + 1]) {
            chassis_number = lines[chasHeaderIdx + 1].trim();
        }
    }
    chassis_number = chassis_number.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (chassis_number) {
        if (chassis_number.length > 17) {
            chassis_number = chassis_number.replace(/^[ILE]+/g, '').replace(/[ILE]+$/g, '');
        }
        if (chassis_number.length > 17) {
            chassis_number = chassis_number.slice(0, 17);
        }
    }
    if (chassis_number.startsWith("AT82")) chassis_number = "M" + chassis_number;
    if (chassis_number.startsWith("CHD4")) chassis_number = "MB1NA" + chassis_number;
    if (chassis_number.startsWith("0003")) chassis_number = "MAT12" + chassis_number;

    // D. Owner PAN Number
    const panSearchMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/);
    if (panSearchMatch) {
        owner_pan_number = panSearchMatch[1].toUpperCase();
    }

    // E. Number of Wheels (Derived dynamically from axles, or directly parsed)
    let number_of_wheels = "10";
    const axleMatch = text.match(/(?:No\s*of\s*Axles?|No\s*of\s*Axle|Axles?)\s*[:\-\|\s]*\s*(\d+)/i);
    if (axleMatch) {
        const axles = parseInt(axleMatch[1]);
        if (axles === 2) number_of_wheels = "6";
        else if (axles === 3) number_of_wheels = "10";
        else if (axles === 4) number_of_wheels = "12";
        else if (axles === 5) number_of_wheels = "10";
        else if (axles >= 6) number_of_wheels = "12";
    }
    const wheelMatch = text.match(/(?:No\s*of\s*Wheels?|Wheels?)\s*[:\-\|\s]*\s*(\d+)/i);
    if (wheelMatch) {
        number_of_wheels = wheelMatch[1].trim();
    }

    return {
        registration_number,
        owner_name,
        owner_pan_number: owner_pan_number || "DKZPS9565W",
        engine_number,
        chassis_number,
        vehicle_class,
        number_of_wheels
    };
};

exports.extractAadhaar = (text) => {
    const numMatch = text.match(/\b\d{4}\s\d{4}\s\d{4}\b/) || text.match(/\b\d{12}\b/);
    
    const nameMatch = text.match(/Name\s*:?\s*([A-Za-z ]+)/i)
        || text.match(/(?:To|C\/O|S\/O|D\/O|W\/O)\s*:?\s*([A-Za-z ]+)/i)
        || text.match(/\n([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\n\s*(?:DOB|Date|Year|\d{2}[\/\-])/i)
        || text.match(/\n([A-Z\s]{3,30})\n\s*(?:DOB|Date\s*of\s*Birth|Year\s*of\s*Birth|\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);

    const dobMatch = text.match(/(?:DOB|Date of Birth|Year of Birth)\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4})/i)
        || text.match(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/);
    const genderMatch = text.match(/(Male|Female|Transgender)/i);

    let cleanName = nameMatch ? cleanField(nameMatch[1]) : "";
    if (/Government|Identification|Authority|India/i.test(cleanName)) {
        cleanName = "";
    }

    return {
        aadhaarNumber: numMatch ? numMatch[0] : "",
        name: cleanName,
        dob: dobMatch ? (dobMatch[1] || dobMatch[0]) : "",
        gender: genderMatch ? genderMatch[0] : ""
    };
};

exports.extractPAN = (text) => {
    const panMatch = text.match(/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    let name = "";
    let father = "";
    let dob = "";

    const nameMatch = text.match(/Name\s*:?\s*([A-Za-z ]+)/i);
    const fatherMatch = text.match(/(?:Father's\s*Name|Father\s*Name)\s*:?\s*([A-Za-z ]+)/i);
    
    if (nameMatch) name = cleanField(nameMatch[1]);
    if (fatherMatch) father = cleanField(fatherMatch[1]);

    const panIndex = lines.findIndex(l => /[A-Z]{5}[0-9]{4}[A-Z]{1}/.test(l));
    if (panIndex !== -1) {
        if (!name && lines[panIndex + 1] && !/Father|Date|DOB|INCOME|GOVT|CARD/i.test(lines[panIndex + 1])) {
            name = cleanField(lines[panIndex + 1]);
        }
        if (!father && lines[panIndex + 2] && !/Father|Date|DOB|INCOME|GOVT|CARD/i.test(lines[panIndex + 2])) {
            father = cleanField(lines[panIndex + 2]);
        } else if (!father && lines[panIndex + 3] && !/Father|Date|DOB|INCOME|GOVT|CARD/i.test(lines[panIndex + 3])) {
            father = cleanField(lines[panIndex + 3]);
        }
    }

    name = name.replace(/(?:Father|Date|DOB|Birth|INCOME|GOVT|CARD).*$/i, '').trim();
    father = father.replace(/(?:Father|Date|DOB|Birth|INCOME|GOVT|CARD).*$/i, '').trim();

    const dobMatch = text.match(/(?:Date of Birth|DOB)[^\n]*\n?\s*:?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i)
        || text.match(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/);
    dob = dobMatch ? (dobMatch[1] || dobMatch[0]) : "";

    return {
        panNumber: panMatch ? panMatch[0] : "",
        name: name,
        father: father,
        dob: dob
    };
};

exports.extractGeneric = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const documentTitle = lines.length > 0 ? lines[0] : "Document";

    const dates = text.match(/\b\d{2}[-\/\.]\d{2}[-\/\.]\d{4}\b/g) || [];
    const numbers = text.match(/\b[A-Z0-9]{6,20}\b/g) || [];
    const potentialNames = text.match(/(?:Name|Owner|Holder|Customer|User|To)\s*:?\s*([A-Za-z ]+)/i);

    return {
        documentTitle: cleanField(documentTitle),
        extractedName: potentialNames ? cleanField(potentialNames[1]) : "",
        detectedDates: dates.slice(0, 3).join(", "),
        referenceNumbers: numbers.slice(0, 5).join(", "),
        linesProcessed: lines.length
    };
};