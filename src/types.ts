export interface BirthDetails {
    name: string;
    gender: 'male' | 'female' | 'other';
    dob: string;
    tob: string;
    location: string;
    lat: number;
    lon: number;
}

export interface PlanetData {
    name: string;
    sign: number;
    house: number;
    degree: number;
    strength: number;
    nakshatra?: string;
    nakshatraLord?: string;
    dignity?: 'Exalted' | 'Mooltrikona' | 'Own Sign' | 'Friendly' | 'Neutral' | 'Enemy' | 'Debilitated';
    retrograde?: boolean;
}

export interface DashaInfo {
    currentMahadasha: string;
    currentAntardasha: string;
    startDate: string;
    endDate: string;
    nextAntardasha: string;
    nextAntardashaDate: string;
    progress: number;
}

export interface DashaInfo {
    currentMahadasha: string;
    currentAntardasha: string;
    startDate: string;
    endDate: string;
    nextAntardasha: string;
    nextAntardashaDate: string;
    progress: number;
}

export interface Dosha {
    present: boolean;
    name: string;
    severity: 'Low' | 'Medium' | 'High' | 'None';
    description: string;
    remedy?: string;
}

export interface TransitData {
    name: string;
    sign: string;
    degree: number;
    progress: number; // 0-100
    daysRemaining: number;
    description: string;
}

export interface KundaliData {
    ascendant: number;
    nakshatra: string; // Moon Nakshatra
    dasha: DashaInfo;
    yogas: string[];
    planets: PlanetData[];
    doshas: Dosha[];
    bio: {
        element: string; // Fire, Earth, Air, Water
        quality: string; // Cardinal, Fixed, Mutable
        luckyGem: string;
        luckyColor: string;
    };
    transits: TransitData[];
}
