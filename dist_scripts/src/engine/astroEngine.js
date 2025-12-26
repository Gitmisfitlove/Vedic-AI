"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateKundali = exports.getSignName = void 0;
const astronomy_engine_1 = require("astronomy-engine");
const ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];
// Approximate Lahiri Ayanamsa for J2000 epoch: 23° 51'
const getAyanamsa = (date) => {
    const J2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const daysSinceJ2000 = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24);
    const annualPrecession = 50.29 / 3600; // degrees per year
    const startAyanamsa = 23.85; // approx for J2000
    return startAyanamsa + (daysSinceJ2000 / 365.25) * annualPrecession;
};
const normalizeDegree = (deg) => {
    let d = deg % 360;
    if (d < 0)
        d += 360;
    return d;
};
const getSignName = (signIndex) => {
    return ZODIAC_SIGNS[(signIndex - 1 + 12) % 12] || "Unknown";
};
exports.getSignName = getSignName;
// Calculate True Rahu (North Node)
const getTrueNode = (time, ayanamsa) => {
    // 1. Get Moon's position and velocity (approximate velocity by finite difference)
    // We use a small delta time (e.g. 1 minute = 1/1440 days)
    const dt = 1.0 / 1440.0;
    const t1 = time;
    const t2 = time.AddDays(dt);
    // GeoVector returns J2000 Equatorial coordinates
    const r1 = (0, astronomy_engine_1.GeoVector)(astronomy_engine_1.Body.Moon, t1, true);
    const r2 = (0, astronomy_engine_1.GeoVector)(astronomy_engine_1.Body.Moon, t2, true);
    // Velocity vector
    const v = { x: r2.x - r1.x, y: r2.y - r1.y, z: r2.z - r1.z };
    const r = r1;
    // Orbital Angular Momentum h = r x v (in Equatorial coords)
    const h = {
        x: r.y * v.z - r.z * v.y,
        y: r.z * v.x - r.x * v.z,
        z: r.x * v.y - r.y * v.x
    };
    // Obliquity of Ecliptic (J2000)
    const eps = 23.4392911 * Math.PI / 180;
    const cose = Math.cos(eps);
    const sine = Math.sin(eps);
    // Rotate h from Equatorial to Ecliptic 
    const h_ecl = {
        x: h.x,
        y: h.y * cose + h.z * sine,
        z: -h.y * sine + h.z * cose
    };
    // Node vector N = (0,0,1) x h_ecl => (-h_ecl.y, h_ecl.x, 0)
    const Nx = -h_ecl.y;
    const Ny = h_ecl.x;
    // Longitude
    let nodeLon = Math.atan2(Ny, Nx) * 180 / Math.PI;
    nodeLon = normalizeDegree(nodeLon);
    // Sidereal
    const siderealNode = normalizeDegree(nodeLon - ayanamsa);
    const sign = Math.floor(siderealNode / 30) + 1;
    const degree = siderealNode % 30;
    const ketuLon = normalizeDegree(siderealNode + 180);
    const ketuSign = Math.floor(ketuLon / 30) + 1;
    const ketuDegree = ketuLon % 30;
    return {
        rahu: { name: "Rahu", sign, house: 0, degree: parseFloat(degree.toFixed(2)), strength: 100 },
        ketu: { name: "Ketu", sign: ketuSign, house: 0, degree: parseFloat(ketuDegree.toFixed(2)), strength: 100 }
    };
};
// Calculate Ascendant
const getAscendant = (time, lat, lon, ayanamsa) => {
    // 1. Get Greenwich Sidereal Time (hours)
    const gstOfDate = (0, astronomy_engine_1.SiderealTime)(time);
    // 2. Local Sidereal Time (hours)
    const lst = gstOfDate + lon / 15.0;
    const ramc = normalizeDegree(lst * 15.0); // Right Ascension of Meridian (degrees, 0-360)
    // 3. Obliquity of Ecliptic (True)
    const eps = 23.4392911; // degrees
    const epsRad = eps * Math.PI / 180;
    const ramcRad = ramc * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    // 4. Formula for Ascendant
    // tan(Asc) = -cos(RAMC) / (sin(RAMC)*cos(eps) + tan(lat)*sin(eps))
    const num = -Math.cos(ramcRad);
    const den = Math.sin(ramcRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad);
    let ascRad = Math.atan2(num, den);
    let ascDeg = normalizeDegree(ascRad * 180 / Math.PI);
    // Nirayana (Sidereal) Ascendant
    return normalizeDegree(ascDeg - ayanamsa);
};
const calculateKundali = (details) => {
    const date = new Date(`${details.dob}T${details.tob}:00`);
    const astroTime = (0, astronomy_engine_1.MakeTime)(date);
    const ayanamsa = getAyanamsa(date);
    // List of bodies to calculate
    const bodies = [
        astronomy_engine_1.Body.Sun, astronomy_engine_1.Body.Moon, astronomy_engine_1.Body.Mars, astronomy_engine_1.Body.Mercury,
        astronomy_engine_1.Body.Jupiter, astronomy_engine_1.Body.Venus, astronomy_engine_1.Body.Saturn
    ];
    const planets = bodies.map(body => {
        const vector = (0, astronomy_engine_1.GeoVector)(body, astroTime, true);
        const pos = (0, astronomy_engine_1.Ecliptic)(vector);
        const siderealLon = normalizeDegree(pos.elon - ayanamsa);
        const signIndex = Math.floor(siderealLon / 30) + 1;
        const degreeInSign = siderealLon % 30;
        return {
            name: body,
            sign: signIndex,
            house: 0,
            degree: parseFloat(degreeInSign.toFixed(2)),
            strength: 50 + (siderealLon % 20)
        };
    });
    // Add Rahu / Ketu
    const nodes = getTrueNode(astroTime, ayanamsa);
    planets.push(nodes.rahu);
    planets.push(nodes.ketu);
    // Calculate Ascendant
    const ascendantDeg = getAscendant(astroTime, details.lat, details.lon, ayanamsa);
    const finalAscendant = (Math.floor(ascendantDeg / 30) % 12) + 1;
    // Calculate Houses (Whole Sign)
    planets.forEach(p => {
        let house = p.sign - finalAscendant + 1;
        if (house <= 0)
            house += 12;
        p.house = house;
    });
    return {
        ascendant: finalAscendant,
        mahadasha: "Sun",
        antardasha: "Moon",
        yogas: ["Vipreet Raj Yoga", "Budhaditya Yoga"],
        planets
    };
};
exports.calculateKundali = calculateKundali;
