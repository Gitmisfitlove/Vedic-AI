import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const AuthLanding = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-200">
            {/* Note: Starfield should be mounted in App.tsx as background, so here we just have transparent layout */}

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl relative z-10 mx-4"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                        <Sparkles className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Cosmic Footprint
                    </h1>
                    <p className="text-slate-400 text-sm mt-2">Unlock the secrets of your stars</p>
                </div>

                <AnimatePresence mode="wait">
                    {isLogin ? (
                        <LoginForm key="login" onSwitch={() => setIsLogin(false)} />
                    ) : (
                        <SignUpForm key="signup" onSwitch={() => setIsLogin(true)} />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

const LoginForm = ({ onSwitch }: { onSwitch: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);

            // Admin Credential Hack for Testing
            if (email === 'admin' && password === 'admin') {
                // Try to login as admin@vedic.ai / admin123
                try {
                    await login('admin@vedic.ai', 'admin123');
                    navigate('/');
                    return;
                } catch (adminErr: any) {
                    if (adminErr.code === 'auth/user-not-found' || adminErr.code === 'auth/invalid-credential') {
                        // If admin doesn't exist, create it (once)? Or just tell user to sign up?
                        throw new Error("Admin test user not set up. Please Sign Up first.");
                    }
                    throw adminErr;
                }
            }

            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError('Failed to log in. Check your credentials.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="text-xl font-semibold mb-6 text-center">Welcome Back</h2>
            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm flex gap-2 items-center"><AlertCircle className="w-4 h-4" />{error}</div>}

            <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
                <input
                    type="email"
                    required
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all pr-10"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <button
                disabled={loading}
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex justify-center items-center gap-2 group mt-4"
            >
                {loading ? "Logging In..." : <>Log In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
            </button>

            <div className="text-center mt-6 text-sm text-slate-400">
                Don't have an account? <button type="button" onClick={onSwitch} className="text-blue-400 hover:text-blue-300 font-semibold underline decoration-transparent hover:decoration-blue-400 transition-all">Sign Up</button>
            </div>
        </motion.form>
    );
};

const SignUpForm = ({ onSwitch }: { onSwitch: () => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password);
            navigate('/');
        } catch (err: any) {
            setError('Failed to create account. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="text-xl font-semibold mb-6 text-center">Create Account</h2>
            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm flex gap-2 items-center"><AlertCircle className="w-4 h-4" />{error}</div>}

            <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
                <input
                    type="email"
                    required
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all pr-10"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <input
                    type="password"
                    required
                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                />
            </div>

            <button
                disabled={loading}
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex justify-center items-center gap-2 group mt-4"
            >
                {loading ? "Creating..." : <>Sign Up <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
            </button>

            <div className="text-center mt-6 text-sm text-slate-400">
                Already have an account? <button type="button" onClick={onSwitch} className="text-blue-400 hover:text-blue-300 font-semibold underline decoration-transparent hover:decoration-blue-400 transition-all">Log In</button>
            </div>
        </motion.form>
    );
};
