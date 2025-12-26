
import { calculateKundali } from '../src/engine/astroEngine';
import type { BirthDetails } from '../src/types';

const testDetails: BirthDetails = {
    name: "VisualTest",
    dob: "2000-01-01",
    tob: "12:00",
    location: "London, UK",
    lat: 51.5074,
    lon: -0.1278,
    gender: "male" // Added to satisfy type requirement
};

console.log("---------------------------------------------------");
console.log("Running Astrological Calculation Verification");
console.log("---------------------------------------------------");
console.log(`Input: ${testDetails.location} on ${testDetails.dob} at ${testDetails.tob}`);
console.log(`Coordinates: ${testDetails.lat}, ${testDetails.lon}`);
console.log("---------------------------------------------------");

try {
    const result = calculateKundali(testDetails);

    console.log(`Ascendant Sign ID: ${result.ascendant}`);
    console.log("Planetary Positions:");
    result.planets.forEach(p => {
        console.log(`- ${p.name.padEnd(10)}: Sign ${p.sign}, Degree ${p.degree.toFixed(2)}`);
    });

    console.log("---------------------------------------------------");
    console.log("VERIFICATION SUCCESS: Engine calculated positions.");
} catch (error) {
    console.error("VERIFICATION FAILED:", error);
}
