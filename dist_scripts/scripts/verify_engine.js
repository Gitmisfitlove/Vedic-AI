"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const astroEngine_1 = require("../src/engine/astroEngine");
const details = {
    name: "Test User",
    gender: "male",
    dob: "2025-12-24", // Local time assumed
    tob: "23:00",
    location: "New Delhi",
    lat: 28.6139,
    lon: 77.2090
};
console.log("Calculating Kundali for:", details);
try {
    const kundali = (0, astroEngine_1.calculateKundali)(details);
    console.log("Ascendant:", kundali.ascendant, (0, astroEngine_1.getSignName)(kundali.ascendant));
    console.log("Planets:");
    kundali.planets.forEach(p => {
        console.log(`- ${p.name}: ${p.sign} (${(0, astroEngine_1.getSignName)(p.sign)}) ${p.degree.toFixed(2)} deg`);
    });
}
catch (e) {
    console.error("Error calculating kundali:", e);
}
