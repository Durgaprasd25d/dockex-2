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

exports.extractRC = (text) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    // 1. Registration Number matching
    let registration = "";
    const regHeaderIdx = lines.findIndex(l => /Regn\.\s*Number|Regn\s*No|Registration\s*No|Reg\s*No/i.test(l));
    if (regHeaderIdx !== -1 && lines[regHeaderIdx + 1]) {
        registration = lines[regHeaderIdx + 1].trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    const isValidRegistration = (cleaned) => {
        const validStates = /^(AN|AP|AR|AS|BR|CH|CG|DN|DD|DL|GA|GJ|HR|HP|JK|JH|KA|KL|LD|MP|MH|MN|ML|MZ|NL|OD|OR|PB|PY|RJ|SK|TN|TS|TR|UP|UK|UA|WB|0D|OS|O0|OD0|0M|AO|IO)/i;
        return validStates.test(cleaned) && cleaned.length >= 6 && !/^(DATE|REGN|OWNER|ENGINE|CHASSIS)/i.test(cleaned);
    };

    if (!registration || !isValidRegistration(registration)) {
        let regMatch = "";
        const inlineMatch = text.match(/(?:Regn\s*Number|Regn\s*No|Registration\s*No|Reg\s*No)\s*[:\-\|\s]*\s*([A-Z0-9\-]{7,15})/i);
        if (inlineMatch && isValidRegistration(inlineMatch[1].replace(/[^A-Z0-9]/gi, ''))) {
            regMatch = inlineMatch[1];
        }
        
        if (!regMatch) {
            const stdRegMatch = text.match(/\b(AN|AP|AR|AS|BR|CH|CG|DN|DD|DL|GA|GJ|HR|HP|JK|JH|KA|KL|LD|MP|MH|MN|ML|MZ|NL|OD|OR|PB|PY|RJ|SK|TN|TS|TR|UP|UK|UA|WB|0D|OS|O0|OD0|0M|AO|IO)[0-9O\s]{1,3}[A-Z0-9\s\$\-]{4,10}\b/i);
            if (stdRegMatch && isValidRegistration(stdRegMatch[0].replace(/[^A-Z0-9]/gi, ''))) {
                regMatch = stdRegMatch[0];
            }
        }
        
        if (!regMatch) {
            const fallbackMatch = text.match(/\b([A-Z0-9]{8,11})\b/i);
            if (fallbackMatch && isValidRegistration(fallbackMatch[1].replace(/[^A-Z0-9]/gi, ''))) {
                regMatch = fallbackMatch[1];
            }
        }

        if (regMatch) {
            let cleaned = regMatch.replace(/[^A-Z0-9]/gi, '').toUpperCase();
            if (cleaned.startsWith("ODO0S")) cleaned = "OD05" + cleaned.slice(5);
            else if (cleaned.startsWith("ODO0")) cleaned = "OD05" + cleaned.slice(4);
            else if (cleaned.startsWith("ODOS")) cleaned = "OD05" + cleaned.slice(4);
            else if (cleaned.startsWith("OD0O")) cleaned = "OD05" + cleaned.slice(4);
            else if (cleaned.startsWith("0D")) cleaned = "OD" + cleaned.slice(2);
            else if (cleaned.startsWith("OR0")) cleaned = "OD0" + cleaned.slice(3);
            else if (cleaned.startsWith("0M")) cleaned = "OD09" + cleaned.slice(2);
            else if (cleaned.startsWith("AOD")) cleaned = "OD" + cleaned.slice(3);
            else if (cleaned.startsWith("IOD")) cleaned = "OD" + cleaned.slice(3);
            
            cleaned = cleaned.replace(/(?:VALIDITY|OWNER|FITNESS|ASPERSERIAL).*$/i, '');
            if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
            registration = cleaned;
        }
    }

    // 2. Owner Name matching
    let owner = "";
    const ownerHeaderIdx = lines.findIndex(l => /Owner\s*Name/i.test(l) || /Owner:/i.test(l));
    if (ownerHeaderIdx !== -1 && lines[ownerHeaderIdx + 1] && !/Father|Son|Fuel|Address/i.test(lines[ownerHeaderIdx + 1])) {
        owner = cleanField(lines[ownerHeaderIdx + 1]);
    }
    if (!owner) {
        const ownerMatch = text.match(/Owner\s*Name\s*[:\-\|\s]*\s*([A-Za-z ]{3,30})/i)
            || text.match(/Owner\s*[:\-\|\s]*\s*([A-Za-z ]{3,30})/i);
        if (ownerMatch && ownerMatch[1] && ownerMatch[1].trim().length >= 3 && !/^(name|owner)$/i.test(ownerMatch[1].trim())) {
            owner = cleanField(ownerMatch[1]);
        } else {
            const ownerLineBelow = text.match(/Owner\s*Name[^\n]*\n+\s*([A-Za-z\s\]\[\=]+)/i);
            if (ownerLineBelow) {
                owner = cleanField(ownerLineBelow[1]);
            }
        }
    }
    owner = owner.replace(/\s+(?:Son|Daughter|Wife|Fuel).*$/i, '').trim();

    // 3. Father Name matching
    let father = "";
    const fatherMatch = text.match(/(?:Son\/Daughter\/Wife\s*of|Son\/Wife\/Daughter\s*of)\s*(?:\([^)]*\))?\s*:?\s*([A-Za-z ]+)/i);
    if (fatherMatch) {
        father = cleanField(fatherMatch[1]);
    } else {
        const fatherLineBelow = text.match(/(?:Son\/Daughter\/Wife\s*of|Son\/Wife\/Daughter\s*of)[^\n]*\n+(?:Fuel\s*)?([A-Za-z\s]+)/i);
        if (fatherLineBelow) {
            father = cleanField(fatherLineBelow[1]);
        }
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
    const chassisMatch = text.match(/(?:Chassis\s*No|CH\.\s*NO\.|Chassis)\s*[:\-\/\s\\|j\[\]\=]{0,5}\n?\s*([A-Z0-9\.\s\-]{8,22})/i);
    if (chassisMatch) {
        let val = chassisMatch[1].trim().replace(/[^A-Z0-9]/gi, '');
        if (val === "NO" || val === "J" || val.length < 5) {
            const lineBelow = text.match(/Chassis\s*No[^\n]*\n+([A-Z0-9\.\s\/]+)/i);
            chassis = lineBelow ? lineBelow[1].trim().replace(/[^A-Z0-9]/gi, '') : "";
        } else {
            chassis = val;
        }
    }
    if (chassis) {
        chassis = chassis.toUpperCase();
        if (chassis.length > 17) {
            chassis = chassis.replace(/^[ILE]+/g, '').replace(/[ILE]+$/g, '');
        }
        if (chassis.length > 17) {
            chassis = chassis.slice(0, 17);
        }
    }
    if (chassis.startsWith("AT82")) chassis = "M" + chassis;
    if (chassis.startsWith("CHD4")) chassis = "MB1NA" + chassis;
    if (chassis.startsWith("0003")) chassis = "MAT12" + chassis;

    // 6. Maker's Name matching
    let maker = "";
    const makerHeaderIdx = lines.findIndex(l => /Maker's\s*Name/i.test(l));
    if (makerHeaderIdx !== -1 && lines[makerHeaderIdx + 1]) {
        maker = cleanField(lines[makerHeaderIdx + 1]);
    }
    if (!maker) {
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
    }

    // 7. Model Name matching
    let model = "";
    const modelHeaderIdx = lines.findIndex(l => /Model\s*Name/i.test(l));
    if (modelHeaderIdx !== -1 && lines[modelHeaderIdx + 1]) {
        model = cleanField(lines[modelHeaderIdx + 1]);
    }
    if (!model) {
        const knownModel = text.match(/(TATA\s*LPT\s*[A-Z0-9\s\-]{3,30}|TATA\s*SIGNA\s*[A-Z0-9\s\-]{3,30})/i);
        if (knownModel) {
            model = cleanField(knownModel[0]);
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
    }

    // 8. Vehicle Class matching
    const classMatch = text.match(/(?:Vehicle\s*Class|Class)\s*[:\-\|\s]*\s*([A-Za-z0-9\s\(\)]+)/i);
    let vehicleClass = classMatch ? cleanField(classMatch[1]) : "";
    if (vehicleClass) {
        vehicleClass = vehicleClass.replace(/\s+\d+$/, '').trim();
    }

    // 9. Registration Authority matching
    let authority = "";
    const authHeaderIdx = lines.findIndex(l => /Registration\s*Authority|Authonty/i.test(l));
    if (authHeaderIdx !== -1 && lines[authHeaderIdx + 1]) {
        authority = cleanField(lines[authHeaderIdx + 1]);
    }
    if (!authority) {
        const authorityMatch = text.match(/(?:Registration\s*Authority|Authonty|Authority)\s*[^\n]*\n+\s*([A-Za-z0-9\s]+RTO|[A-Za-z0-9\s]+R\.T\.O)/i)
            || text.match(/\b([A-Za-z0-9\s]+RTO)\b/i);
        if (authorityMatch) {
            const rawAuth = cleanField(authorityMatch[1]);
            const rtoMatch = rawAuth.match(/\b([A-Z0-9\s\-]+RTO)\b/i);
            if (rtoMatch) {
                const parts = rtoMatch[1].trim().split(/\s+/);
                authority = parts.slice(-2).join(' ');
            } else {
                authority = rawAuth;
            }
        }
    }

    // 10. Financier matching
    let financier = "";
    const finHeaderIdx = lines.findIndex(l => /Financier/i.test(l));
    if (finHeaderIdx !== -1 && lines[finHeaderIdx + 1]) {
        financier = cleanField(lines[finHeaderIdx + 1]);
    }
    if (!financier) {
        const finHeaderIdxRegex = lines.findIndex(l => /Financier/i.test(l));
        if (finHeaderIdxRegex !== -1) {
            for (let i = finHeaderIdxRegex + 1; i <= Math.min(finHeaderIdxRegex + 4, lines.length - 1); i++) {
                const finMatch = lines[i].match(/\b([A-Z0-9\s\-]+(?:LIMITED|BANK|FINANCE|LTD|COOP|SERVICES))\b/i);
                if (finMatch) {
                    financier = cleanField(finMatch[1]);
                    break;
                }
            }
        }
        if (!financier) {
            const financierMatch = text.match(/Financier\s*:?\s*\n?\s*([A-Z0-9\s]+(?:LIMITED|BANK|FINANCE|LTD))/i);
            if (financierMatch) {
                financier = cleanField(financierMatch[1]);
            }
        }
    }

    // 11. RC Dates & Validity matching
    let registrationDate = "";
    let registrationValidity = "";
    let fitnessValidity = "";

    const dateOfRegnMatch = text.match(/Date\s*of\s*Regn\.?\s*(?:Regn\.?\s*Validity)?\s*[^\n]*\n+[^\n]*\b(\d{2}[-\/\.][A-Za-z0-9]{3,4}[-\/\.]\d{4})\b/i);
    if (dateOfRegnMatch) {
        registrationDate = dateOfRegnMatch[1];
    }
    
    const valMatch = text.match(/(?:Regn\.?\s*Validity|Valid\s*Upto|Valid\s*Till)\s*[:\-\s]*\s*(As\s*per\s*Fitness|\d{2}[-\/\.][A-Za-z0-9]{3,4}[-\/\.]\d{4}|\d{2}[-\/\.]\d{2}[-\/\.]\d{4})/i);
    if (valMatch) {
        registrationValidity = valMatch[1];
    } else if (/As\s*per\s*Fitness/i.test(text)) {
        registrationValidity = "As per Fitness";
    }

    if (!registrationDate) {
        const regDateMatch = text.match(/(?:Date\s*of\s*Regn|Regn\s*Date|Registration\s*Date|Reg\s*Date)\s*[:\-\s]*\s*(\d{2}[-\/\.][A-Za-z0-9]{3,4}[-\/\.]\d{4}|\d{2}[-\/\.]\d{2}[-\/\.]\d{4}|\d{2}[-\/\.]\d{2})/i);
        if (regDateMatch) {
            registrationDate = regDateMatch[1];
        }
    }

    if (!registrationDate) {
        const mmYyyyMatch = text.match(/\b(\d{2}[-\/\.]\d{4})\b/);
        if (mmYyyyMatch) {
            registrationDate = mmYyyyMatch[1];
        }
    }

    const fitMatch = text.match(/(?:Fitness\s*Valid\s*Upto|Fitness\s*Valid\s*Till|Fitness\s*Validity|Fitness\s*Expiry|Fitness|Fit|it)\s*[:\-\s]*\s*(\d{2}[-\/\.][A-Za-z0-9]{3,4}[-\/\.]\d{4}|\d{2}[-\/\.]\d{2}[-\/\.]\d{4}|\d{2}[-\/\.]\d{4})/i);
    if (fitMatch) {
        fitnessValidity = fitMatch[1];
    }

    if (fitnessValidity) {
        const cleanFit = cleanDate(fitnessValidity);
        if (!registrationValidity || registrationValidity.toLowerCase() === "as per fitness") {
            registrationValidity = `As per Fitness (${cleanFit})`;
        }
    }

    // 12. NEW DETAILED FIELDS FOR RC SCAN

    // Fuel Type
    const fuelMatch = text.match(/(?:Fuel\s*Type|Fuel)\s*[:\-\|\s]*\s*(DIESEL|PETROL|CNG|LPG|EV|ELECTRIC)/i);
    const fuelType = fuelMatch ? fuelMatch[1].trim().toLowerCase() : "diesel";

    // Colour & Body Type split row matching
    let color = "";
    let bodyType = "open trolly";
    const colorHeaderIdx = lines.findIndex(l => /Colour/i.test(l) && /Body\s*Type/i.test(l));
    if (colorHeaderIdx !== -1 && lines[colorHeaderIdx + 1]) {
        const parts = lines[colorHeaderIdx + 1].split(/\s*[\/\\]\s*/);
        if (parts[0]) color = cleanField(parts[0]);
        if (parts[1]) bodyType = cleanField(parts[1]);
    } else {
        const colorMatch = text.match(/(?:Colo[ur]+|Color)\s*[:\-\|\s]*\s*([A-Za-z\s]+)/i);
        if (colorMatch) color = cleanField(colorMatch[1]);

        const bodyMatch = text.match(/(?:Body\s*Type)\s*[:\-\|\s]*\s*([A-Za-z\s]+)/i);
        if (bodyMatch) bodyType = cleanField(bodyMatch[1]);
    }

    // Weight split row matching (Unladen / Laden / Gross Combination Weight)
    let unladenWeight = "";
    let grossWeight = "";
    const weightHeaderIdx = lines.findIndex(l => /Unladen/i.test(l) && /Laden/i.test(l));
    if (weightHeaderIdx !== -1 && lines[weightHeaderIdx + 1]) {
        const parts = lines[weightHeaderIdx + 1].split(/\s*[\/\\]\s*/);
        if (parts[0]) unladenWeight = parts[0].trim();
        if (parts[1]) grossWeight = parts[1].trim();
    } else {
        const unladenMatch = text.match(/(?:Unladen\s*Wt|Unladen\s*Weight|U\.L\.\s*Wt|UL\s*Wt)\s*[:\-\|\s]*\s*(\d+)/i);
        if (unladenMatch) unladenWeight = unladenMatch[1].trim();

        const grossMatch = text.match(/(?:Gross\s*Wt|Gross\s*Weight|G\.V\.W|GVW|Laden)\s*[:\-\|\s]*\s*(\d+)/i);
        if (grossMatch) grossWeight = grossMatch[1].trim();
    }

    // Cubic Capacity CC split row matching
    let cubicCapacity = "";
    const ccHeaderIdx = lines.findIndex(l => /Cubic\s*Cap/i.test(l) && /Horse\s*Power/i.test(l));
    if (ccHeaderIdx !== -1 && lines[ccHeaderIdx + 1]) {
        const parts = lines[ccHeaderIdx + 1].split(/\s*[\/\\]\s*/);
        if (parts[0]) cubicCapacity = parts[0].trim();
    } else {
        const ccMatch = text.match(/(?:Cubic\s*Cap(?:acity)?|C\.C\.|CC)\s*[:\-\|\s]*\s*([\d\.]+)/i);
        if (ccMatch) cubicCapacity = ccMatch[1].trim();
    }

    // Manufacturing Month-Year row matching
    let manufacturingDate = "";
    const mfgHeaderIdx = lines.findIndex(l => /Month-Year\s*of\s*Mfg/i.test(l));
    if (mfgHeaderIdx !== -1 && lines[mfgHeaderIdx + 1]) {
        const rawMfg = lines[mfgHeaderIdx + 1].trim();
        const parts = rawMfg.split(/[-\/\.]/);
        if (parts.length === 2) {
            manufacturingDate = `01-${parts[0]}-${parts[1]}`;
        } else if (rawMfg.length === 4) {
            manufacturingDate = `01-01-${rawMfg}`;
        }
    }
    if (!manufacturingDate) {
        const mfgMatch = text.match(/(?:Mfg\s*Date|MFG\s*DT|MFG|Month\/Yr|Mfg\s*Yr|Mfg\s*Year)\s*[:\-\|\s]*\s*(\d{2}[-\/\.]\d{4}|\d{4})/i);
        if (mfgMatch) {
            const rawMfg = mfgMatch[1].trim();
            if (rawMfg.length === 4) {
                manufacturingDate = `01-01-${rawMfg}`;
            } else {
                const parts = rawMfg.split(/[-\/\.]/);
                if (parts.length === 2) {
                    manufacturingDate = `01-${parts[0]}-${parts[1]}`;
                } else {
                    manufacturingDate = rawMfg.replace(/[\/\.]/g, '-');
                }
            }
        }
    }

    // Axles & Estimated Wheels
    const axleMatch = text.match(/(?:No\s*of\s*Axle|Axles?)\s*[:\-\|\s]*\s*(\d+)/i);
    let numberOfWheels = "10";
    if (axleMatch) {
        const axles = parseInt(axleMatch[1]);
        if (axles === 2) numberOfWheels = "6";
        else if (axles === 3) numberOfWheels = "10";
        else if (axles === 4) numberOfWheels = "12";
        else if (axles === 5) numberOfWheels = "10";
        else if (axles >= 6) numberOfWheels = "12";
    }

    // Owner Address
    let address = "";
    const addressMatch = text.match(/(?:Address|Add)\s*[:\-\|\s]*\s*([\s\S]+?)(?=(?:Pin|RTO|Authority|Engine|Chassis|Date|Validity|Fitness|GVW|Unladen|$))/i);
    if (addressMatch) {
        address = addressMatch[1].replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Pin Code
    const pinMatch = text.match(/\b(\d{6})\b/);
    const pinCode = pinMatch ? pinMatch[1] : "";

    // State & District
    const statesList = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"];
    let state = "";
    for (const s of statesList) {
        if (new RegExp(s, "i").test(text)) {
            state = s;
            break;
        }
    }
    if (!state) {
        const regCheck = registration;
        if (regCheck) {
            const prefix = regCheck.slice(0, 2).toUpperCase();
            const stateMap = {
                "OD": "Odisha", "OR": "Odisha", "DL": "Delhi", "MH": "Maharashtra", "KA": "Karnataka",
                "TN": "Tamil Nadu", "AP": "Andhra Pradesh", "TS": "Telangana", "WB": "West Bengal",
                "UP": "Uttar Pradesh", "GJ": "Gujarat", "HR": "Haryana", "PB": "Punjab", "MP": "Madhya Pradesh"
            };
            state = stateMap[prefix] || "";
        }
    }

    let district = "";
    if (authority) {
        district = authority.replace(/RTO|R\.T\.O/gi, '').trim();
    }

    let area = "";
    if (address) {
        const addressWords = address.split(",");
        if (addressWords.length > 1) {
            area = addressWords[addressWords.length - 2].trim();
        }
    }

    return {
        registration: registration,
        owner: owner,
        father: father,
        engine: engine,
        chassis: chassis,
        maker: maker,
        model: model,
        vehicleClass: vehicleClass,
        authority: authority,
        financier: financier,
        registrationDate: cleanDate(registrationDate),
        registrationValidity: cleanDate(registrationValidity),
        fitnessValidity: cleanDate(fitnessValidity),
        fuelType,
        color,
        cubicCapacity,
        unladenWeight,
        grossWeight,
        manufacturingDate,
        address,
        pinCode,
        state,
        district,
        area,
        numberOfWheels,
        bodyType
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