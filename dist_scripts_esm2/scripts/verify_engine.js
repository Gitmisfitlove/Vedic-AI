import { calculateKundali, getSignName } from '../src/engine/astroEngine.js';
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
    const kundali = calculateKundali(details);
    console.log("Ascendant:", kundali.ascendant, getSignName(kundali.ascendant));
    console.log("Planets:");
    kundali.planets.forEach(p => {
        console.log(`- ${p.name}: ${p.sign} (${getSignName(p.sign)}) ${p.degree.toFixed(2)} deg`);
    });
}
catch (e) {
    console.error("Error calculating kundali:", e);
}
