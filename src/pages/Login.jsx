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
    CircleAlert,
    Boxes,
    Gauge,
    Cloud,
    Headphones,
    Mail
} from 'lucide-react';

const ProErpLogo = ({ className = "w-16 h-16" }) => (
    <svg 
        className={`${className} filter drop-shadow-[0_0_20px_rgba(0,198,255,0.7)] shrink-0`} 
        viewBox="0 0 100 100" 
        fill="none" 
        width="64" 
        height="64" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="mainBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#0072ff" />
            </linearGradient>
            <linearGradient id="mainCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="mainDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0b2545" />
                <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
        </defs>
        <g strokeLinejoin="round" strokeLinecap="round">
            {/* Bold, high-visibility 3D isometric hexagonal ribbon logo */}
            {/* Left face */}
            <path d="M15 30 L45 13 L45 87 L15 70 Z" fill="url(#mainDark)" />
            {/* Top Right face */}
            <path d="M45 13 L85 36 L85 53 L70 61 L70 45 L45 31 Z" fill="url(#mainBlue)" />
            {/* Bottom Right face */}
            <path d="M70 61 L85 53 L85 70 L45 93 L15 76 L30 67 L45 76 Z" fill="url(#mainCyan)" />
            {/* Center P Inner loop */}
            <path d="M45 31 L70 45 L70 61 L45 76 L30 67 L30 51 L45 60 L45 42 M45 42 L30 34 Z" fill="url(#mainBlue)" opacity="0.9" />
            {/* Highlights */}
            <path d="M45 13 L85 36" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
            <path d="M15 30 L45 13" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
            <path d="M45 93 L85 70" stroke="#00f2fe" strokeWidth="2" opacity="0.8" />
            <path d="M15 76 L45 93" stroke="#00f2fe" strokeWidth="1.5" opacity="0.6" />
        </g>
    </svg>
);

const HexagonFeature = ({ icon: Icon, label }) => (
    <div className="flex flex-col items-center gap-3 group select-none">
        <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Hexagon Border and Background */}
            <svg className="absolute inset-0 w-full h-full text-slate-800/40 group-hover:text-blue-600/20 filter drop-shadow-[0_0_8px_rgba(30,41,59,0.5)] transition-all duration-300" viewBox="0 0 100 100" fill="currentColor" stroke="currentColor" strokeWidth="2">
                <path d="M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z" stroke="#334155" />
            </svg>
            {/* Icon inside */}
            <div className="relative z-10 text-slate-300 group-hover:text-[#00f2fe] transition-colors duration-300">
                <Icon size={22} />
            </div>
        </div>
        <span className="text-xs text-slate-400 font-semibold tracking-wide group-hover:text-white transition-colors duration-300 text-center">{label}</span>
    </div>
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
        <div className="min-h-screen bg-[#020617] flex font-sans overflow-hidden relative text-white pb-24">
            
            {/* Holographic Digital Globe */}
            <div className="absolute top-1/2 left-[48%] -translate-y-1/2 -translate-x-1/2 w-[550px] h-[550px] opacity-25 z-0 pointer-events-none select-none hidden lg:block">
                <svg className="w-full h-full text-blue-500" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#0062ff" stopOpacity="0.25" />
                            <stop offset="60%" stopColor="#00f2fe" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    
                    {/* Glow */}
                    <circle cx="100" cy="100" r="80" fill="url(#globeGlow)" />
                    
                    {/* Outer Rings */}
                    <circle cx="100" cy="100" r="70" stroke="#00f2fe" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.6" />
                    <circle cx="100" cy="100" r="73" stroke="#0062ff" strokeWidth="0.25" opacity="0.4" />
                    
                    {/* Latitudes */}
                    <ellipse cx="100" cy="100" rx="70" ry="20" stroke="#0062ff" strokeWidth="0.4" opacity="0.5" />
                    <ellipse cx="100" cy="100" rx="70" ry="40" stroke="#0062ff" strokeWidth="0.4" opacity="0.5" />
                    <ellipse cx="100" cy="100" rx="70" ry="5" stroke="#0062ff" strokeWidth="0.4" opacity="0.5" />
                    
                    {/* Longitudes */}
                    <ellipse cx="100" cy="100" rx="20" ry="70" stroke="#0062ff" strokeWidth="0.4" opacity="0.5" />
                    <ellipse cx="100" cy="100" rx="40" ry="70" stroke="#0062ff" strokeWidth="0.4" opacity="0.5" />
                    <ellipse cx="100" cy="100" rx="5" ry="70" stroke="#0062ff" strokeWidth="0.4" opacity="0.5" />

                    {/* Abstract continent dot clusters */}
                    <g fill="#00f2fe" opacity="0.7">
                        <circle cx="65" cy="70" r="1.2" />
                        <circle cx="70" cy="68" r="0.8" />
                        <circle cx="72" cy="74" r="1" />
                        <circle cx="60" cy="75" r="1.5" />
                        <circle cx="78" cy="115" r="1.5" />
                        <circle cx="82" cy="125" r="1.2" />
                        <circle cx="80" cy="135" r="0.8" />
                        <circle cx="110" cy="110" r="1.8" />
                        <circle cx="115" cy="118" r="1.2" />
                        <circle cx="120" cy="128" r="1" />
                        <circle cx="115" cy="70" r="1.5" />
                        <circle cx="125" cy="65" r="2" />
                        <circle cx="135" cy="72" r="1.2" />
                        <circle cx="140" cy="80" r="1.5" />
                        <circle cx="120" cy="85" r="1" />
                        <circle cx="145" cy="135" r="1.5" />
                        <circle cx="150" cy="138" r="1" />
                    </g>
                </svg>
            </div>

            {/* Ambient Lighting */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[180px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[180px] rounded-full pointer-events-none"></div>

            {/* Left Side - Branding & Features */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 xl:p-24 z-10 select-none">
                <div className="space-y-12">
                    {/* Logo Section */}
                    <div className="flex items-center gap-5 mb-2 animate-in fade-in slide-in-from-left-8 duration-700">
                        <ProErpLogo className="w-16 h-16 shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-4xl font-black tracking-tight flex items-center">
                                PRO<span className="text-[#38bdf8]">ERP</span>
                            </h1>
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#38bdf8] font-bold mt-1">
                                <div className="w-5 h-[1px] bg-slate-700"></div>
                                <span>Biznesni oson boshqaruv</span>
                                <div className="w-5 h-[1px] bg-slate-700"></div>
                            </div>
                        </div>
                    </div>

                    {/* Main Tagline */}
                    <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight mt-12 animate-in fade-in slide-in-from-left-8 duration-1000 delay-150 max-w-lg">
                        Korxonangizni raqamli <span className="text-[#38bdf8] drop-shadow-[0_0_15px_rgba(56,189,248,0.6)] font-black">kelajakka</span> biz bilan olib chiqing
                    </h2>

                    {/* Paragraph description */}
                    <p className="text-slate-400 text-sm leading-relaxed max-w-md font-medium animate-in fade-in slide-in-from-left-8 duration-1000 delay-250">
                        PROERP – korxonalarni yagona platformada boshqarish, jarayonlarni avtomatlashtirish va samaradorlikni oshirish uchun zamonaviy ERP yechimi.
                    </p>

                    {/* 5 Horizontal Hexagon Features */}
                    <div className="flex items-center gap-8 xl:gap-10 pt-4 animate-in fade-in slide-in-from-left-8 duration-1000 delay-350">
                        <HexagonFeature icon={Boxes} label="Integratsiya" />
                        <HexagonFeature icon={BarChart3} label="Analitika" />
                        <HexagonFeature icon={ShieldCheck} label="Xavfsizlik" />
                        <HexagonFeature icon={Gauge} label="Samaradorlik" />
                        <HexagonFeature icon={Cloud} label="Bulutli yechim" />
                    </div>
                </div>

                {/* Left Column bottom security card */}
                <div className="bg-[#0b1429]/40 border border-slate-800/60 rounded-2xl p-5 flex items-start gap-4 max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-[#0062ff] shrink-0">
                        <ShieldCheck size={24} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <h4 className="text-sm font-bold text-white">Ma'lumotlaringiz biz uchun muhim</h4>
                        <p className="text-xs text-slate-400 leading-normal font-medium">Yuqori darajadagi xavfsizlik va ishonchlilik kafolatlanadi.</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10 relative">
                
                {/* Mobile Header Logo */}
                <div className="absolute top-8 left-8 lg:hidden flex items-center gap-3">
                    <ProErpLogo className="w-10 h-10 shrink-0" />
                    <h1 className="text-2xl font-black tracking-tight flex items-center">
                        PRO<span className="text-[#38bdf8]">ERP</span>
                    </h1>
                </div>

                <div className="w-full max-w-[460px] relative mt-12 lg:mt-0">
                    {/* Glassmorphic Login Card */}
                    <div className="bg-[#090f1d]/90 backdrop-blur-2xl border border-slate-800/80 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-8 sm:p-10 animate-in zoom-in-95 duration-500 relative">
                        
                        <div className="mb-8">
                            <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">Tizimga kirish</h3>
                            <p className="text-xs text-gray-400">Hisobingizga kirish uchun ma'lumotlaringizni kiriting</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Username field */}
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 font-semibold block">Foydalanuvchi nomi yoki email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#0062ff] transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Foydalanuvchi nomi yoki email"
                                        className="w-full bg-[#050b14] border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-[#0062ff] focus:bg-[#070f1c] focus:ring-1 focus:ring-[#0062ff]/20 transition-all font-medium text-sm"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password field */}
                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 font-semibold block">Parol</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#0062ff] transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Parolni kiriting"
                                        className="w-full bg-[#050b14] border border-slate-800 rounded-xl py-3.5 pl-11 pr-11 text-white placeholder:text-slate-600 outline-none focus:border-[#0062ff] focus:bg-[#070f1c] focus:ring-1 focus:ring-[#0062ff]/20 transition-all font-medium text-sm"
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
                                        <input type="checkbox" className="peer sr-only" />
                                        <div className="w-4.5 h-4.5 bg-[#050b14] border border-slate-800 rounded group-hover:border-[#0062ff] transition-all peer-checked:bg-[#0062ff] peer-checked:border-[#0062ff]"></div>
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
                                    Parolni unutdingizmi?
                                </button>
                            </div>

                            {/* Kirish Button */}
                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-[#0062ff] hover:bg-[#0052d4] text-white font-semibold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? (
                                    <Activity size={20} className="animate-spin text-white/70" />
                                ) : (
                                    <>
                                        <span>Kirish</span>
                                        <LogIn size={16} />
                                    </>
                                )}
                            </button>
                            
                            {/* "yoki" divider */}
                            <div className="flex items-center gap-3 my-4 opacity-50">
                                <div className="h-px bg-slate-800 flex-1"></div>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">yoki</span>
                                <div className="h-px bg-slate-800 flex-1"></div>
                            </div>

                            {/* SSO button */}
                            <button
                                type="button"
                                className="w-full bg-transparent hover:bg-slate-900 border border-[#0062ff]/30 hover:border-[#0062ff]/60 text-[#0062ff] hover:text-blue-400 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                            >
                                <ShieldCheck size={16} />
                                <span>SSO orqali kirish</span>
                            </button>
                        </form>

                        {/* Prompt for non-user */}
                        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
                            PROERP foydalanuvchisi emasmisiz?{" "}
                            <a href="mailto:info@proerp.uz" className="text-[#0062ff] hover:underline font-semibold ml-1">
                                Administrator bilan bog'laning
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Global Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col sm:flex-row items-center justify-between border-t border-slate-900 bg-[#020617]/50 backdrop-blur-md text-xs text-slate-400 font-medium z-10">
                <p>© 2024 PROERP. Barcha huquqlar himoyalangan.</p>
                <div className="flex items-center gap-6 mt-4 sm:mt-0">
                    <div className="flex items-center gap-2 select-none">
                        <Headphones size={14} className="text-[#0062ff]" />
                        <span>Qo'llab-quvvatlash</span>
                    </div>
                    <a href="mailto:info@proerp.uz" className="flex items-center gap-2 hover:text-white transition-colors">
                        <Mail size={14} />
                        <span>info@proerp.uz</span>
                    </a>
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
