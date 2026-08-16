const parser = require("../server/services/parser");

const rawText = `
Vehicle Class: GOODS CARRIER (HGV)
Regn. Number: OD05BE1209
Maker's Name: TATA MOTORS LTD
Model Name: TATA LPT 4825
Owner Name: GARG LOGISTICS
Engine No: ISBE5123456
Chassis No: MAT12345678901234
Colour: / Body Type:
MAROON ORANGE / TRUCK OPEN
Seating(in all) Standing I Sleeper Capacity
2 / 0 / 0
Unladen /Laden /Gross Combination Weight (Kg)
13880 / 47500 / 0
Cubic Cap. / Horse Power (BHPIKw) | Wheel Base(mm)
6702.00 / 249.24 / 6730
Financier:
TATA MOTORS FINANCE LIMITED
Month-Year of Mfg: 07-2021
No of Cylinders: 6
No of Axles: 5
Registration Authority: CUTTACK RTO
ABCDE1234F
`;

const result = parser.extractRC(rawText);
console.log(JSON.stringify(result, null, 2));
