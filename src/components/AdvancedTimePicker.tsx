import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

interface AdvancedTimePickerProps {
    value: string;
    onChange: (val: string) => void;
}

export const AdvancedTimePicker = ({ value, onChange }: AdvancedTimePickerProps) => {
    const [showPicker, setShowPicker] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Internal state for popup selection
    const [selectedHour, setSelectedHour] = useState(10);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>('AM');

    // Parse value on mount/update to sync popup state
    useEffect(() => {
        const parseTime = (timeStr: string) => {
            const regex = /(\d{1,2}):(\d{2})\s?(AM|PM)/i;
            const match = timeStr.match(regex);
            if (match) {
                let h = parseInt(match[1], 10);
                const m = parseInt(match[2], 10);
                const ap = match[3].toUpperCase() as 'AM' | 'PM';
                if (h === 0) h = 12; // Handle strict 0 as 12 in 12h format logic if needed
                if (h > 12) h = 12;

                setSelectedHour(h);
                setSelectedMinute(m);
                setSelectedAmPm(ap);
            }
        };
        if (value) parseTime(value);
    }, [value, showPicker]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper to construct time string
    const formatTime = (h: number, m: number, ap: string) => {
        return `${h}:${m.toString().padStart(2, '0')} ${ap}`;
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        const nativeEvent = e.nativeEvent as InputEvent;
        const inputType = nativeEvent.inputType; // 'insertText', 'deleteContentBackward'

        // Allow backspace
        if (inputType === 'deleteContentBackward') {
            onChange(val);
            return;
        }

        // 1. Filter invalid chars (digits, a, p, m, space, :)
        val = val.replace(/[^0-9apmAPM\s:]/g, '');

        // 2. Smart Masking Logic
        const digits = val.replace(/\D/g, ''); // Extract just numbers so far

        // Case: Typing hour
        if (digits.length === 1) {
            const h = parseInt(digits);
            if (h > 1) {
                // Auto-advance: 2 -> 02:
                val = `0${h}:`;
            } else {
                // Wait for next digit (0 or 1)
                val = digits;
            }
        }
        else if (digits.length === 2 && !val.includes(':')) {
            // 10 -> 10:
            val = `${digits}:`;
        }
        else if (digits.length > 2 && !val.includes(':')) {
            // 041 -> 04:1 (Recovery if colon deleted)
            val = `${digits.slice(0, 2)}:${digits.slice(2)}`;
        }

        // Case: Typing minutes
        if (val.includes(':')) {
            const [, mStr] = val.split(':');
            if (mStr && mStr.length === 1 && parseInt(mStr) > 5) {
                // Invalid minute start (60-99 not allowed)
                // Block this logic or simple validation could go here
            }
        }

        // Case: Shortcuts for AM/PM
        if (val.match(/a/i)) {
            val = val.replace(/a/i, '').trim() + ' AM';
        } else if (val.match(/p/i)) {
            val = val.replace(/p/i, '').trim() + ' PM';
        }

        // Enforce max length (04:15 AM) = 8 chars
        if (val.length > 8) val = val.slice(0, 8);

        onChange(val);
    };

    const commitSelection = (h: number, m: number, ap: string) => {
        const newVal = formatTime(h, m, ap);
        onChange(newVal);
        // Don't close immediately, let user refine
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    required
                    type="text"
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-[#f8fafc] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all placeholder:text-[#94a3b8]"
                    placeholder="10:00 AM"
                    value={value}
                    onChange={handleInput}
                    onFocus={() => setShowPicker(true)}
                />
                <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#2563eb] transition-colors"
                >
                    <Clock className="w-5 h-5" />
                </button>
            </div>

            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute z-50 left-0 mt-2 w-full max-w-[320px] bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-[#0f172a] p-4 border-b border-[#334155] flex justify-center items-center gap-2">
                            <div className="text-3xl font-bold tracking-wider text-[#f8fafc] w-12 text-center">{selectedHour.toString().padStart(2, '0')}</div>
                            <div className="text-3xl font-bold text-[#64748b]">:</div>
                            <div className="text-3xl font-bold tracking-wider text-[#f8fafc] w-12 text-center">{selectedMinute.toString().padStart(2, '0')}</div>
                            <div className="text-xl font-medium text-[#2563eb] ml-2">{selectedAmPm}</div>
                        </div>

                        {/* Columns Container */}
                        <div className="flex h-56 relative divide-x divide-[#334155]/50">
                            {/* Selection Highlight Bar */}
                            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-10 bg-[#2563eb]/10 pointer-events-none border-y border-[#2563eb]/30" />

                            {/* Hours */}
                            <div className="flex-1 overflow-y-auto scrollbar-hide py-20 snap-y snap-mandatory relative text-center">
                                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2].map((h, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setSelectedHour(h);
                                            commitSelection(h, selectedMinute, selectedAmPm);
                                        }}
                                        className={cn(
                                            "snap-center h-10 flex items-center justify-center w-full text-lg font-medium transition-colors hover:text-[#2563eb]",
                                            h === selectedHour ? "text-[#2563eb] scale-110" : "text-[#94a3b8] opacity-50"
                                        )}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>

                            {/* Minutes */}
                            <div className="flex-1 overflow-y-auto scrollbar-hide py-20 snap-y snap-mandatory relative text-center">
                                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            setSelectedMinute(m);
                                            commitSelection(selectedHour, m, selectedAmPm);
                                        }}
                                        className={cn(
                                            "snap-center h-10 flex items-center justify-center w-full text-lg font-medium transition-colors hover:text-[#2563eb]",
                                            m === selectedMinute ? "text-[#2563eb] scale-110" : "text-[#94a3b8] opacity-50"
                                        )}
                                    >
                                        {m.toString().padStart(2, '0')}
                                    </button>
                                ))}
                            </div>

                            {/* AM/PM */}
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#0f172a]/30">
                                {['AM', 'PM'].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => {
                                            setSelectedAmPm(p as 'AM' | 'PM');
                                            commitSelection(selectedHour, selectedMinute, p as 'AM' | 'PM');
                                        }}
                                        className={cn(
                                            "px-4 py-2 rounded-lg font-bold transition-all",
                                            selectedAmPm === p
                                                ? "bg-[#2563eb] text-white shadow-lg shadow-blue-900/50"
                                                : "text-[#94a3b8] hover:bg-white/5"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer / Done Button */}
                        <div className="p-3 border-t border-[#334155] flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowPicker(false)}
                                className="px-6 py-2 bg-[#2563eb] text-white rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors shadow-lg"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
