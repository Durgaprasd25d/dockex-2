const parser = require("../server/services/parser");

const rawText = "Ti UE ERE SECRET fis 11\r\n\r\nalll VE po\r\n\r\nWw\r\n\r\ni : Hi\r\n\r\n; QO) Vehicle Class: GOODS CARRIER (HGV) 3\r\n\r\ni i\r\n\r\n#4 Regn. Number Maker's Name: ui\r\n\r\n/// ODOSBE1209 TATA MOTORS LTD i\r\n\r\ni 5 . \\ i\r\n\r\ni RS Modol Name: 7\r\nOza PI [5] TATA LPT 4825 BSVI 10X2 i\r\nMGA” = INES Colour: 1 Body Type: 5\r\n\r\nji: HY 3 MAROON ORANGE / TRUCK OPEN\r\n\r\nHY a ix¥{ Seating(in all) Standing I Sleeper Capacity\r\n\r\nHi Le, 3 2 0 io zl E\r\n\r\nce AND a7 Unladen /Laden /Gross Combination Weight (Kg) o\r\n\r\ni RR NLAY ass sa7s00 [0 £\r\n\r\ni [x , 3% 4 Cubic Cap. / Horse Power (BHPIKw) | Wheel Base(mm) ©\r\n\r\nTaf Se, ; Bo 6702.00 1249.24 16730\r\n\r\n5 [E] YL EEE Financier:\r\n\r\ni 1 Wot aur oF mig, TATA MOTORS FINANCE LIMITED\r\n\r\nit 07-2021 g\r\n\r\nid Registration Authority\r\nNocrOindes 8 CUTTACK RTO\r\no\r\n";

const result = parser.extractRC(rawText);
console.log(JSON.stringify(result, null, 2));
