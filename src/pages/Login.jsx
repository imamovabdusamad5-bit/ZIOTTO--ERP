import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    LogIn, 
    Lock, 
    User, 
    Eye, 
    EyeOff, 
    Activity, 
    ShieldCheck, 
    BarChart3, 
    Zap, 
    Users, 
    Shield, 
    X, 
    CircleAlert
} from 'lucide-react';

const ProErpLogo = ({ className = "w-16 h-16" }) => (
    <svg className={`${className} filter drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="hexGrad1" x1="30%" y1="10%" x2="70%" y2="90%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#4facfe" />
            </linearGradient>
            <linearGradient id="hexGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#1d4ed8" />
                <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="hexGrad3" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
        </defs>
        <g strokeLinecap="round" strokeLinejoin="round">
            {/* Left face */}
            <path d="M50 10 L18 28 L18 64 L30 71 L30 35 L50 24 Z" fill="url(#hexGrad2)" />
            {/* Top-Right face */}
            <path d="M50 10 L82 28 L82 46 L70 53 L70 35 L50 24 Z" fill="url(#hexGrad1)" />
            {/* Bottom-Right face / leg */}
            <path d="M70 53 L82 46 L82 64 L50 82 L18 64 L30 57 L50 68 L70 57 Z" fill="url(#hexGrad3)" />
            {/* Inner P Loop */}
            <path d="M50 24 L70 35 L70 53 L50 64 L30 53 L30 42 L50 53 L50 36 L30 35 Z" fill="url(#hexGrad1)" opacity="0.9" />
            {/* Extra glowing lines for 3D accent */}
            <path d="M50 10 L50 24" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
            <path d="M18 28 L30 35" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
            <path d="M82 28 L70 35" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
            <path d="M30 71 L50 82" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
        </g>
    </svg>
);

const Login = () => {
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error: loginError } = await login(username.toUpperCase(), code);
            if (loginError) throw loginError;
            navigate('/');
        } catch (err) {
            setError(err.message || 'Ism yoki kod noto\'g\'ri');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] flex font-sans overflow-hidden relative text-white">
            
            {/* Tech World Map & Network Grid Background */}
            <div className="absolute inset-0 z-0 opacity-25 pointer-events-none overflow-hidden select-none">
                <svg className="w-full h-full min-w-[1200px]" viewBox="0 0 1000 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    {/* Glow behind panels */}
                    <circle cx="250" cy="300" r="300" fill="url(#bgGlow)" />
                    <circle cx="750" cy="300" r="300" fill="url(#bgGlow)" />
                    
                    {/* Abstract network nodes and lines */}
                    <g stroke="#1d4ed8" strokeWidth="0.5" opacity="0.3" strokeDasharray="3 3">
                        {/* Grid Lines */}
                        <path d="M0 100 L1000 100" />
                        <path d="M0 200 L1000 200" />
                        <path d="M0 300 L1000 300" />
                        <path d="M0 400 L1000 400" />
                        <path d="M0 500 L1000 500" />
                        <path d="M150 0 L150 600" />
                        <path d="M300 0 L300 600" />
                        <path d="M450 0 L450 600" />
                        <path d="M600 0 L600 600" />
                        <path d="M750 0 L750 600" />
                        <path d="M900 0 L900 600" />
                    </g>
                    
                    {/* Connections */}
                    <g stroke="#00f2fe" strokeWidth="0.75" opacity="0.5">
                        <line x1="150" y1="200" x2="300" y2="100" />
                        <line x1="300" y1="100" x2="450" y2="200" />
                        <line x1="450" y1="200" x2="600" y2="100" />
                        <line x1="300" y1="300" x2="450" y2="400" />
                        <line x1="450" y1="400" x2="600" y2="300" />
                        <line x1="150" y1="200" x2="300" y2="300" />
                        <line x1="450" y1="200" x2="450" y2="400" />
                        <line x1="600" y1="100" x2="750" y2="200" />
                        <line x1="600" y1="300" x2="750" y2="200" />
                    </g>
                    
                    {/* Glowing Node Circles */}
                    <g fill="#00f2fe">
                        <circle cx="150" cy="200" r="3" />
                        <circle cx="300" cy="100" r="4" />
                        <circle cx="450" cy="200" r="3.5" />
                        <circle cx="600" cy="100" r="4" />
                        <circle cx="750" cy="200" r="3" />
                        <circle cx="300" cy="300" r="3.5" />
                        <circle cx="450" cy="400" r="4.5" />
                        <circle cx="600" cy="300" r="3" />
                    </g>
                </svg>
            </div>

            {/* Main Ambient Glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[180px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[180px] rounded-full pointer-events-none"></div>

            {/* Left Side - Branding & Features (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 xl:p-20 z-10 select-none">
                <div>
                    {/* Logo Section */}
                    <div className="flex items-center gap-5 mb-2 animate-in fade-in slide-in-from-left-8 duration-700">
                        <ProErpLogo className="w-16 h-16" />
                        <div className="flex flex-col">
                            <h1 className="text-4xl font-black tracking-tight flex items-center">
                                PRO<span className="text-blue-500">ERP</span>
                            </h1>
                            <div className="w-48 h-[1px] bg-gradient-to-r from-blue-500 to-transparent my-1"></div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-bold">Biznesingiz uchun oson boshqaruv</span>
                        </div>
                    </div>

                    {/* Main Tagline */}
                    <h2 className="text-4xl xl:text-5xl font-bold leading-tight mt-12 mb-12 animate-in fade-in slide-in-from-left-8 duration-1000 delay-150">
                        Korxonangizni raqamli kelajakka <span className="text-[#38bdf8] drop-shadow-[0_0_15px_rgba(56,189,248,0.5)] font-extrabold">biz bilan</span> olib boring.
                    </h2>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 gap-8 xl:gap-10 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500/10 border border-blue-500/25 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                <BarChart3 size={20} />
                            </div>
                            <p className="text-sm text-gray-300 font-semibold leading-snug">Barcha jarayonlar <br/> bir platformada</p>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                <Zap size={20} />
                            </div>
                            <p className="text-sm text-gray-300 font-semibold leading-snug">Tezkor va samarali <br/> ishlash</p>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-500/10 border border-purple-500/25 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                                <Shield size={20} />
                            </div>
                            <p className="text-sm text-gray-300 font-semibold leading-snug">Xavfsiz va ishonchli <br/> ma'lumotlar</p>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                                <Users size={20} />
                            </div>
                            <p className="text-sm text-gray-300 font-semibold leading-snug">Jamoa bilan qulay <br/> hamkorlik</p>
                        </div>
                    </div>
                </div>

                {/* Highly Realistic 3D Laptop/Dashboard Mockup */}
                <div className="relative mt-8 w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                    <img 
                        src="/dashboard_mockup.png" 
                        alt="PROERP Dashboard" 
                        className="w-full h-auto object-contain filter drop-shadow-[0_20px_50px_rgba(30,58,138,0.5)] transition-transform duration-700 hover:scale-[1.02]" 
                    />
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10 relative">
                
                {/* Mobile Header Logo */}
                <div className="absolute top-8 left-8 lg:hidden flex items-center gap-3">
                    <ProErpLogo className="w-10 h-10" />
                    <h1 className="text-2xl font-black tracking-tight flex items-center">
                        PRO<span className="text-blue-500">ERP</span>
                    </h1>
                </div>

                <div className="w-full max-w-[460px] relative">
                    {/* Glowing outer box effect */}
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500/40 to-cyan-500/40 rounded-[2.5rem] blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    
                    {/* Glassmorphic Login Card */}
                    <div className="bg-[#0b1329]/80 backdrop-blur-2xl border border-blue-500/35 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8 sm:p-10 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        
                        {/* Interactive operations team arch header */}
                        <div className="rounded-[2rem_2rem_8rem_8rem] border border-blue-500/30 overflow-hidden relative w-full h-40 mb-6 bg-slate-950">
                            <img 
                                src="/login_arch_team.png" 
                                alt="Operations team" 
                                className="w-full h-full object-cover filter brightness-[0.85] contrast-[1.05]" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1329] via-[#0b1329]/20 to-transparent"></div>
                            {/* Glowing cyber cyan frame */}
                            <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-[2rem_2rem_8rem_8rem] pointer-events-none"></div>
                        </div>

                        <div className="text-center mb-6">
                            <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">Xush kelibsiz!</h3>
                            <p className="text-xs text-gray-400">Hisobingizga kirish uchun ma'lumotlaringizni kiriting</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username input */}
                            <div className="space-y-1">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Foydalanuvchi nomi"
                                        className="w-full bg-[#0d162d] border border-slate-700/60 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-[#0e1935] focus:ring-1 focus:ring-blue-500/30 transition-all font-medium text-sm"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password input */}
                            <div className="space-y-1">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Parol"
                                        className="w-full bg-[#0d162d] border border-slate-700/60 rounded-xl py-3.5 pl-11 pr-11 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:bg-[#0e1935] focus:ring-1 focus:ring-blue-500/30 transition-all font-medium text-sm"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl flex items-center gap-3 animate-shake">
                                    <Activity size={16} className="shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Remember me & Forgot Password */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input type="checkbox" className="peer sr-only" defaultChecked />
                                        <div className="w-4.5 h-4.5 bg-[#0d162d] border border-slate-600 rounded group-hover:border-blue-500 transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600"></div>
                                        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Meni eslab qolish</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors hover:underline decoration-blue-500/30 underline-offset-4"
                                >
                                    Parolni unutdingiz?
                                </button>
                            </div>

                            {/* Kirish Button */}
                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#00b4db] to-[#0083b0] hover:from-[#00c6ff] hover:to-[#0072ff] text-white font-bold text-base py-3.5 rounded-xl shadow-[0_0_20px_rgba(0,180,219,0.25)] hover:shadow-[0_0_30px_rgba(0,180,219,0.45)] transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? (
                                    <Activity size={20} className="animate-spin text-white/70" />
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        <span>Kirish</span>
                                    </>
                                )}
                            </button>
                            
                            {/* "yoki" divider */}
                            <div className="flex items-center gap-3 my-4 opacity-50">
                                <div className="h-px bg-slate-700 flex-1"></div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">yoki</span>
                                <div className="h-px bg-slate-700 flex-1"></div>
                            </div>

                            {/* SSO button */}
                            <button
                                type="button"
                                className="w-full bg-[#0d162d]/40 hover:bg-[#0d162d] border border-slate-700/60 text-slate-300 hover:text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] text-xs"
                            >
                                <ShieldCheck size={16} className="text-blue-400" />
                                <span>Single Sign-On (SSO)</span>
                            </button>
                        </form>
                    </div>

                    {/* Footer text */}
                    <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
                        <Lock size={12} className="text-slate-600" />
                        <span>Ma'lumotlaringiz xavfsiz himoyalangan</span>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal (Unchanged functionality, updated styling) */}
            {showForgotModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#0f172a] border border-gray-700 w-full max-w-sm rounded-3xl p-8 shadow-2xl relative">
                        <button onClick={() => setShowForgotModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mx-auto mb-6">
                            <CircleAlert size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white text-center mb-3">Parolni tiklash</h3>
                        <p className="text-gray-400 text-center text-sm leading-relaxed mb-8">
                            Parolni tiklash yoki o'zgartirish uchun <br />
                            <span className="text-blue-400 font-semibold mt-1 inline-block">Plan (Rejalashtirish)</span> <br />
                            bo'limiga murojaat qiling.
                        </p>
                        <button
                            onClick={() => setShowForgotModal(false)}
                            className="w-full bg-[#1e293b] hover:bg-gray-700 text-white border border-gray-600 font-bold py-3.5 rounded-xl transition-all"
                        >
                            Tushunarli
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
