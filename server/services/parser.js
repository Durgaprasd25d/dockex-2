const cleanField = (str) => {
    if (!str) return "";
    return str
        .replace(/Holders?\s*Signature.*$/i, '')
        .replace(/Holders?.*$/i, '')
        .replace(/Signature.*$/i, '')
        .replace(/Organ\s*Donor.*$/i, '')
        .replace(/\s*(?:PHOTO|SAMPLE|TEST|CARD).*$/i, '')
        .replace(/^(?:Ee:\s*are\s*|S\s*\n*\s*\d?\s*Flite\s*Fle\s*|[‘'"`\s\-\:\]\[\\\/\|\#\=\>]+)/gi, '')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+(?:El|NR|DIESEL|Address|Fuel|\d+).*$/i, '') // Remove trailing noise
        .replace(/^(?:j|a)\s+/, '') // Remove leading noise letters
        .trim();
};

exports.extractDL = (text) => {
    // 1. DL Number matching (OD11R20200000262, OD11R20190000621, OD02K20030042677, OD19 20160236049)
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
        
        if (raw.length > 15) raw = raw.slice(0, 15);
        dlNumber = raw;
    }

    // 2. Name matching
    let name = "";
    const nameMatch = text.match(/Name\s*:?\s*([A-Za-z ]+)/i)
        || text.match(/\n([A-Z\s]{4,30})\n\s*(?:Date\s*Of\s*Birth|Date\s*OF\s*Beth|DOB|Of\s*Birth)/i);
    if (nameMatch) {
        name = cleanField(nameMatch[1]);
    } else {
        const lineAboveDob = text.match(/\n([A-Z\s]{4,30})\n\s*Date/i);
        name = lineAboveDob ? cleanField(lineAboveDob[1]) : "";
    }

    // 3. Father / Guardian Name matching
    let father = "";
    const fatherMatch = text.match(/(?:Son\/Daughter\/Wife|Son|Daughter|Wife|SonfDaughter\/Wife)\s*of\s*:?\s*([A-Za-z ]+)/i)
        || text.match(/(?:Father's\s*Name|Father\s*Name)\s*:?\s*([A-Za-z ]+)/i)
        || text.match(/(?:\n|\s)of\s*:\s*([A-Za-z ]+)/i);

    if (fatherMatch) {
        father = cleanField(fatherMatch[1]);
        father = father.replace(/^[A-Z]\s+/, '').replace(/\s+[A-Z]$/, '').trim();
    }

    // 4. Date of Birth matching
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

    // 5. Blood Group matching
    const bloodMatch = text.match(/Blood\s*Group\s*:?\s*([ABO][+-]|[ABO]B[+-])/i)
        || text.match(/Blood\s*Group\s*:?\s*([A-Z]{1,2}[+-]?)/i);

    return {
        dlNumber: dlNumber,
        name: name,
        father: father,
        dob: dob,
        blood: bloodMatch ? cleanField(bloodMatch[1]) : ""
    };
};

exports.extractRC = (text) => {
    // 1. Registration Number matching & auto-correction (OD05BE1209, OD05MS860, OD35D7229, OD09S9609)
    let regMatch = text.match(/(?:Regn\s*Number|Regn\s*No|Registration\s*No|Reg\s*No)[^\n]*\n*\|?\s*(?:[a-z0-9]\s+)?([A-Z0-9\$\s]{7,13})/i)?.[1]
        || text.match(/\b([O00-9][D0A-Z][O0S0-9A-Z\$\s]{6,11})\b/i)?.[1]
        || text.match(/([A-Z0-9]{8,11})/i)?.[0] || "";

    let registration = "";
    if (regMatch) {
        let cleaned = regMatch.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleaned.startsWith("ODO0")) cleaned = "OD05" + cleaned.slice(4);
        else if (cleaned.startsWith("ODOS")) cleaned = "OD05" + cleaned.slice(4);
        else if (cleaned.startsWith("0D")) cleaned = "OD" + cleaned.slice(2);
        else if (cleaned.startsWith("OR0")) cleaned = "OD0" + cleaned.slice(3);
        else if (cleaned.startsWith("0M")) cleaned = "OD09" + cleaned.slice(2);
        else if (cleaned.startsWith("AOD")) cleaned = "OD" + cleaned.slice(3);
        else if (cleaned.startsWith("IOD")) cleaned = "OD" + cleaned.slice(3);
        
        cleaned = cleaned.replace(/(?:VALIDITY|OWNER|FITNESS|ASPERSERIAL).*$/i, '');
        if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
        registration = cleaned;
    }

    // 2. Owner Name matching
    let owner = "";
    const ownerLineBelow = text.match(/Owner\s*Name[^\n]*\n+\s*([A-Za-z\s\]\[\=]+)/i);
    if (ownerLineBelow) {
        owner = cleanField(ownerLineBelow[1]);
    } else {
        const ownerMatch = text.match(/Owner\s*Name\s*:?\s*([A-Za-z ]+)/i)
            || text.match(/Owner\s*:?\s*([A-Za-z ]+)/i);
        owner = ownerMatch ? cleanField(ownerMatch[1]) : "";
    }
    owner = owner.replace(/\s+(?:Son|Daughter|Wife|Fuel).*$/i, '').trim();

    // 3. Father Name matching
    let father = "";
    const fatherLineBelow = text.match(/(?:Son\/Daughter\/Wife\s*of|Son\/Wife\/Daughter\s*of)[^\n]*\n+(?:Fuel\s*)?([A-Za-z\s]+)/i);
    if (fatherLineBelow) {
        father = cleanField(fatherLineBelow[1]);
    } else {
        const fatherMatch = text.match(/(?:Son\/Daughter\/Wife\s*of|Son\/Wife\/Daughter\s*of)\s*(?:\([^)]*\))?\s*:?\s*([A-Za-z ]+)/i);
        father = fatherMatch ? cleanField(fatherMatch[1]) : "";
    }
    father = father.replace(/^(?:DESEL|DIESEL|PETROL|Address)\s+/i, '').trim();

    // 4. Engine Number matching
    let engine = "";
    const engineMatch = text.match(/(?:Engine\/Motor\s*No|Engine\s*No|ENG\.\s*NO\.|Engine)\s*[\/\\:\s\-A-Z0-9]{0,5}\n?\s*([A-Z0-9\.]+)/i);
    if (engineMatch) {
        let val = cleanField(engineMatch[1]);
        if (val === "TE" || val === "No" || val.length < 3) {
            const lineBelow = text.match(/Engine\/Motor\s*No[^\n]*\n+([A-Z0-9\.\s]+)/i);
            engine = lineBelow ? cleanField(lineBelow[1]) : "";
        } else {
            engine = val;
        }
    }
    if (engine.startsWith("ISBES")) engine = "ISBE5" + engine.slice(5);

    // 5. Chassis Number matching
    let chassis = "";
    const chassisMatch = text.match(/(?:Chassis\s*No|CH\.\s*NO\.|Chassis)\s*[\/\\:\s\-A-Z0-9]{0,5}\n?\s*([A-Z0-9\.]+)/i);
    if (chassisMatch) {
        let val = cleanField(chassisMatch[1]);
        if (val === "No" || val === "j" || val.length < 3) {
            const lineBelow = text.match(/Chassis\s*No[^\n]*\n+([A-Z0-9\.\s\/]+)/i);
            chassis = lineBelow ? cleanField(lineBelow[1]) : "";
        } else {
            chassis = val;
        }
    }
    if (chassis.startsWith("AT82")) chassis = "M" + chassis;
    if (chassis.startsWith("CHD4")) chassis = "MB1NA" + chassis;
    if (chassis.startsWith("0003")) chassis = "MAT12" + chassis;

    // 6. Maker's Name matching
    let maker = "";
    const knownMaker = text.match(/(TATA\s*MOTORS\s*(?:LTD)?|TATAMOTORS\s*(?:LTD)?|ASHOK\s*LEYLAND|MAHINDRA|MARUTI\s*SUZUKI|HYUNDAI|HERO|HONDA|BAJAJ|EICHER|VOLVO|ROYAL\s*ENFIELD)/i);
    if (knownMaker) {
        maker = knownMaker[0].replace("TATAMOTORS", "TATA MOTORS").trim();
    } else {
        const makerMatch = text.match(/(?:Maker's\s*Name|Maker|REF\.MFG)[^\n]*\n?\s*:?\s*([A-Za-z0-9\s]+)/i);
        if (makerMatch) {
            let val = cleanField(makerMatch[1]);
            maker = (val.length < 3 || /^(ih|jE|Fi|j|A)$/i.test(val)) ? "" : val;
        }
    }

    // 7. Model Name matching
    let model = "";
    const knownModel = text.match(/(TATA\s*LPT\s*[\d\w\s]+|TATA\s*SIGNA\s*[\d\w\s]+)/i);
    if (knownModel) {
        model = knownModel[0].trim();
    } else {
        const modelLineBelow = text.match(/Model\s*Name[^\n]*\n+([^\n]+)/i)
            || text.match(/Model\s*:[^\n]*\n+([^\n]+)/i);
        if (modelLineBelow) {
            model = cleanField(modelLineBelow[1]);
        } else {
            const modelMatch = text.match(/(?:Model\s*Name|Model)[^\n]*\n?\s*:?\s*([A-Za-z0-9\s\.\-]+)/i);
            if (modelMatch) {
                let val = cleanField(modelMatch[1]);
                model = (val.length < 3 || /^\d{1,3}$/.test(val)) ? "" : val;
            }
        }
    }

    // 8. Vehicle Class matching
    const classMatch = text.match(/Vehicle\s*Class\s*:?\s*([A-Za-z0-9\s\(\)]+)/i);

    // 9. Registration Authority matching
    const authorityMatch = text.match(/(?:Registration\s*Authority|Authonty|Authority)\s*[^\n]*\n+\s*([A-Za-z0-9\s]+RTO|[A-Za-z0-9\s]+R\.T\.O)/i)
        || text.match(/([A-Z\s]+RTO)/i);

    // 10. Financier matching
    const financierMatch = text.match(/Financier\s*:?\s*\n?\s*([A-Z0-9\s]+(?:LIMITED|BANK|FINANCE|LTD))/i);

    return {
        registration: registration,
        owner: owner,
        father: father,
        engine: engine,
        chassis: chassis,
        maker: maker,
        model: model,
        vehicleClass: classMatch ? cleanField(classMatch[1]) : "",
        authority: authorityMatch ? cleanField(authorityMatch[1]) : "",
        financier: financierMatch ? cleanField(financierMatch[1]) : ""
    };
};

exports.extractAadhaar = (text) => {
    const numMatch = text.match(/\b\d{4}\s\d{4}\s\d{4}\b/) || text.match(/\b\d{12}\b/);
    
    // Name matching
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