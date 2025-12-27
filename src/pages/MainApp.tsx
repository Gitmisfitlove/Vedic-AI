import React, { useState, useEffect, useRef } from 'react';
import {
    Sparkles,
    ChevronDown,
    MapPin,
    LayoutDashboard,
    Clock,
    Trash2,
    Search,
    Info,
    CheckCircle2,
    AlertCircle,
    Calendar,
    User,
    Compass,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Send,
    RefreshCcw,
    LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import type { BirthDetails, KundaliData } from '../types';
import { CosmicView } from '../components/CosmicView';
import { HoloCard } from '../components/HoloCard';
import { calculateKundali, getSignName } from '../engine/astroEngine';
import { cn } from '../utils/cn';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { AdvancedTimePicker } from '../components/AdvancedTimePicker';
import { useAuth } from '../contexts/AuthContext';

// --- Sub-components (Migrated from App.tsx) ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
                "fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md border border-white/10",
                type === 'success'
                    ? "bg-[#0f172a]/90 border-[#60a5fa]/50 text-[#bfdbfe] shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                    : "bg-[#450a0a]/90 border-[#f87171]/50 text-[#fecaca] shadow-[0_0_15px_rgba(220,38,38,0.3)]"
            )}
        >
            {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#60a5fa]" /> : <AlertCircle className="w-5 h-5 text-[#f87171]" />}
            <span className="font-semibold tracking-wide">{message}</span>
        </motion.div>
    );
};

const OrbitingStarsLoader = () => {
    return (
        <div className="relative w-24 h-24 flex items-center justify-center">
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                    key={i}
                    className="absolute w-full h-full"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.2
                    }}
                >
                    <div
                        className={cn(
                            "absolute w-3 h-3 rounded-full blur-[1px] shadow-[0_0_10px_currentColor]",
                            [
                                "bg-[#2563eb] top-0 left-1/2 -translate-x-1/2",
                                "bg-[#60a5fa] bottom-2 right-4",
                                "bg-[#93c5fd] bottom-2 left-4",
                                "bg-[#3b82f6] top-8 right-0",
                                "bg-white top-8 left-0"
                            ][i]
                        )}
                    />
                </motion.div>
            ))}
            <div className="absolute text-[#94a3b8] font-mono text-xs animate-pulse">
                ALIGNING
            </div>
        </div>
    );
};

const SegmentedGender = ({ value, onChange }: { value: 'male' | 'female' | 'other', onChange: (val: 'male' | 'female' | 'other') => void }) => {
    return (
        <div className="flex bg-[#0f172a] p-1 rounded-lg border border-[#334155]">
            {(['male', 'female', 'other'] as const).map((g) => (
                <button
                    key={g}
                    type="button"
                    onClick={() => onChange(g)}
                    className={cn(
                        "flex-1 py-2 rounded-md text-sm font-medium transition-all capitalize",
                        value === g
                            ? "bg-[#2563eb] text-white shadow-lg"
                            : "text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/5"
                    )}
                >
                    {g}
                </button>
            ))}
        </div>
    );
};

interface LocationInputProps {
    value: string;
    onChange: (city: string, lat: number, lon: number) => void;
}

const LocationInput = ({ value, onChange }: LocationInputProps) => {
    const [suggestions, setSuggestions] = useState<{ name: string, lat: number, lon: number }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<any>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchLocation = async (query: string) => {
        if (!query || query.length < 3) return;

        setLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
            const data = await res.json();

            const cities = data.map((item: any) => ({
                name: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon)
            }));

            setSuggestions(cities);
            setShowSuggestions(true);
        } catch (err) {
            console.error("Location API Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val, 0, 0);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (val.length > 2) {
            setLoading(true);
            debounceRef.current = setTimeout(() => {
                searchLocation(val);
            }, 500);
        } else {
            setShowSuggestions(false);
            setLoading(false);
        }
    };

    const handleSelect = (city: { name: string, lat: number, lon: number }) => {
        onChange(city.name, city.lat, city.lon);
        setShowSuggestions(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input
                    required
                    className={cn(
                        "w-full bg-[#1e293b] border rounded-lg p-3 pr-10 text-[#f8fafc] outline-none transition-all placeholder:text-[#94a3b8]",
                        "focus:ring-2 focus:ring-[#2563eb]",
                        (value && suggestions.length === 0 && !loading && wrapperRef.current && !wrapperRef.current.contains(document.activeElement))
                            ? "border-red-500/50"
                            : "border-[#334155]"
                    )}
                    placeholder="Search City (e.g. Mumbai, New York)"
                    value={value}
                    onChange={handleChange}
                    onFocus={() => value.length > 2 && setShowSuggestions(true)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-1 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-xl max-h-64 overflow-y-auto custom-scrollbar"
                    >
                        {suggestions.map((city, i) => (
                            <div
                                key={i}
                                className="px-4 py-3 hover:bg-[#2563eb]/10 text-[#e2e8f0] cursor-pointer text-sm transition-colors border-b border-[#334155]/50 last:border-0 flex items-start gap-2"
                                onClick={() => handleSelect(city)}
                            >
                                <MapPin className="mt-0.5 w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                                <span className="line-clamp-2">{city.name}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const CustomDatePicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'days' | 'years'>('days');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value && value.length === 10) {
            const [m, d, y] = value.split('/').map(Number);
            if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
                setViewDate(new Date(y, m - 1, 1));
            }
        }
    }, [showCalendar]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 8) v = v.slice(0, 8);

        if (v.length >= 5) {
            v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        } else if (v.length >= 3) {
            v = `${v.slice(0, 2)}/${v.slice(2)}`;
        }
        onChange(v);
    };

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleDaySelect = (d: number) => {
        const m = viewDate.getMonth() + 1;
        const y = viewDate.getFullYear();
        const formatted = `${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}/${y}`;
        onChange(formatted);
        setShowCalendar(false);
    };

    const generateYearRange = (start: number, end: number) => {
        const years = [];
        for (let i = start; i <= end; i++) years.push(i);
        return years;
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                required
                type="text"
                inputMode="numeric"
                placeholder="MM/DD/YYYY"
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-[#f8fafc] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#94a3b8]"
                value={value}
                onChange={handleChange}
                onFocus={() => setShowCalendar(false)}
            />
            <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#2563eb] transition-colors"
            >
                <Calendar className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {showCalendar && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute z-50 right-0 mt-2 w-72 bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-4 flex justify-between items-center border-b border-[#334155] bg-[#0f172a]">
                            {viewMode === 'days' ? (
                                <>
                                    <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1 hover:bg-white/10 rounded">
                                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('years')}
                                        className="font-bold text-[#f8fafc] hover:text-[#2563eb] transition-colors flex items-center gap-1"
                                    >
                                        {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1 hover:bg-white/10 rounded">
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                </>
                            ) : (
                                <div className="flex w-full justify-between items-center">
                                    <span className="font-bold text-[#f8fafc]">Select Year</span>
                                    <button onClick={() => setViewMode('days')} className="text-xs text-[#2563eb] hover:underline">Back</button>
                                </div>
                            )}
                        </div>

                        <div className="p-4">
                            {viewMode === 'days' ? (
                                <div className="grid grid-cols-7 gap-1 text-center">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                        <div key={d} className="text-xs text-[#64748b] mb-2 font-medium">{d}</div>
                                    ))}
                                    {Array(firstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth())).fill(null).map((_, i) => (
                                        <div key={`empty-${i}`} />
                                    ))}
                                    {Array(daysInMonth(viewDate.getFullYear(), viewDate.getMonth())).fill(null).map((_, i) => {
                                        const d = i + 1;
                                        const isSelected = value === `${(viewDate.getMonth() + 1).toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}/${viewDate.getFullYear()}`;
                                        return (
                                            <button
                                                key={d}
                                                onClick={() => handleDaySelect(d)}
                                                className={cn(
                                                    "h-8 w-8 rounded-full text-sm flex items-center justify-center transition-all",
                                                    isSelected ? "bg-[#2563eb] text-white font-bold shadow-lg" : "text-[#e2e8f0] hover:bg-white/10"
                                                )}
                                            >
                                                {d}
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="h-64 overflow-y-auto custom-scrollbar grid grid-cols-3 gap-2">
                                    {generateYearRange(1900, new Date().getFullYear()).reverse().map(year => (
                                        <button
                                            key={year}
                                            onClick={() => {
                                                setViewDate(new Date(year, viewDate.getMonth(), 1));
                                                setViewMode('days');
                                            }}
                                            className={cn(
                                                "py-2 rounded-lg text-sm border border-transparent hover:border-[#334155] hover:bg-white/5",
                                                year === viewDate.getFullYear() ? "bg-[#2563eb]/20 text-[#2563eb] border-[#2563eb]" : "text-[#94a3b8]"
                                            )}
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const BirthForm = ({ onSubmit }: { onSubmit: (data: BirthDetails) => void }) => {
    const [formData, setFormData] = useState<BirthDetails>({
        name: '',
        gender: 'male',
        dob: '',
        tob: '',
        location: '',
        lat: 0,
        lon: 0
    });
    const [savedProfiles, setSavedProfiles] = useState<BirthDetails[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { currentUser } = useAuth(); // Auth integration

    // References
    const nameRef = useRef<HTMLInputElement>(null);
    const dobRef = useRef<HTMLInputElement>(null);
    const tobRef = useRef<HTMLInputElement>(null);
    const locationRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                if (!currentUser) return;
                // Authenticated Query: only fetch profiles for this user
                const q = query(collection(db, "profiles"), where("userId", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);
                const profiles: BirthDetails[] = [];
                querySnapshot.forEach((doc) => {
                    profiles.push({ ...doc.data() as BirthDetails, id: doc.id });
                });
                setSavedProfiles(profiles);
            } catch (err) {
                console.error("Error fetching profiles:", err);
            }
        };
        fetchProfiles();
    }, [currentUser]);

    const handleKeyDown = (e: React.KeyboardEvent, nextRef: any) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nextRef?.current?.focus();
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const saveProfile = async () => {
        // Basic Validation
        if (!formData.name.trim() || !formData.lat) {
            showToast("Please complete the form to save.", "error");
            return;
        }

        try {
            if (!currentUser) {
                showToast("You must be logged in to save.", "error");
                return;
            }

            const dataToSave = { ...formData, userId: currentUser.uid }; // Link to user
            const docRef = await addDoc(collection(db, "profiles"), dataToSave);
            const newProfile = { ...dataToSave, id: docRef.id };

            const newProfiles = [...savedProfiles, newProfile];
            setSavedProfiles(newProfiles);
            showToast('Profile saved successfully!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to save profile.', 'error');
        }
    };

    const loadProfile = (profile: BirthDetails) => {
        let displayDob = profile.dob;
        if (profile.dob.includes('-')) {
            const [y, m, d] = profile.dob.split('-');
            displayDob = `${m}/${d}/${y}`;
        }
        setFormData({ ...profile, dob: displayDob });
    };

    const deleteProfile = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (!id) return;
            await deleteDoc(doc(db, "profiles", id));
            const newProfiles = savedProfiles.filter(p => p.id !== id);
            setSavedProfiles(newProfiles);
        } catch (err) {
            console.error("Error deleting profile:", err);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            gender: 'male',
            dob: '',
            tob: '',
            location: '',
            lat: 0,
            lon: 0
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.lat) {
            showToast("Please fill all required fields correctly.", "error");
            return;
        }

        setIsSubmitting(true);
        setTimeout(() => {
            let engineDob = formData.dob;
            const parts = formData.dob.split('/');
            if (parts.length === 3) {
                engineDob = `${parts[2]}-${parts[0]}-${parts[1]}`;
            }
            const submissionData = { ...formData, dob: engineDob };
            onSubmit(submissionData);
            setIsSubmitting(false);
        }, 1500);
    };

    if (isSubmitting) {
        return (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center min-h-[400px] text-center"
            >
                <OrbitingStarsLoader />
                <p className="mt-8 text-lg font-medium text-[#f8fafc] animate-pulse">Consulting the Stars...</p>
                <p className="text-sm text-[#94a3b8]">Calculating planetary alignments for {formData.location}</p>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl shadow-blue-900/20 relative"
        >
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[#2563eb]/20 rounded-full">
                    <Compass className="w-8 h-8 text-[#2563eb]" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[#f8fafc]">Let's get to know you</h2>
                    <p className="text-[#94a3b8]">Enter your details to generate your analysis</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Form fields same as before... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <User className="w-4 h-4" /> Name
                        </label>
                        <input
                            ref={nameRef}
                            autoFocus
                            required
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3.5 text-slate-200 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-500 hover:border-blue-500/30"
                            placeholder="Arjun Sharma"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            onKeyDown={(e) => handleKeyDown(e, dobRef)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#94a3b8]">Gender</label>
                        <SegmentedGender
                            value={formData.gender as 'male' | 'female' | 'other'}
                            onChange={(val) => setFormData({ ...formData, gender: val })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#94a3b8] flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Date of Birth
                        </label>
                        <div ref={dobRef} tabIndex={-1} className="outline-none" onKeyDown={(e) => handleKeyDown(e, tobRef)}>
                            <CustomDatePicker
                                value={formData.dob}
                                onChange={(val) => setFormData({ ...formData, dob: val })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#94a3b8] flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Time of Birth
                        </label>
                        <AdvancedTimePicker
                            ref={tobRef}
                            value={formData.tob}
                            onChange={(val) => setFormData({ ...formData, tob: val })}
                            onKeyDown={(e) => handleKeyDown(e, locationRef)}
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-[#94a3b8] flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Birth Location
                        </label>
                        <div ref={locationRef} tabIndex={-1} className="outline-none">
                            <LocationInput
                                value={formData.location}
                                onChange={(val, lat, lon) => setFormData({ ...formData, location: val, lat, lon })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={saveProfile}
                        className="flex-1 bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={resetForm}
                        className="w-16 bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                    <button
                        type="submit"
                        className="flex-[2] bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                    >
                        Calculate <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </form>

            {savedProfiles.length > 0 && (
                <div className="mt-8 border-t border-white/10 pt-6">
                    <h3 className="text-gray-400 font-medium mb-4 flex items-center gap-2">
                        <User className="w-4 h-4" /> Your Saved Profiles
                    </h3>
                    <div className="grid gap-3">
                        {savedProfiles.map(p => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 hover:border-amber-500/30 hover:bg-white/10 transition-all cursor-pointer group"
                                onClick={() => loadProfile(p)}
                            >
                                <div>
                                    <div className="font-bold text-white text-sm">{p.name}</div>
                                    <div className="text-[10px] text-gray-500">{p.dob} | {p.location}</div>
                                </div>
                                <button
                                    onClick={(e) => deleteProfile(p.id || '', e)}
                                    className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors opacity-60 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const NorthIndianChart = ({ planets, ascendant, title }: { planets: any[], ascendant: number, title: string }) => {
    return (
        <div className="bg-[#1e293b] p-4 rounded-xl border border-[#334155]">
            <h3 className="text-center text-blue-400 font-bold mb-4 uppercase tracking-wider flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> {title}
            </h3>
            <div className="relative aspect-square w-full max-w-[400px] mx-auto border border-slate-700/50 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full stroke-slate-500/50 fill-none drop-shadow-[0_0_2px_rgba(148,163,184,0.3)]">
                    <path d="M0,0 L100,100 M100,0 L0,100" />
                    <path d="M50,0 L0,50 L50,100 L100,50 Z" />
                </svg>

                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((houseNum) => {
                    const signNum = ((ascendant + houseNum - 2) % 12) + 1;
                    const housePlanets = planets.filter(p => p.house === houseNum);

                    const positions = [
                        "top-[35%] left-[50%] -translate-x-1/2",
                        "top-[15%] left-[25%] -translate-x-1/2",
                        "top-[15%] left-[75%] -translate-x-1/2",
                        "top-[50%] left-[85%] -translate-y-1/2",
                        "top-[85%] left-[75%] -translate-x-1/2",
                        "top-[85%] left-[25%] -translate-x-1/2",
                        "top-[50%] left-[15%] -translate-y-1/2",
                        "top-[75%] left-[5%] -translate-y-1/2",
                        "top-[25%] left-[5%] -translate-y-1/2",
                        "top-[5%] left-[50%] -translate-x-1/2",
                        "top-[25%] left-[95%] -translate-y-1/2",
                        "top-[75%] left-[95%] -translate-y-1/2",
                    ];

                    return (
                        <div key={houseNum} className={cn("absolute flex flex-col items-center", positions[houseNum - 1])}>
                            <span className="text-[10px] text-[#94a3b8]">{signNum}</span>
                            <div className="flex flex-wrap gap-0.5 max-w-[40px] justify-center">
                                {housePlanets.map(p => (
                                    <span key={p.name} className="text-[10px] font-bold text-[#f8fafc]">{p.name.substring(0, 2)}</span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ChatBox = ({ kundali, details }: { kundali: KundaliData, details: BirthDetails }) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
        { role: 'ai', content: `Pranam ${details.name}. I have analyzed your cosmic footprint. Your Lagna is ${getSignName(kundali.ascendant)} and you are currently in ${kundali.dasha.currentMahadasha} Mahadasha. How may I guide you on your journey of self-realization today?` }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            let response = "";
            const lower = userMsg.toLowerCase();

            if (lower.includes("career") || lower.includes("job")) {
                response = "In your chart, the 10th house and the position of Saturn suggest a period of structural growth. From a transpersonal perspective, this is not just about a job, but finding your 'Dharma'—the unique contribution you are meant to offer the world.";
            } else if (lower.includes("marriage") || lower.includes("love") || lower.includes("relationship")) {
                response = `With ${getSignName(kundali.ascendant)} rising, your approach to others is naturally ${kundali.ascendant < 6 ? 'outgoing' : 'reflective'}. Your current ${kundali.dasha.currentAntardasha} Antardasha invites you to look at relationships as mirrors for your own inner development. Healing the inner self will manifest as harmony in the outer union.`;
            } else if (lower.includes("health")) {
                response = "The cosmic weather suggests focusing on your vital energy (Prana). Vedic wisdom emphasizes that health is the alignment of mind, body, and spirit. Pay attention to your routine during this Mahadasha.";
            } else {
                response = `The stars indicate that you are in a phase of significant ${kundali.dasha.currentMahadasha} influence. According to the 'Perfect Astrologer' methodology, this is a time to cultivate patience and inner clarity. Your ${kundali.yogas[0]} highlights a natural strength you can lean on. What specific aspect of this phase would you like to explore?`;
            }

            setMessages(prev => [...prev, { role: 'ai', content: response }]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-[500px] bg-[#1e293b] rounded-2xl border border-[#334155] overflow-hidden shadow-xl">
            {/* Chat UI ... */}
            <div className="p-4 border-b border-[#334155] bg-[#0f172a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#2563eb]" />
                    <span className="font-bold text-[#f8fafc] tracking-tight">Vedic Guide AI</span>
                </div>
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-[#94a3b8] uppercase">Astro-Psychology Mode</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.map((msg, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i}
                        className={cn(
                            "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                            msg.role === 'user'
                                ? "ml-auto bg-[#2563eb] text-white rounded-br-none"
                                : "bg-[#0f172a] text-[#e2e8f0] border border-[#334155] rounded-bl-none"
                        )}
                    >
                        {msg.content}
                    </motion.div>
                ))}
                {isTyping && (
                    <div className="bg-[#0f172a] text-[#e2e8f0] p-4 rounded-2xl rounded-bl-none w-16 flex justify-center gap-1 border border-[#334155]">
                        <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <div className="p-4 bg-[#0f172a] border-t border-[#334155]">
                <div className="relative flex items-center">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about your destiny, career, or growth..."
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-full py-3 px-6 pr-12 text-[#f8fafc] text-sm focus:ring-2 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#94a3b8]"
                    />
                    <button
                        onClick={handleSend}
                        className="absolute right-2 p-2 bg-[#2563eb] rounded-full text-white hover:bg-[#1d4ed8] transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};


export const MainApp = () => {
    const [birthDetails, setBirthDetails] = useState<BirthDetails | null>(null);
    const [kundali, setKundali] = useState<KundaliData | null>(null);
    const [activeTab, setActiveTab] = useState<'charts' | 'analysis' | 'chat'>('charts');
    const { logout } = useAuth();

    const handleBirthSubmit = (details: BirthDetails) => {
        setBirthDetails(details);
        const data = calculateKundali(details);
        setKundali(data);
    };

    const reset = () => {
        setBirthDetails(null);
        setKundali(null);
    };

    if (!birthDetails || !kundali) {
        return (
            <div className="flex items-center justify-center p-6 w-full max-w-7xl mx-auto flex-col">
                <div className="w-full flex justify-end mb-4">
                    <button onClick={logout} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
                <BirthForm onSubmit={handleBirthSubmit} />
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#2563eb] rounded-lg">
                        <Compass className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 animate-shimmer">
                            Project V <span className="text-xs md:text-sm text-slate-500 font-normal tracking-widest uppercase ml-2">AstroPsych AI</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-[#60a5fa] font-bold">{birthDetails.name}</span>
                        <span className="text-[#94a3b8]">{birthDetails.dob} | {birthDetails.tob}</span>
                    </div>
                    <button
                        onClick={reset}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors"
                        title="New Chart"
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={logout}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors text-red-400"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>

                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2">
                    {[
                        { id: 'analysis', label: 'Celestial Analysis', icon: LayoutDashboard },
                        { id: 'chat', label: 'Spiritual Guide', icon: MessageSquare },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-4 rounded-xl transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/50"
                                    : "bg-slate-900/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50 hover:text-blue-300"
                            )}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span className="font-semibold tracking-wide">{tab.label}</span>
                        </button>
                    ))}

                    <div className="hidden lg:block mt-8 p-6 bg-[#1e293b] border border-[#334155] rounded-2xl">
                        <h4 className="text-[#60a5fa] font-bold flex items-center gap-2 mb-2 italic">
                            <Info className="w-4 h-4" /> Methodology
                        </h4>
                        <p className="text-xs text-[#94a3b8] leading-relaxed mb-4">
                            Our analysis utilizes the principles of <strong>Perfect Astrologer</strong> by Ram Babu Sao, blended with modern <strong>transpersonal psychology</strong>.
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9">
                    <AnimatePresence mode="wait">
                        {/*  --- Analysis Tab Content --- (Reused logic) */}
                        {activeTab === 'analysis' && (
                            <motion.div
                                key="analysis"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <NorthIndianChart
                                        title="Birth Chart (D1)"
                                        planets={kundali.planets}
                                        ascendant={kundali.ascendant}
                                    />
                                    {/* Transits Mock - reusing previous code structure */}
                                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-blue-900/10">
                                        <h3 className="text-center text-[#2563eb] font-bold uppercase tracking-wider mb-4">Current Transits</h3>
                                        {/* Simplified for brevity in migration, full logic preserved if copied exactly, but using placeholder for brevity if needed. 
                                      Actually I should use the full logic. I'll paste the full logic. */}
                                        <div className="space-y-4">
                                            {(kundali.transits || []).map((t: any) => (
                                                <div key={t.name} className="space-y-1">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-[#f8fafc] font-medium flex items-center gap-2">
                                                            {t.name} <span className="text-[#64748b]">in</span> {t.sign}
                                                        </span>
                                                        <span className="text-[#2563eb] font-mono">{t.degree.toFixed(1)}°</span>
                                                    </div>
                                                    <div className="h-1.5 bg-[#0f172a] rounded-full overflow-hidden border border-[#334155]/50 relative">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-[#2563eb] to-[#3b82f6]"
                                                            style={{ width: `${t.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Planetary Table */}
                                <div className="bg-[#1e293b]/80 backdrop-blur-md border border-[#334155] rounded-2xl p-6 shadow-xl">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#f8fafc]">
                                        <LayoutDashboard className="w-5 h-5 text-[#2563eb]" />
                                        Planetary Positions & Strength
                                    </h3>
                                    {/* Table logic... */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="text-[#94a3b8] text-xs uppercase tracking-wider">
                                                <tr><th className="p-2">Planet</th><th className="p-2">Sign</th><th className="p-2">Strength</th></tr>
                                            </thead>
                                            <tbody>
                                                {kundali.planets.map(p => (
                                                    <tr key={p.name} className="border-b border-white/5">
                                                        <td className="p-2 text-white">{p.name}</td>
                                                        <td className="p-2 text-blue-200">{getSignName(p.sign)}</td>
                                                        <td className="p-2 text-gray-400">{Math.round(p.strength)}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Cosmic View */}
                                <div className="mb-8 rounded-2xl overflow-hidden border border-[#334155] shadow-2xl">
                                    <CosmicView kundali={kundali} />
                                </div>

                                {/* Analysis Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <HoloCard className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl">
                                        <h4 className="text-blue-300 font-bold mb-2">Core Self</h4>
                                        <p className="text-sm text-gray-400">With {kundali.planets[0].name} dominant, you possess a drive for expression.</p>
                                    </HoloCard>
                                    <HoloCard className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl">
                                        <h4 className="text-blue-300 font-bold mb-2">Emotional World</h4>
                                        <p className="text-sm text-gray-400">Your emotional landscape is colored by {kundali.planets[1].sign}.</p>
                                    </HoloCard>
                                    <HoloCard className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl">
                                        <h4 className="text-blue-300 font-bold mb-2">Growth Path</h4>
                                        <p className="text-sm text-gray-400">Balance your inner dualities for integration.</p>
                                    </HoloCard>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'chat' && (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <ChatBox kundali={kundali} details={birthDetails} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};
