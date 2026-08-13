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
            return cleaned;
        }
    }
    for (const w of words) {
        const cleaned = w.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleaned.length >= 8 && cleaned.length <= 11) {
            return cleaned;
        }
    }
    return "";
};

exports.extractRC = (text) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // Initial values
    let vehicle_class = "";
    let registration_number = "";
    let maker_name = "";
    let model_name = "";
    let colour = "";
    let body_type = "";
    
    let seating = "";
    let standing = "";
    let sleeper = "";

    let unladen_kg = "";
    let laden_kg = "";
    let gross_combination_weight_kg = "";

    let cubic_capacity = "";
    let horse_power = "";
    let wheel_base_mm = "";

    let financier = "";
    let month_year_of_manufacture = "";
    let number_of_cylinders = "";
    let number_of_axles = "";
    let registration_authority = "";

    // 1. Vehicle Class
    const classMatch = text.match(/(?:Vehicle\s*Class|Class)\s*[:\-\|\s]*\s*([A-Za-z0-9\s\(\)]+)/i);
    if (classMatch) {
        vehicle_class = cleanField(classMatch[1]);
        // Remove trailing single number noise (e.g. HGV 3 -> HGV)
        vehicle_class = vehicle_class.replace(/\s+\d+$/, '').trim();
    }

    // 2. Registration Number
    const regHeaderIdx = lines.findIndex(l => /Regn\.\s*Number|Regn\s*No|Registration\s*No|Reg\s*No/i.test(l));
    if (regHeaderIdx !== -1 && lines[regHeaderIdx + 1]) {
        registration_number = extractRegistrationNumber(lines[regHeaderIdx + 1]);
    }
    if (!registration_number) {
        const regMatch = text.match(/(?:Regn\s*Number|Regn\s*No|Registration\s*No|Reg\s*No)\s*[:\-\|\s]*\s*([A-Z0-9\-]{7,15})/i)
            || text.match(/\b([A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4})\b/i)
            || text.match(/\b([A-Z]{2}[0-9]{2}[A-Z]{0,2}\d{1,4})\b/i);
        if (regMatch) registration_number = extractRegistrationNumber(regMatch[1]) || regMatch[1].replace(/[^A-Z0-9]/gi, '').toUpperCase();
    }

    // 3. Maker's Name
    const makerHeaderIdx = lines.findIndex(l => /Maker/i.test(l));
    if (makerHeaderIdx !== -1 && lines[makerHeaderIdx + 1]) {
        let val = lines[makerHeaderIdx + 1];
        if (registration_number) {
            val = val.replace(new RegExp(registration_number, "gi"), "");
        }
        maker_name = val.replace(/^[^\w\s]+/, '').replace(/[^\w\s]+$/, '').trim();
        maker_name = maker_name.replace(/\s+[a-zA-Z]$/, '').trim(); // Strip trailing single-character noise
    } else {
        const makerMatch = text.match(/(?:Maker's\s*Name|Maker|REF\.MFG)\s*[:\-\|\s]*\s*([A-Za-z0-9\s]+)/i);
        if (makerMatch) maker_name = cleanField(makerMatch[1]);
    }

    // 4. Model Name
    const modelHeaderIdx = lines.findIndex(l => /Mod[eo]l/i.test(l));
    if (modelHeaderIdx !== -1 && lines[modelHeaderIdx + 1]) {
        let val = lines[modelHeaderIdx + 1];
        // Strip common prefix QR noise (e.g. Oza PI [5])
        val = val.replace(/^[a-z0-9\s\]\[\=\#\/\(\)\+]{1,15}(?=TATA|ASHOK|LEYLAND|MAHINDRA|EICHER|MARUTI)/i, '');
        model_name = val.replace(/^[^\w\s]+/, '').replace(/[^\w\s]+$/, '').trim();
        model_name = model_name.replace(/\s+[a-zA-Z]$/, '').trim(); // Strip trailing single-character noise
    } else {
        const modelMatch = text.match(/(?:Model\s*Name|Model)\s*[:\-\|\s]*\s*([A-Za-z0-9\s\.\-]+)/i);
        if (modelMatch) model_name = cleanField(modelMatch[1]);
    }

    // 5 & 6. Colour & Body Type split row matching
    const colorHeaderIdx = lines.findIndex(l => /Col/i.test(l) && /Body\s*Type/i.test(l));
    if (colorHeaderIdx !== -1 && lines[colorHeaderIdx + 1]) {
        const parts = lines[colorHeaderIdx + 1].split(/\s*[\/\\]\s*/);
        if (parts[0]) {
            let val = parts[0];
            const colorMatch = val.match(/(MAROON|ORANGE|BLUE|RED|WHITE|BLACK|YELLOW|GREEN|GREY|BROWN|SILVER|GOLD|PINK|PURPLE|MULTICOLOUR|AMBER)/i);
            if (colorMatch) {
                colour = val.substring(val.toLowerCase().indexOf(colorMatch[0].toLowerCase())).trim();
            } else {
                colour = val.replace(/^[a-z0-9\s\:\-\/\#\=\[\]\”\“\']+(?=[A-Z]{3,})/gi, '').trim();
            }
        }
        if (parts[1]) {
            let val = parts[1];
            const bodyMatch = val.match(/(TRUCK|OPEN|TRACTOR|BUS|CAR|TROLLEY|TANKER|CONTAINER|TIPPER|CAB|CHASSIS)/i);
            if (bodyMatch) {
                body_type = val.substring(val.toLowerCase().indexOf(bodyMatch[0].toLowerCase())).trim();
            } else {
                body_type = val.replace(/^[a-z0-9\s\:\-\/\#\=\[\]\”\“\']+(?=[A-Z]{3,})/gi, '').trim();
            }
            body_type = body_type.replace(/\s+[a-zA-Z]$/, '').trim();
        }
    } else {
        const colorMatch = text.match(/(?:Colo[ur]+|Color)\s*[:\-\|\s]*\s*([A-Za-z\s]+)(?=(?:\/|Body\s*Type|$))/i);
        if (colorMatch) colour = cleanField(colorMatch[1]);

        const bodyMatch = text.match(/(?:Body\s*Type)\s*[:\-\|\s]*\s*([A-Za-z\s]+)/i);
        if (bodyMatch) body_type = cleanField(bodyMatch[1]);
    }

    // 7. Seating / Standing / Sleeper Capacity split row matching
    const capHeaderIdx = lines.findIndex(l => /Seating/i.test(l) && /Standing/i.test(l));
    if (capHeaderIdx !== -1 && lines[capHeaderIdx + 1]) {
        let capLine = lines[capHeaderIdx + 1];
        capLine = capLine.replace(/\bio\b/gi, '0').replace(/\bo\b/gi, '0').replace(/\bl\b/gi, '1');
        capLine = capLine.replace(/\b[a-zA-Z]\b/g, ''); // Clear single letters
        const validNums = capLine.match(/\b\d+\b/g);
        if (validNums && validNums.length >= 3) {
            const startIdx = validNums.length - 3;
            seating = validNums[startIdx];
            standing = validNums[startIdx + 1];
            sleeper = validNums[startIdx + 2];
        } else if (validNums && validNums.length === 2) {
            seating = validNums[0];
            standing = validNums[1];
        } else if (validNums && validNums.length === 1) {
            seating = validNums[0];
        }
    } else {
        const seatMatch = text.match(/Seating\s*(?:\(in\s*all\))?\s*[:\-\|\s]*\s*(\d+)/i);
        if (seatMatch) seating = seatMatch[1];
        const standMatch = text.match(/Standing\s*[:\-\|\s]*\s*(\d+)/i);
        if (standMatch) standing = standMatch[1];
        const sleepMatch = text.match(/Sleeper\s*(?:Capacity)?\s*[:\-\|\s]*\s*(\d+)/i);
        if (sleepMatch) sleeper = sleepMatch[1];
    }

    // 8. Weight split row matching
    const weightHeaderIdx = lines.findIndex(l => /Unladen/i.test(l) && /Laden/i.test(l));
    if (weightHeaderIdx !== -1 && lines[weightHeaderIdx + 1]) {
        let wtLine = lines[weightHeaderIdx + 1];
        const cleanSegments = wtLine
            .split(/\s+/)
            .map(s => s.replace(/^[^A-Za-z0-9]+/, '').replace(/[^A-Za-z0-9]+$/, '').trim())
            .filter(s => s.length > 0 && s !== "i" && s !== "I" && s !== "£");
        if (cleanSegments.length >= 3) {
            const startIdx = cleanSegments.length - 3;
            unladen_kg = cleanSegments[startIdx];
            laden_kg = cleanSegments[startIdx + 1];
            gross_combination_weight_kg = cleanSegments[startIdx + 2];
        } else if (cleanSegments.length === 2) {
            unladen_kg = cleanSegments[0];
            laden_kg = cleanSegments[1];
        } else if (cleanSegments.length === 1) {
            unladen_kg = cleanSegments[0];
        }
    } else {
        const unladenMatch = text.match(/(?:Unladen\s*Wt|Unladen\s*Weight|U\.L\.\s*Wt|UL\s*Wt|Unladen)\s*[:\-\|\s]*\s*(\d+)/i);
        if (unladenMatch) unladen_kg = unladenMatch[1].trim();

        const grossMatch = text.match(/(?:Gross\s*Wt|Gross\s*Weight|G\.V\.W|GVW|Laden)\s*[:\-\|\s]*\s*(\d+)/i);
        if (grossMatch) laden_kg = grossMatch[1].trim();

        const gcwMatch = text.match(/(?:Gross\s*Combination\s*Weight)\s*[:\-\|\s]*\s*(\d+)/i);
        if (gcwMatch) gross_combination_weight_kg = gcwMatch[1].trim();
    }

    // 9. Cubic Capacity / Horse Power / Wheel Base split row matching
    const ccHeaderIdx = lines.findIndex(l => /Cubic\s*Cap/i.test(l) && /Horse\s*Power/i.test(l));
    if (ccHeaderIdx !== -1 && lines[ccHeaderIdx + 1]) {
        let ccLine = lines[ccHeaderIdx + 1];
        const cleanSegments = ccLine
            .split(/\s+/)
            .map(s => s.replace(/^[^A-Za-z0-9\.]+/, '').replace(/[^A-Za-z0-9\.]+$/, '').trim())
            .filter(s => s.length > 0 && s !== ";" && s !== "i" && s !== "I" && s !== "©");
        if (cleanSegments.length >= 3) {
            const startIdx = cleanSegments.length - 3;
            cubic_capacity = cleanSegments[startIdx];
            horse_power = cleanSegments[startIdx + 1];
            wheel_base_mm = cleanSegments[startIdx + 2];
        } else if (cleanSegments.length === 2) {
            cubic_capacity = cleanSegments[0];
            horse_power = cleanSegments[1];
        } else if (cleanSegments.length === 1) {
            cubic_capacity = cleanSegments[0];
        }
    } else {
        const ccMatch = text.match(/(?:Cubic\s*Cap(?:acity)?|C\.C\.|CC)\s*[:\-\|\s]*\s*([\d\.]+)/i);
        if (ccMatch) cubic_capacity = ccMatch[1].trim();
        const hpMatch = text.match(/(?:Horse\s*Power|BHP|B\.H\.P)\s*[:\-\|\s]*\s*([\d\.]+)/i);
        if (hpMatch) horse_power = hpMatch[1].trim();
        const wbMatch = text.match(/(?:Wheel\s*Base|WB)\s*[:\-\|\s]*\s*(\d+)/i);
        if (wbMatch) wheel_base_mm = wbMatch[1].trim();
    }

    // 10. Financier
    const finHeaderIdx = lines.findIndex(l => /Financier/i.test(l));
    if (finHeaderIdx !== -1 && lines[finHeaderIdx + 1]) {
        let val = lines[finHeaderIdx + 1];
        if (val.includes(",")) {
            val = val.split(",")[1];
        }
        financier = val.replace(/^[^\w\s]+/, '').replace(/[^\w\s]+$/, '').trim();
    } else {
        const financierMatch = text.match(/Financier\s*[:\-\|\s]*\s*([A-Za-z0-9\s]+(?:LIMITED|BANK|FINANCE|LTD|COOP|SERVICES))/i)
            || text.match(/Financier\s*[:\-\|\s]*\s*([A-Za-z0-9\s]+)/i);
        if (financierMatch) financier = cleanField(financierMatch[1]);
    }

    // 11. Month-Year of Manufacturing
    const mfgMatch = text.match(/\b(\d{2}-\d{4})\b/) || text.match(/\b(\d{2}\/\d{4})\b/);
    if (mfgMatch) {
        month_year_of_manufacture = mfgMatch[1].trim();
    } else {
        const mfgHeaderIdx = lines.findIndex(l => /Month-Year\s*of\s*Mfg/i.test(l));
        if (mfgHeaderIdx !== -1 && lines[mfgHeaderIdx + 1]) {
            month_year_of_manufacture = lines[mfgHeaderIdx + 1].trim();
        }
    }

    // 12. Number of Cylinders
    const cylMatch = text.match(/(?:No\.\s*of\s*Cylinders?|No\s*of\s*Cylinders?|Cylinders?|NocrOindes)\s*[:\-\|\s]*\s*(\d+)/i);
    if (cylMatch) number_of_cylinders = cylMatch[1].trim();

    // 13. Number of Axles
    const axleMatch = text.match(/(?:No\s*of\s*Axles?|No\s*of\s*Axle|Axles?)\s*[:\-\|\s]*\s*(\d+)/i);
    if (axleMatch) number_of_axles = axleMatch[1].trim();

    // 14. Registration Authority
    const authHeaderIdx = lines.findIndex(l => /Registration\s*Authority|Authonty/i.test(l));
    if (authHeaderIdx !== -1 && lines[authHeaderIdx + 1]) {
        const val = lines[authHeaderIdx + 1];
        const rtoMatch = val.match(/\b([A-Za-z\s\-]+RTO)\b/i);
        if (rtoMatch) {
            registration_authority = rtoMatch[1].trim();
        } else {
            registration_authority = val.replace(/^[^\w\s]+/, '').replace(/[^\w\s]+$/, '').trim();
        }
    } else {
        const authMatch = text.match(/(?:Registration\s*Authority|Authonty|Authority)\s*[:\-\|\s]*\s*([A-Za-z0-9\s]+RTO|[A-Za-z0-9\s]+R\.T\.O)/i)
            || text.match(/\b([A-Za-z0-9\s]+RTO)\b/i);
        if (authMatch) registration_authority = cleanField(authMatch[1]);
    }

    return {
        vehicle_class,
        registration_number,
        maker_name,
        model_name,
        colour,
        body_type,
        seating_standing_sleeper_capacity: {
            seating,
            standing,
            sleeper
        },
        weight: {
            unladen_kg,
            laden_kg,
            gross_combination_weight_kg
        },
        cubic_capacity_horse_power_wheel_base: {
            cubic_capacity,
            horse_power,
            wheel_base_mm
        },
        financier,
        month_year_of_manufacture,
        number_of_cylinders,
        number_of_axles,
        registration_authority
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