const parser = require("../server/services/parser");

const rawText = `7 be i eT I ;
AI: Fa Indian Union Vehicle Registration Certificate |

2 Issued by Government of Odisha QC) |

#1 I |

12 & Regn No Date of Regn. Regn. Validity Owner @ |

4 ODOSBE1209 10-Mar-2022 As per Fitness Serial +

i Chassis No |

i MAT820003M3G 15690 i

fe Engine/Motor No FE

I B6.7B6A250D02112G64160647 E}

3 Owner Name 3

£4) KRUSHNA CHANDRA SAHOO SE

i Son/Wife/Daughter of (In case of Individual Owner) 3

i SHIKHAR SAHOO |

th || Fuel Ownership 3

# || DIESEL INDIVIDUAL =

# || Emission Norms Address 3

i [| BHARAT STAGE  BINKUDIA MUKTAPUR, KHORDHA, KHORDHA - i

(| vi ODISHA-752057 3`;

const result = parser.extractRC(rawText);
console.log(JSON.stringify(result, null, 2));
