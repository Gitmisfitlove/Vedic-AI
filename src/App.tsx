import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChevronDown,
  MapPin,
  LayoutDashboard,
  Sun,
  Activity,
  Clock,
  Brain,
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import type { BirthDetails, KundaliData } from './types';
import { CosmicView } from './components/CosmicView';
import { HoloCard } from './components/HoloCard';
import { calculateKundali, getSignName } from './engine/astroEngine';
import { cn } from './utils/cn';



// --- Sub-components ---

const Starfield = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const stars = Array.from({ length: 1500 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5, // Varied sizes for depth
      baseX: 0,
      baseY: 0,
      opacity: Math.random() * 0.5 + 0.3 // Twinkle effect base
    })).map(s => ({ ...s, baseX: s.x, baseY: s.y }));

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.fillStyle = '#020617'; // Deep space background
      ctx.fillRect(0, 0, width, height);

      stars.forEach(star => {
        // Black Hole / Lensing Effect
        const dx = mouseRef.current.x - star.baseX;
        const dy = mouseRef.current.y - star.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Repulsion/Lensing radius
        const maxDist = 200;
        let x = star.baseX;
        let y = star.baseY;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          const angle = Math.atan2(dy, dx);
          // Stronger, non-linear warp for "Event Horizon" feel
          const moveDist = Math.pow(force, 2) * 50;
          x += Math.cos(angle) * moveDist;
          y += Math.sin(angle) * moveDist;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

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

const HybridTimePicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [showPicker, setShowPicker] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const generateTime = (h: number, m: number, ampm: string) => {
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        required
        type="text"
        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-[#f8fafc] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#94a3b8]"
        placeholder="10:00 AM"
        value={value}
        onChange={handleChange}
        onFocus={() => setShowPicker(true)}
      />
      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute z-50 w-72 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50 p-4 right-0 flex gap-4"
          >
            {/* Hours */}
            <div className="flex-1 h-48 overflow-y-auto custom-scrollbar">
              <div className="text-[10px] text-[#94a3b8] mb-1 text-center uppercase tracking-wider font-bold">Hour</div>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                <button key={h} type="button"
                  className="w-full py-1 text-sm text-[#e2e8f0] hover:bg-[#2563eb]/20 rounded mb-1 transition-colors"
                  onClick={() => onChange(generateTime(h, parseInt(value.split(':')[1] || '0'), value.includes('PM') ? 'PM' : 'AM'))}
                >
                  {h}
                </button>
              ))}
            </div>
            {/* Minutes */}
            <div className="flex-1 h-48 overflow-y-auto custom-scrollbar">
              <div className="text-[10px] text-[#94a3b8] mb-1 text-center uppercase tracking-wider font-bold">Min</div>
              {Array.from({ length: 60 }, (_, i) => i).map(m => (
                <button key={m} type="button"
                  className="w-full py-1 text-sm text-[#e2e8f0] hover:bg-[#2563eb]/20 rounded mb-1 transition-colors"
                  onClick={() => {
                    const [hStr] = value.split(':');
                    const h = parseInt(hStr) || 12;
                    onChange(generateTime(h, m, value.includes('PM') ? 'PM' : 'AM'))
                  }}
                >
                  {m.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
            {/* AM/PM */}
            <div className="flex flex-col gap-2 justify-center border-l border-white/5 pl-2">
              {['AM', 'PM'].map(p => (
                <button key={p} type="button"
                  className={cn("px-2 py-1 rounded text-xs font-bold transition-all", value.includes(p) ? "bg-[#2563eb] text-white shadow-lg" : "bg-[#0f172a] text-[#94a3b8] hover:bg-white/5")}
                  onClick={() => onChange(value.replace(/AM|PM/g, p).trim() || `12:00 ${p}`)}
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    // Reset lat/lon on manual type to force selection
    onChange(val, 0, 0);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length > 2) {
      setLoading(true);
      debounceRef.current = setTimeout(() => {
        searchLocation(val);
      }, 500); // Debounce API calls
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
            // Visual feedback for validation state
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
  const [viewDate, setViewDate] = useState(new Date()); // Tracks the month/year being viewed
  const [viewMode, setViewMode] = useState<'days' | 'years'>('days');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initialize viewDate from value if valid
  useEffect(() => {
    if (value && value.length === 10) {
      const [m, d, y] = value.split('/').map(Number);
      if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
        setViewDate(new Date(y, m - 1, 1));
      }
    }
  }, [showCalendar]); // Only reset when opening

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
        onFocus={() => setShowCalendar(false)} // Don't auto-open on focus if typing
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
            {/* Calendar Header */}
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

            {/* Calendar Body */}
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

  useEffect(() => {
    fetch('/api/profiles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSavedProfiles(data);
        }
      })
      .catch(err => console.error("Error fetching profiles:", err));
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveProfile = async () => {
    // 1. Validate Name
    if (!formData.name || formData.name.trim().length < 2) {
      showToast("Please enter a valid name.", "error");
      return;
    }
    // 2. Validate Gender
    if (!['male', 'female', 'other'].includes(formData.gender)) {
      showToast("Please select a valid gender.", "error");
      return;
    }
    // 3. Validate DOB (Simple regex check for MM/DD/YYYY)
    const dobRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!dobRegex.test(formData.dob)) {
      showToast("Please enter a valid full date (MM/DD/YYYY).", "error");
      return;
    }
    // 4. Validate TOB
    if (!formData.tob || !formData.tob.match(/\d{1,2}:\d{2}\s?(AM|PM)/)) {
      showToast("Please enter a valid time (e.g., 10:00 AM).", "error");
      return;
    }
    // 5. Strict Validation for Location
    if (!formData.lat || !formData.lon) {
      showToast("Please search and select a valid location from the list.", "error");
      return;
    }

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        // Optimistically update or fetch again
        const newProfiles = [...savedProfiles.filter(p => p.name !== formData.name), formData];
        setSavedProfiles(newProfiles);
        showToast('Profile saved successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to save profile.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to server.', 'error');
    }
  };

  const loadProfile = (profile: BirthDetails) => {
    // Handle legacy ISO format dates (YYYY-MM-DD) -> convert to MM/DD/YYYY
    let displayDob = profile.dob;
    if (profile.dob.includes('-')) {
      const [y, m, d] = profile.dob.split('-');
      displayDob = `${m}/${d}/${y}`;
    }
    setFormData({ ...profile, dob: displayDob });
  };

  const deleteProfile = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const newProfiles = savedProfiles.filter(p => p.name !== name);
        setSavedProfiles(newProfiles);
      }
    } catch (err) {
      console.error(err);
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

    // STRICT VALIDATION ON SUBMIT
    // 1. Validate Name
    if (!formData.name || formData.name.trim().length < 2) {
      showToast("Please enter a valid name to proceed.", "error");
      return;
    }
    // 2. Validate DOB
    const dobRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!dobRegex.test(formData.dob)) {
      showToast("Please enter a valid full date (MM/DD/YYYY).", "error");
      return;
    }
    // 3. Validate TOB
    if (!formData.tob || !formData.tob.match(/\d{1,2}:\d{2}\s?(AM|PM)/)) {
      showToast("Please enter a valid time (e.g., 10:00 AM).", "error");
      return;
    }
    // 4. Validate Location
    if (!formData.lat || !formData.lon) {
      showToast("Please search and select a valid location to proceed.", "error");
      return;
    }

    setIsSubmitting(true);

    // Simulated "Calculations" delay for the loader
    // "Calculations" delay optimized to 1.5s
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4" /> Name
            </label>
            <input
              required
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3.5 text-slate-200 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-500 hover:border-blue-500/30"
              placeholder="Arjun Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <CustomDatePicker
              value={formData.dob}
              onChange={(val) => setFormData({ ...formData, dob: val })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#94a3b8] flex items-center gap-2">
              <Clock className="w-4 h-4" /> Time of Birth
            </label>
            <HybridTimePicker
              value={formData.tob}
              onChange={(val) => setFormData({ ...formData, tob: val })}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-[#94a3b8] flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Birth Location
            </label>
            <LocationInput
              value={formData.location}
              onChange={(val, lat, lon) => setFormData({ ...formData, location: val, lat, lon })}
            />
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
            title="Reset Form"
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
            <User className="w-4 h-4" /> Saved Profiles
          </h3>
          <div className="grid gap-3">
            {savedProfiles.map(p => (
              <div
                key={p.name}
                className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 hover:border-amber-500/30 hover:bg-white/10 transition-all cursor-pointer group"
                onClick={() => loadProfile(p)}
              >
                <div>
                  <div className="font-bold text-white text-sm">{p.name}</div>
                  <div className="text-[10px] text-gray-500">{p.dob} | {p.location}</div>
                </div>
                <button
                  onClick={(e) => deleteProfile(p.name, e)}
                  className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors opacity-60 group-hover:opacity-100"
                  title="Delete Profile"
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

const SouthIndianChart = ({ planets, title }: { planets: any[], title: string }) => {
  // Mapping for South Indian chart layout (clockwise from Pisces/Top-Left)
  const layout = [
    11, 0, 1, 2,
    10, null, null, 3,
    9, null, null, 4,
    8, 7, 6, 5
  ];

  return (
    <div className="bg-slate-900/50 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 shadow-lg">
      <h3 className="text-center text-blue-400 font-bold mb-4 uppercase tracking-wider flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4" /> {title}
      </h3>
      <div className="grid grid-cols-4 gap-1 aspect-square w-full max-w-[400px] mx-auto">
        {layout.map((signIdx, i) => {
          if (signIdx === null) return <div key={i} className="bg-transparent" />;

          const signNum = signIdx + 1;
          const housePlanets = planets.filter(p => p.sign === signNum);

          return (
            <div key={i} className="border border-[#334155] flex flex-col items-center justify-center p-1 min-h-[60px] relative bg-[#0f172a]">
              <span className="absolute top-0.5 right-1 text-[10px] text-[#94a3b8] font-mono">{signNum}</span>
              <div className="flex flex-wrap justify-center gap-1">
                {housePlanets.map(p => (
                  <span key={p.name} className="text-[10px] md:text-xs font-bold text-[#f8fafc]" title={p.name}>
                    {p.name.substring(0, 2)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
  // Remove unused imports (doing this via logic, but here updating the ChatBox first)
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: `Pranam ${details.name}. I have analyzed your cosmic footprint.Your Lagna is ${getSignName(kundali.ascendant)} and you are currently in ${kundali.dasha.currentMahadasha} Mahadasha.How may I guide you on your journey of self - realization today ? ` }
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

    // Simulate AI response based on Humanistic/Transpersonal Astrology
    setTimeout(() => {
      let response = "";
      const lower = userMsg.toLowerCase();

      if (lower.includes("career") || lower.includes("job")) {
        response = "In your chart, the 10th house and the position of Saturn suggest a period of structural growth. From a transpersonal perspective, this is not just about a job, but finding your 'Dharma'—the unique contribution you are meant to offer the world.";
      } else if (lower.includes("marriage") || lower.includes("love") || lower.includes("relationship")) {
        response = `With ${getSignName(kundali.ascendant)} rising, your approach to others is naturally ${kundali.ascendant < 6 ? 'outgoing' : 'reflective'}. Your current ${kundali.dasha.currentAntardasha} Antardasha invites you to look at relationships as mirrors for your own inner development.Healing the inner self will manifest as harmony in the outer union.`;
      } else if (lower.includes("health")) {
        response = "The cosmic weather suggests focusing on your vital energy (Prana). Vedic wisdom emphasizes that health is the alignment of mind, body, and spirit. Pay attention to your routine during this Mahadasha.";
      } else {
        response = `The stars indicate that you are in a phase of significant ${kundali.dasha.currentMahadasha} influence.According to the 'Perfect Astrologer' methodology, this is a time to cultivate patience and inner clarity.Your ${kundali.yogas[0]} highlights a natural strength you can lean on.What specific aspect of this phase would you like to explore ? `;
      }

      setMessages(prev => [...prev, { role: 'ai', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[500px] bg-[#1e293b] rounded-2xl border border-[#334155] overflow-hidden shadow-xl">
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

export const App = () => {
  const [birthDetails, setBirthDetails] = useState<BirthDetails | null>(null);
  const [kundali, setKundali] = useState<KundaliData | null>(null);
  const [activeTab, setActiveTab] = useState<'charts' | 'analysis' | 'chat'>('charts');

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
      <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans selection:bg-[#2563eb] selection:text-white flex items-center justify-center p-6 relative overflow-hidden">
        <Starfield />

        <BirthForm onSubmit={handleBirthSubmit} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans selection:bg-[#2563eb] selection:text-white p-4 md:p-8 pb-20 relative overflow-hidden">
      <Starfield />
      <div className="relative z-10">
        {/* Header */}
        <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#2563eb] rounded-lg">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 animate-shimmer">
                Project V <span className="text-sm text-slate-500 font-normal tracking-widest uppercase ml-2">AstroPsych AI</span>
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
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

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
              <div className="text-[10px] text-[#60a5fa]/60 uppercase tracking-tighter border-t border-[#334155] pt-4">
                Precision: Ayanamsa (Lahiri)
                <br />System: Parashari
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeTab === 'analysis' && (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Top Section: Charts & Transits */}
                  {/* Top Section: Charts & Transits */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <NorthIndianChart
                      title="Birth Chart (D1)"
                      planets={kundali.planets}
                      ascendant={kundali.ascendant}
                    />

                    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-blue-900/10 hover:border-blue-500/30 transition-all duration-500">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-center text-[#2563eb] font-bold uppercase tracking-wider">Current Transits</h3>
                        <span className="text-xs text-[#94a3b8] font-mono">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="space-y-4">
                        {(kundali.transits || []).map((t: any) => (
                          <div key={t.name} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-[#f8fafc] font-medium flex items-center gap-2">
                                {t.name} <span className="text-[#64748b]">in</span> {t.sign}
                              </span>
                              <span className="text-[#2563eb] font-mono">{t.degree.toFixed(1)}°</span>
                            </div>
                            <div className="h-1.5 bg-[#0f172a] rounded-full overflow-hidden border border-[#334155]/50 relative group">
                              <div
                                className="h-full bg-gradient-to-r from-[#2563eb] to-[#3b82f6] transition-all duration-1000"
                                style={{ width: `${t.progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-[#94a3b8]">
                              <span>{Math.round(t.daysRemaining)} days left</span>
                              <span>{(100 - t.progress).toFixed(1)}% remaining</span>
                            </div>
                          </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-[#334155]">
                          <p className="text-[10px] text-[#94a3b8] italic leading-relaxed">
                            * Real-time planetary ingress data based on sidereal calculations.
                            Progress bars indicate time until next sign change.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Section: Planetary Table */}
                  <div className="bg-[#1e293b]/80 backdrop-blur-md border border-[#334155] rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#f8fafc]">
                      <LayoutDashboard className="w-5 h-5 text-[#2563eb]" />
                      Planetary Positions & Strength
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="text-[#94a3b8] text-xs uppercase tracking-wider">
                          <tr className="border-b border-[#334155]">
                            <th className="text-left py-3 px-4 font-normal">Planet</th>
                            <th className="text-left py-3 px-4 font-normal">Sign</th>
                            <th className="text-left py-3 px-4 font-normal">Degree</th>
                            <th className="text-left py-3 px-4 font-normal">Dignity</th>
                            <th className="text-left py-3 px-4 font-normal">Nakshatra</th>
                            <th className="text-left py-3 px-4 font-normal w-24">Strength</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {kundali.planets.map((p) => (
                            <tr key={p.name} className="border-b border-[#334155]/50 last:border-0 hover:bg-[#2563eb]/10 transition-colors group">
                              <td className="py-3 px-4 font-bold text-[#e2e8f0] flex items-center gap-2">
                                <span className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">
                                  {p.name === 'Sun' ? '☉' : p.name === 'Moon' ? '☽' : p.name === 'Mars' ? '♂' :
                                    p.name === 'Mercury' ? '☿' : p.name === 'Jupiter' ? '♃' : p.name === 'Venus' ? '♀' :
                                      p.name === 'Saturn' ? '♄' : p.name === 'Rahu' ? '☊' : '☋'}
                                </span>
                                {p.name}
                              </td>
                              <td className="py-3 px-4 text-[#bfdbfe]">{getSignName(p.sign)}</td>
                              <td className="py-3 px-4 font-mono text-xs text-[#94a3b8]">{p.degree.toFixed(2)}°</td>
                              <td className="py-3 px-4">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${p.dignity === 'Exalted' || p.dignity === 'Own Sign' ? 'bg-amber-500/10 border-amber-500/50 text-amber-200' :
                                  p.dignity === 'Debilitated' ? 'bg-red-500/10 border-red-500/50 text-red-300' :
                                    'bg-[#334155]/50 border-[#475569] text-[#94a3b8]'
                                  }`}>
                                  {p.dignity || 'Neutral'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-[#94a3b8] text-xs">{p.nakshatra}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-1.5 w-24 bg-[#0f172a] rounded-full overflow-hidden shadow-inner">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#2563eb] to-[#60a5fa]"
                                      style={{ width: `${p.strength}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] w-8 text-right text-[#94a3b8] font-mono">{Math.round(p.strength)}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 3D Cosmic View */}
                  <div className="mb-8 rounded-2xl overflow-hidden border border-[#334155] shadow-2xl shadow-blue-900/20">
                    <CosmicView kundali={kundali} />
                  </div>

                  {/* Dosha Diagnosis Section (New) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {kundali.doshas?.map((dosha, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border ${dosha.present ? 'bg-red-500/10 border-red-500/50' : 'bg-green-500/10 border-green-500/50'} flex items-start gap-4`}>
                        <div className={`mt-1 p-2 rounded-full ${dosha.present ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`font-bold ${dosha.present ? 'text-red-200' : 'text-green-200'}`}>{dosha.name}</h4>
                          <p className="text-xs text-[#94a3b8] mt-1">{dosha.description}</p>
                          {dosha.present && dosha.remedy && (
                            <div className="mt-2 text-xs text-red-300 italic">
                              <strong>Remedy:</strong> {dosha.remedy}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Bio / Elements Card */}
                    {kundali.bio && (
                      <div className="md:col-span-2 bg-[#1e293b] border border-[#334155] p-4 rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs text-[#94a3b8]">Dominant Element</div>
                            <div className="text-sm font-bold text-[#e2e8f0]">{kundali.bio.element}</div>
                          </div>
                        </div>
                        <div className="h-8 w-[1px] bg-[#334155]" />
                        <div>
                          <div className="text-xs text-[#94a3b8]">Lucky Gem</div>
                          <div className="text-sm font-bold text-[#e2e8f0]">{kundali.bio.luckyGem}</div>
                        </div>
                        <div className="h-8 w-[1px] bg-[#334155]" />
                        <div>
                          <div className="text-xs text-[#94a3b8]">Color</div>
                          <div className="text-sm font-bold text-[#e2e8f0]">{kundali.bio.luckyColor}</div>
                        </div>
                      </div>
                    )}
                  </div>



                  {/* Bottom Section: Analysis (Dasha, Yogas, Psych) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Dasha Timeline Card */}
                    <div className="relative overflow-hidden bg-[#1e293b] border border-[#334155] rounded-2xl p-6 group hover:border-[#2563eb]/50 transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563eb]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                      <h3 className="relative z-10 text-xl font-bold mb-6 flex items-center gap-2 text-[#f8fafc]">
                        <Activity className="w-5 h-5 text-[#2563eb]" />
                        <div>
                          Vimshottari Dasha
                          <span className="block text-xs font-normal text-[#94a3b8] mt-0.5">Moon in {kundali.nakshatra}</span>
                        </div>
                      </h3>

                      <div className="relative z-10 space-y-6">
                        {/* Current Period */}
                        <div className="flex items-center justify-between p-4 bg-[#0f172a]/50 rounded-xl border border-[#334155]">
                          <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                              <div className="w-10 h-10 rounded-full bg-[#1e293b] border-2 border-[#334155] flex items-center justify-center text-xl shadow-lg" title={`Mahadasha: ${kundali.dasha.currentMahadasha}`}>
                                {kundali.dasha.currentMahadasha === 'Sun' ? '☉' : kundali.dasha.currentMahadasha === 'Moon' ? '☽' : kundali.dasha.currentMahadasha.charAt(0)}
                              </div>
                              <div className="w-10 h-10 rounded-full bg-[#2563eb] border-2 border-[#1e293b] flex items-center justify-center text-white text-lg shadow-lg z-10" title={`Antardasha: ${kundali.dasha.currentAntardasha}`}>
                                {kundali.dasha.currentAntardasha === 'Sun' ? '☉' : kundali.dasha.currentAntardasha === 'Moon' ? '☽' : kundali.dasha.currentAntardasha.charAt(0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-[#94a3b8]">Current Period</div>
                              <div className="font-bold text-[#e2e8f0]">{kundali.dasha.currentMahadasha} - {kundali.dasha.currentAntardasha}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-[#94a3b8]">{kundali.dasha.endDate}</div>
                            <div className="text-[10px] text-[#64748b] uppercase tracking-wide">Ends</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                            <span>{kundali.dasha.startDate}</span>
                            <span>Progress</span>
                          </div>
                          <div className="h-2 w-full bg-[#0f172a] rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-gradient-to-r from-[#2563eb] via-[#60a5fa] to-[#93c5fd]"
                              style={{ width: `${kundali.dasha.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Next Period */}
                        <div className="flex items-center gap-3 pt-4 border-t border-[#334155]/50">
                          <Clock className="w-4 h-4 text-[#2563eb]" />
                          <div className="text-xs text-[#94a3b8]">
                            Upcoming: <strong className="text-[#bfdbfe]">{kundali.dasha.nextAntardasha}</strong> starts on {kundali.dasha.nextAntardashaDate}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Yogas */}
                    <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#f8fafc]">
                        <Sparkles className="w-5 h-5 text-[#2563eb]" />
                        Raj Yogas & Strength
                      </h3>
                      <ul className="space-y-3 mb-6">
                        {kundali.yogas.map((yoga, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 rounded-lg border border-[#334155]/30 bg-[#2563eb]/5 hover:bg-[#2563eb]/10 transition-colors">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#60a5fa] shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                            <div>
                              <span className="font-bold text-[#bfdbfe] block text-sm">{yoga}</span>
                              <span className="text-[10px] text-[#94a3b8] leading-tight block mt-1">
                                {yoga.includes("Gaja") ? "Wealth, wisdom, & divine protection." : "Success through intellect & communication."}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {/* Mini Shad Bala Chart */}
                      <div className="h-32 w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={kundali.planets.slice(0, 5)}>
                            <Bar dataKey="strength" fill="#2563eb" radius={[2, 2, 0, 0]} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} tickLine={false} axisLine={false} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Psych Profile - Split Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3">
                      <h3 className="text-xl font-bold mb-4 text-[#f8fafc] flex items-center gap-2">
                        <Brain className="w-5 h-5 text-[#2563eb]" />
                        Hashtag Astrology Profile
                      </h3>
                    </div>

                    {/* Card 1: Core Self */}
                    <HoloCard className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-xl shadow-blue-900/10">
                      <div className="flex items-center gap-2 mb-3 text-[#bfdbfe]">
                        <span className="text-lg">☉</span>
                        <span className="font-bold text-sm uppercase tracking-wider">Core Self</span>
                      </div>
                      <p className="text-sm text-[#94a3b8] leading-relaxed">
                        With <strong>{kundali.planets[0].name}</strong> dominant, you possess a drive for {kundali.planets[0].name === 'Sun' ? 'authority' : 'expression'}.
                        Your journey is about discovering authentic power.
                      </p>
                    </HoloCard>

                    {/* Card 2: Emotional World */}
                    <HoloCard className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-xl shadow-blue-900/10">
                      <div className="flex items-center gap-2 mb-3 text-[#bfdbfe]">
                        <span className="text-lg">☽</span>
                        <span className="font-bold text-sm uppercase tracking-wider">Emotional World</span>
                      </div>
                      <p className="text-sm text-[#94a3b8] leading-relaxed">
                        Your emotional landscape is colored by the <strong>{kundali.planets[1].sign}</strong> sign, suggesting a need for
                        {kundali.planets[1].sign % 2 === 0 ? ' stability and grounding.' : ' spontaneity and flow.'}
                      </p>
                    </HoloCard>

                    {/* Card 3: Growth Path */}
                    <HoloCard className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-xl shadow-blue-900/10">
                      <div className="flex items-center gap-2 mb-3 text-[#bfdbfe]">
                        <span className="text-lg">♃</span>
                        <span className="font-bold text-sm uppercase tracking-wider">Growth Path</span>
                      </div>
                      <p className="text-sm text-[#94a3b8] leading-relaxed">
                        "The stars impel, they do not compel." Your chart indicates a powerful potential for integration once you balance your
                        inner dualities.
                      </p>
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
      </div >
    </div >
  );
};
