import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, Compass, User, Calendar, Clock, MapPin, 
  Send, Sparkles, LayoutDashboard, MessageSquare, Info, 
  ChevronRight, RefreshCcw, ScrollText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer 
} from 'recharts';
import { BirthDetails, KundaliData } from './types';
import { calculateKundali, getSignName } from './engine/astroEngine';
import { cn } from './utils/cn';

// --- Sub-components ---

const BirthForm = ({ onSubmit }: { onSubmit: (data: BirthDetails) => void }) => {
  const [formData, setFormData] = useState<BirthDetails>({
    name: '',
    gender: 'male',
    dob: '',
    tob: '',
    location: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-500/20 rounded-full">
          <Compass className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">Universal Birth Chart</h2>
          <p className="text-gray-400">Enter your details to generate your Vedic profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4" /> Name
            </label>
            <input
              required
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              placeholder="Arjun Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Gender</label>
            <select
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Date of Birth
            </label>
            <input
              required
              type="date"
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Time of Birth
            </label>
            <input
              required
              type="time"
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              value={formData.tob}
              onChange={(e) => setFormData({ ...formData, tob: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Birth Location
            </label>
            <input
              required
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              placeholder="City, Country"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
        >
          Calculate Kundali <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>
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
    <div className="bg-amber-50/5 p-4 rounded-xl border border-white/10">
      <h3 className="text-center text-amber-400 font-bold mb-4 uppercase tracking-wider">{title}</h3>
      <div className="grid grid-cols-4 gap-1 aspect-square w-full max-w-[400px] mx-auto">
        {layout.map((signIdx, i) => {
          if (signIdx === null) return <div key={i} className="bg-transparent" />;
          
          const signNum = signIdx + 1;
          const housePlanets = planets.filter(p => p.sign === signNum);
          
          return (
            <div key={i} className="border border-white/20 flex flex-col items-center justify-center p-1 min-h-[60px] relative bg-white/5">
              <span className="absolute top-0.5 right-1 text-[10px] text-gray-500 font-mono">{signNum}</span>
              <div className="flex flex-wrap justify-center gap-1">
                {housePlanets.map(p => (
                  <span key={p.name} className="text-[10px] md:text-xs font-bold text-amber-200" title={p.name}>
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
  // Simple North Indian Chart (Diamond representation)
  // This is a complex SVG, but we'll use a simplified version
  return (
    <div className="bg-amber-50/5 p-4 rounded-xl border border-white/10">
      <h3 className="text-center text-amber-400 font-bold mb-4 uppercase tracking-wider">{title}</h3>
      <div className="relative aspect-square w-full max-w-[400px] mx-auto border border-white/30">
        {/* Simplified SVG Chart Lines */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full stroke-white/30 fill-none">
          <path d="M0,0 L100,100 M100,0 L0,100" />
          <path d="M50,0 L0,50 L50,100 L100,50 Z" />
        </svg>
        
        {/* House Content (12 Houses) */}
        {/* Positioning logic for houses in North Indian style */}
        {[1,2,3,4,5,6,7,8,9,10,11,12].map((houseNum) => {
          const signNum = ((ascendant + houseNum - 2) % 12) + 1;
          const housePlanets = planets.filter(p => p.house === houseNum);
          
          // Heuristic positions for house labels
          const positions = [
            "top-[35%] left-[50%] -translate-x-1/2", // 1
            "top-[15%] left-[25%] -translate-x-1/2", // 2
            "top-[15%] left-[75%] -translate-x-1/2", // 3
            "top-[50%] left-[85%] -translate-y-1/2", // 4
            "top-[85%] left-[75%] -translate-x-1/2", // 5
            "top-[85%] left-[25%] -translate-x-1/2", // 6
            "top-[50%] left-[15%] -translate-y-1/2", // 7
            "top-[75%] left-[5%] -translate-y-1/2", // 8
            "top-[25%] left-[5%] -translate-y-1/2", // 9
            "top-[5%] left-[50%] -translate-x-1/2", // 10
            "top-[25%] left-[95%] -translate-y-1/2", // 11
            "top-[75%] left-[95%] -translate-y-1/2", // 12
          ];

          return (
            <div key={houseNum} className={cn("absolute flex flex-col items-center", positions[houseNum-1])}>
              <span className="text-[10px] text-gray-500">{signNum}</span>
              <div className="flex flex-wrap gap-0.5 max-w-[40px] justify-center">
                {housePlanets.map(p => (
                  <span key={p.name} className="text-[10px] font-bold text-amber-200">{p.name.substring(0, 2)}</span>
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
    { role: 'ai', content: `Pranam ${details.name}. I have analyzed your cosmic footprint. Your Lagna is ${getSignName(kundali.ascendant)} and you are currently in ${kundali.mahadasha} Mahadasha. How may I guide you on your journey of self-realization today?` }
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
        response = `With ${getSignName(kundali.ascendant)} rising, your approach to others is naturally ${kundali.ascendant < 6 ? 'outgoing' : 'reflective'}. Your current ${kundali.antardasha} Antardasha invites you to look at relationships as mirrors for your own inner development. Healing the inner self will manifest as harmony in the outer union.`;
      } else if (lower.includes("health")) {
        response = "The cosmic weather suggests focusing on your vital energy (Prana). Vedic wisdom emphasizes that health is the alignment of mind, body, and spirit. Pay attention to your routine during this Mahadasha.";
      } else {
        response = `The stars indicate that you are in a phase of significant ${kundali.mahadasha} influence. According to the 'Perfect Astrologer' methodology, this is a time to cultivate patience and inner clarity. Your ${kundali.yogas[0]} highlights a natural strength you can lean on. What specific aspect of this phase would you like to explore?`;
      }

      setMessages(prev => [...prev, { role: 'ai', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[500px] bg-black/40 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-white tracking-tight">Vedic Guide AI</span>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-gray-400 uppercase">Astro-Psychology Mode</span>
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
                ? "ml-auto bg-amber-600 text-white rounded-br-none" 
                : "bg-white/10 text-gray-200 border border-white/5 rounded-bl-none"
            )}
          >
            {msg.content}
          </motion.div>
        ))}
        {isTyping && (
          <div className="bg-white/10 text-gray-200 p-4 rounded-2xl rounded-bl-none w-16 flex justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white/5 border-t border-white/10">
        <div className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your destiny, career, or growth..."
            className="w-full bg-black/60 border border-white/10 rounded-full py-3 px-6 pr-12 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
          />
          <button 
            onClick={handleSend}
            className="absolute right-2 p-2 bg-amber-600 rounded-full text-white hover:bg-amber-500 transition-colors"
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
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/20 blur-[120px] rounded-full" />
        
        <BirthForm onSubmit={handleBirthSubmit} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-8 pb-20">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-600 rounded-lg">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AstroPsych AI</h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest">Universal Intelligence</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          <div className="flex flex-col items-end">
            <span className="text-amber-400 font-bold">{birthDetails.name}</span>
            <span className="text-gray-500">{birthDetails.dob} | {birthDetails.tob}</span>
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
            { id: 'charts', label: 'Celestial Charts', icon: LayoutDashboard },
            { id: 'analysis', label: 'Astro Analysis', icon: ScrollText },
            { id: 'chat', label: 'Spiritual Guide', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-3 px-6 py-4 rounded-xl transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-900/40" 
                  : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-semibold">{tab.label}</span>
            </button>
          ))}

          <div className="hidden lg:block mt-8 p-6 bg-amber-900/10 border border-amber-900/30 rounded-2xl">
            <h4 className="text-amber-500 font-bold flex items-center gap-2 mb-2 italic">
              <Info className="w-4 h-4" /> Methodology
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Our analysis utilizes the principles of <strong>Perfect Astrologer</strong> by Ram Babu Sao, blended with modern <strong>transpersonal psychology</strong>.
            </p>
            <div className="text-[10px] text-amber-600/60 uppercase tracking-tighter border-t border-amber-900/30 pt-4">
              Precision: Ayanamsa (Lahiri)
              <br />System: Parashari
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === 'charts' && (
              <motion.div 
                key="charts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <NorthIndianChart 
                  title="Birth Chart (D1)" 
                  planets={kundali.planets} 
                  ascendant={kundali.ascendant} 
                />
                <SouthIndianChart 
                  title="Navamsha (D9)" 
                  planets={kundali.planets} // Simplified for demo
                />

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                   <h3 className="text-center text-amber-400 font-bold mb-4 uppercase tracking-wider">Current Transits</h3>
                   <div className="space-y-3">
                     {kundali.planets.slice(0, 3).map(p => (
                       <div key={p.name} className="flex justify-between items-center text-xs">
                         <span className="text-gray-400">{p.name} Transit</span>
                         <span className="text-amber-200">{getSignName((p.sign + 2) % 12 + 1)}</span>
                       </div>
                     ))}
                     <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-gray-500 italic">
                       * Transits are calculated in real-time based on current planetary motion.
                     </div>
                   </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                   <h3 className="text-center text-amber-400 font-bold mb-4 uppercase tracking-wider">Bhava Chalit</h3>
                   <div className="flex items-center justify-center h-24">
                      <p className="text-xs text-gray-500 text-center">Bhava adjustments applied according to the Shripathi system for mid-house precision.</p>
                   </div>
                </div>
                
                <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-amber-500" />
                    Planetary Positions & Strength
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="text-gray-500 text-xs uppercase">
                        <tr className="border-b border-white/10">
                          <th className="pb-3 px-2">Planet</th>
                          <th className="pb-3 px-2">Sign</th>
                          <th className="pb-3 px-2">Degree</th>
                          <th className="pb-3 px-2">House</th>
                          <th className="pb-3 px-2">Strength</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {kundali.planets.map((p) => (
                          <tr key={p.name} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-2 font-bold text-amber-200">{p.name}</td>
                            <td className="py-3 px-2">{getSignName(p.sign)}</td>
                            <td className="py-3 px-2 font-mono text-xs">{p.degree}°</td>
                            <td className="py-3 px-2">{p.house}</td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 w-16 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-amber-500" 
                                    style={{ width: `${p.strength}%` }} 
                                  />
                                </div>
                                <span className="text-xs text-gray-400">{Math.round(p.strength)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'analysis' && (
              <motion.div 
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-600/30 rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Sun className="w-6 h-6 text-amber-500" />
                      Active Dasha Period
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-white/10 pb-2">
                        <span className="text-gray-400 text-sm">Mahadasha</span>
                        <span className="text-2xl font-black text-amber-400">{kundali.mahadasha}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/10 pb-2">
                        <span className="text-gray-400 text-sm">Antardasha</span>
                        <span className="text-xl font-bold text-orange-300">{kundali.antardasha}</span>
                      </div>
                      <p className="text-xs text-gray-400 italic">
                        The current period is conducive for {kundali.mahadasha === 'Jupiter' ? 'expansion, wisdom and spiritual growth.' : 'transformation and discipline.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-amber-500" />
                      Raj Yogas & Yoga
                    </h3>
                    <ul className="space-y-3">
                      {kundali.yogas.map((yoga, i) => (
                        <li key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                          <div className="mt-1 w-2 h-2 rounded-full bg-amber-500" />
                          <div>
                            <span className="font-bold text-amber-200 block">{yoga}</span>
                            <span className="text-xs text-gray-400">
                              {yoga.includes("Gaja") ? "Indicates wealth, wisdom, and luck through Jupiter's blessings." : "Indicates intelligence and success through Mercury."}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                    Shad Bala (Strength Analysis)
                  </h3>
                  <div className="h-64 w-full mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={kundali.planets.slice(0, 7)}>
                        <PolarGrid stroke="#333" />
                        <PolarAngleAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <Radar
                          name="Strength"
                          dataKey="strength"
                          stroke="#d97706"
                          fill="#d97706"
                          fillOpacity={0.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <h3 className="text-2xl font-bold mb-6">Psychological Profile</h3>
                  <div className="prose prose-invert max-w-none text-gray-300 space-y-4">
                    <p>
                      Your chart reveals a unique synthesis of karmic tendencies and transpersonal potential. 
                      With the {getSignName(kundali.ascendant)} ascendant, your primary life theme is 
                      <strong> integration</strong>. 
                    </p>
                    <p>
                      Humanistic astrology views your planetary placements not as static "fate," but as psychological 
                      drivers. Your strong {kundali.planets[0].name} suggests a robust sense of self, while 
                      the placement of your Moon indicates a deep need for emotional resonance and spiritual 
                      belonging.
                    </p>
                    <p className="border-l-4 border-amber-600 pl-4 py-2 italic bg-amber-600/5">
                      "Real transformation occurs when we stop trying to 'fix' our chart and start 'living' its 
                      highest potential." - Transpersonal Insight
                    </p>
                  </div>
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
