
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'src', 'data', 'database.json');

app.use(cors());
app.use(bodyParser.json());

// Helper to read DB
const readDb = () => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            // Create if not exists
            fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
            return [];
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading DB:", err);
        return [];
    }
};

// Helper to write DB
const writeDb = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error("Error writing DB:", err);
        return false;
    }
};

// GET all profiles
app.get('/api/profiles', (req, res) => {
    const profiles = readDb();
    res.json(profiles);
});

// POST save profile
app.post('/api/profiles', (req, res) => {
    const newProfile = req.body;
    if (!newProfile || !newProfile.name) {
        return res.status(400).json({ error: "Invalid profile data" });
    }

    const profiles = readDb();
    // Update existing or append new
    const existingIndex = profiles.findIndex(p => p.name === newProfile.name);

    if (existingIndex >= 0) {
        profiles[existingIndex] = newProfile;
    } else {
        profiles.push(newProfile);
    }

    if (writeDb(profiles)) {
        res.json({ success: true, profiles });
    } else {
        res.status(500).json({ error: "Failed to save profile" });
    }
});

// DELETE profile
app.delete('/api/profiles/:name', (req, res) => {
    const nameToDelete = req.params.name;
    let profiles = readDb();

    const initialLen = profiles.length;
    profiles = profiles.filter(p => p.name !== nameToDelete);

    if (profiles.length === initialLen) {
        return res.status(404).json({ error: "Profile not found" });
    }

    if (writeDb(profiles)) {
        res.json({ success: true, profiles });
    } else {
        res.status(500).json({ error: "Failed to delete profile" });
    }
});

const ANALYSIS_DIR = path.join(__dirname, 'src', 'data', 'analysis');

// Ensure analysis directory exists
if (!fs.existsSync(ANALYSIS_DIR)) {
    fs.mkdirSync(ANALYSIS_DIR, { recursive: true });
}

// POST save analysis
app.post('/api/save-analysis', (req, res) => {
    const { name, date, data } = req.body;
    if (!name || !data) {
        return res.status(400).json({ error: "Invalid analysis data" });
    }

    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `analysis_${safeName}_${timestamp}.json`;
    const filePath = path.join(ANALYSIS_DIR, filename);

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Saved analysis to ${filePath}`);
        res.json({ success: true, filename });
    } catch (err) {
        console.error("Error saving analysis:", err);
        res.status(500).json({ error: "Failed to save analysis" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
