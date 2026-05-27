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
    X, 
    CircleAlert,
    Boxes,
    Gauge,
    Cloud,
    ArrowRight,
    Key
} from 'lucide-react';

const ProErpLogo = ({ className = "w-20 h-20" }) => (
    <svg 
        className={`${className} filter drop-shadow-[0_0_25px_rgba(56,189,248,0.85)] shrink-0`} 
        viewBox="0 0 100 100" 
        fill="none" 
        width="85" 
        height="85" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="glowBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#0072ff" />
            </linearGradient>
            <linearGradient id="glowCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="glowDarkBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0052d4" />
                <stop offset="50%" stopColor="#4364f7" />
                <stop offset="100%" stopColor="#6fb1fc" />
            </linearGradient>
        </defs>
        <g strokeLinejoin="round" strokeLinecap="round">
            {/* Left Stem Face 1 */}
            <path d="M20 30 L32 23 L32 77 L20 70 Z" fill="#0b2545" opacity="0.95" />
            {/* Left Stem Face 2 */}
            <path d="M32 23 L44 30 L44 70 L32 77 Z" fill="url(#glowDarkBlue)" />
            
            {/* Top Chevron loop */}
            <path d="M44 30 L80 44 L68 53 L44 40 Z" fill="url(#glowBlue)" />
            <path d="M80 44 L80 56 L68 65 L68 53 Z" fill="url(#glowCyan)" />
            <path d="M44 40 L68 53 L56 61 L32 47 Z" fill="url(#glowDarkBlue)" />
            
            {/* Bottom loop */}
            <path d="M32 60 L56 74 L80 60 L68 53 L56 61 L32 47 Z" fill="url(#glowBlue)" opacity="0.8" />
            <path d="M32 77 L56 90 L80 76 L80 60 L56 74 L32 60 Z" fill="url(#glowDarkBlue)" />

            {/* Highlights */}
            <path d="M32 23 L44 30" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
            <path d="M44 30 L80 44" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
            <path d="M32 23 L32 77" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
            <path d="M56 90 L80 76" stroke="#00f2fe" strokeWidth="1.5" opacity="0.8" />
        </g>
    </svg>
);

const HexagonFeature = ({ icon: Icon, label }) => (
    <div className="flex flex-col items-center gap-3.5 group select-none flex-1">
        <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Hexagon Border and Background */}
            <svg 
                className="absolute inset-0 w-full h-full text-slate-900/60 group-hover:text-blue-950/40 filter drop-shadow-[0_0_10px_rgba(56,189,248,0.15)] transition-all duration-300" 
                viewBox="0 0 100 100" 
                fill="currentColor" 
                stroke="currentColor" 
                strokeWidth="2.5"
            >
                <path d="M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z" stroke="#1e293b" className="group-hover:stroke-[#38bdf8] transition-colors duration-300" />
            </svg>
            {/* Icon inside */}
            <div className="relative z-10 text-slate-400 group-hover:text-[#00f2fe] group-hover:scale-110 transition-all duration-300">
                <Icon size={22} strokeWidth={2} />
            </div>
        </div>
        <span className="text-xs text-slate-400 font-semibold tracking-wider group-hover:text-white transition-colors duration-300 text-center">{label}</span>
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

    const handleCloseClick = () => {
        // Go back or reset inputs as cosmetic close action
        setUsername('');
        setCode('');
        setError('');
    };

    return (
        <div className="relative w-full min-h-screen bg-[#020617] flex font-sans overflow-hidden text-white select-none">
            {/* Custom Background Gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,#0b1528_0%,#020617_60%)] z-0 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,#080e1e_0%,#020617_65%)] z-0 pointer-events-none" />
            
            {/* Glowing spot behind Login Card */}
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

            {/* Glowing spot behind left side */}
            <div className="absolute top-[20%] left-[10%] w-[450px] h-[450px] bg-cyan-600/5 rounded-full blur-[130px] pointer-events-none z-0" />

            {/* Top Right Close Button */}
            <button 
                onClick={handleCloseClick}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer z-50 hover:scale-105 active:scale-95 shadow-lg shadow-black/30"
                aria-label="Close"
            >
                <X size={20} strokeWidth={2.5} />
            </button>

            {/* Centered Holographic Wireframe Globe */}
            <div className="absolute top-1/2 left-[48%] -translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] opacity-[0.22] z-0 pointer-events-none select-none hidden lg:block">
                <svg className="w-full h-full text-cyan-500/80 animate-[spin_100s_linear_infinite]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#0062ff" stopOpacity="0.25" />
                            <stop offset="60%" stopColor="#00f2fe" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    
                    {/* Radial Glow Base */}
                    <circle cx="100" cy="100" r="85" fill="url(#globeGlow)" />
                    
                    {/* Ring Outlines */}
                    <circle cx="100" cy="100" r="75" stroke="#00f2fe" strokeWidth="0.35" strokeDasharray="3 6" opacity="0.8" />
                    <circle cx="100" cy="100" r="78" stroke="#0062ff" strokeWidth="0.2" opacity="0.5" />
                    
                    {/* Latitude Grid lines */}
                    <ellipse cx="100" cy="100" rx="75" ry="22" stroke="#00d2c4" strokeWidth="0.3" opacity="0.6" />
                    <ellipse cx="100" cy="100" rx="75" ry="42" stroke="#0062ff" strokeWidth="0.3" opacity="0.5" />
                    <ellipse cx="100" cy="100" rx="75" ry="6" stroke="#00d2c4" strokeWidth="0.3" opacity="0.6" />
                    
                    {/* Longitude Grid lines */}
                    <ellipse cx="100" cy="100" rx="22" ry="75" stroke="#00d2c4" strokeWidth="0.3" opacity="0.6" />
                    <ellipse cx="100" cy="100" rx="42" ry="75" stroke="#0062ff" strokeWidth="0.3" opacity="0.5" />
                    <ellipse cx="100" cy="100" rx="6" ry="75" stroke="#00d2c4" strokeWidth="0.3" opacity="0.6" />

                    {/* Dotted Nodes on Intersection */}
                    <g fill="#00f2fe" className="animate-pulse">
                        <circle cx="65" cy="70" r="1.3" />
                        <circle cx="70" cy="68" r="0.9" />
                        <circle cx="72" cy="74" r="1.1" />
                        <circle cx="60" cy="75" r="1.6" />
                        <circle cx="78" cy="115" r="1.6" />
                        <circle cx="82" cy="125" r="1.3" />
                        <circle cx="80" cy="135" r="0.9" />
                        <circle cx="110" cy="110" r="1.8" />
                        <circle cx="115" cy="118" r="1.3" />
                        <circle cx="120" cy="128" r="1.1" />
                        <circle cx="115" cy="70" r="1.6" />
                        <circle cx="125" cy="65" r="2.0" />
                        <circle cx="135" cy="72" r="1.3" />
                        <circle cx="140" cy="80" r="1.6" />
                        <circle cx="120" cy="85" r="1.1" />
                        <circle cx="145" cy="135" r="1.6" />
                        <circle cx="150" cy="138" r="1.0" />
                    </g>
                </svg>
            </div>

            <div className="w-full min-h-screen flex flex-col lg:flex-row relative z-10">
                {/* Left Side: Branding & Features */}
                <div className="hidden lg:flex lg:w-[56%] flex-col justify-between p-16 xl:p-24 select-none relative">
                    {/* Header: Logo and Title */}
                    <div className="flex items-center gap-4.5 animate-in fade-in slide-in-from-left-6 duration-700">
                        <ProErpLogo className="w-20 h-20 shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-0.5 leading-none">
                                <span className="text-white font-extrabold">PRO</span>
                                <span className="text-[#0062ff] font-extrabold">ERP</span>
                            </h1>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className="h-[1px] w-3 bg-slate-600" />
                                <p className="text-[#94a3b8] uppercase tracking-[0.25em] text-[10px] font-semibold leading-none">
                                    Biznesni oson boshqaruv
                                </p>
                                <span className="h-[1px] w-3 bg-slate-600" />
                            </div>
                        </div>
                    </div>

                    {/* Content Section: Taglines and Grid */}
                    <div className="my-auto py-10 space-y-11">
                        {/* Heading */}
                        <div className="space-y-4">
                            <h2 className="text-[52px] xl:text-[62px] font-extrabold leading-[1.12] text-white tracking-tight animate-in fade-in slide-in-from-left-6 duration-1000 delay-150">
                                Korxonangizni <br />
                                raqamli <span className="text-[#00f2fe] font-extrabold drop-shadow-[0_0_15px_rgba(0,242,254,0.35)]">kelajakka</span> biz <br />
                                bilan olib chiqing
                            </h2>
                            {/* Subtitle Description */}
                            <p className="text-[#94a3b8] text-lg leading-[1.75] max-w-xl font-medium animate-in fade-in slide-in-from-left-6 duration-1000 delay-250">
                                PROERP – korxonalarni yagona platformada boshqarish, jarayonlarni avtomatlashtirish va samaradorlikni oshirish uchun zamonaviy ERP yechimi.
                            </p>
                        </div>

                        {/* 5 Horizontal Feature Row */}
                        <div className="flex items-center justify-between gap-4 max-w-2xl pt-2 animate-in fade-in slide-in-from-left-6 duration-1000 delay-350">
                            <HexagonFeature icon={Boxes} label="Integratsiya" />
                            <HexagonFeature icon={BarChart3} label="Analitika" />
                            <HexagonFeature icon={ShieldCheck} label="Xavfsizlik" />
                            <HexagonFeature icon={Gauge} label="Samaradorlik" />
                            <HexagonFeature icon={Cloud} label="Bulutli yechim" />
                        </div>
                    </div>

                    {/* Bottom: Security Badge Card */}
                    <div className="bg-[#040815]/60 border border-blue-900/35 hover:border-blue-500/20 rounded-[22px] p-5 flex items-center gap-4.5 max-w-md shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-[#38bdf8] shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                            <ShieldCheck size={26} strokeWidth={2.2} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-bold text-white tracking-wide">Ma'lumotlaringiz biz uchun muhim</h4>
                            <p className="text-[11.5px] text-[#94a3b8] leading-relaxed font-semibold">Yuqori darajadagi xavfsizlik va ishonchlilik kafolatlanadi.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full lg:w-[44%] flex items-center justify-center p-6 sm:p-12 z-10 relative">
                    {/* Mobile Header Logo */}
                    <div className="absolute top-8 left-8 lg:hidden flex items-center gap-3">
                        <ProErpLogo className="w-11 h-11 shrink-0" />
                        <h1 className="text-2xl font-black tracking-tighter flex items-center">
                            PRO<span className="text-[#0062ff]">ERP</span>
                        </h1>
                    </div>

                    <div className="w-full max-w-[460px] relative">
                        {/* Premium Glassmorphic Login Card */}
                        <div className="bg-[#040814]/75 backdrop-blur-[35px] border border-white/[0.06] rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] p-8 sm:p-11 animate-in zoom-in-95 duration-500 relative z-10">
                            
                            <div className="mb-9">
                                <h3 className="text-[40px] font-black text-white tracking-tight leading-none mb-3">Tizimga kirish</h3>
                                <p className="text-sm text-[#94a3b8] font-medium leading-relaxed">Hisobingizga kirish uchun ma'lumotlaringizni kiriting</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Username field */}
                                <div className="space-y-2">
                                    <label className="text-[12.5px] text-[#cbd5e1] font-bold tracking-wide block uppercase">Foydalanuvchi nomi yoki email</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#38bdf8] transition-colors">
                                            <User size={18} strokeWidth={2.2} />
                                        </div>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Foydalanuvchi nomi yoki email"
                                            className="w-full h-[58px] bg-[#070b13] border border-white/[0.04] rounded-2xl py-3 pl-12.5 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-[#38bdf8]/70 focus:ring-1 focus:ring-[#38bdf8]/15 transition-all font-semibold text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Password field */}
                                <div className="space-y-2">
                                    <label className="text-[12.5px] text-[#cbd5e1] font-bold tracking-wide block uppercase">Parol</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#38bdf8] transition-colors">
                                            <Lock size={18} strokeWidth={2.2} />
                                        </div>
                                        <input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Parolni kiriting"
                                            className="w-full h-[58px] bg-[#070b13] border border-white/[0.04] rounded-2xl py-3 pl-12.5 pr-11.5 text-white placeholder:text-slate-600 outline-none focus:border-[#38bdf8]/70 focus:ring-1 focus:ring-[#38bdf8]/15 transition-all font-semibold text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4.5 flex items-center text-slate-500 hover:text-white transition-colors cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff size={18} strokeWidth={2.2} /> : <Eye size={18} strokeWidth={2.2} />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl flex items-center gap-3 animate-shake font-semibold shadow-inner">
                                        <CircleAlert size={16} className="shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Remember me & Forgot Password */}
                                <div className="flex items-center justify-between pt-1 font-semibold text-xs">
                                    <label className="flex items-center gap-2.5 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input type="checkbox" className="peer sr-only" />
                                            <div className="w-5 h-5 bg-[#070b13] border border-slate-800 rounded-[6px] group-hover:border-[#38bdf8] transition-all peer-checked:bg-[#0062ff] peer-checked:border-[#0062ff]" />
                                            <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <span className="text-[#94a3b8] group-hover:text-gray-300 transition-colors select-none">Meni eslab qolish</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotModal(true)}
                                        className="text-[#38bdf8] hover:text-[#00f2fe] hover:underline transition-colors font-bold cursor-pointer"
                                    >
                                        Parolni unutdingizmi?
                                    </button>
                                </div>

                                {/* Kirish Button */}
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full h-[58px] bg-[#0062ff] hover:bg-[#0052d4] text-white font-extrabold text-[16px] rounded-2xl transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-[0_8px_20px_-6px_rgba(0,98,255,0.4)] cursor-pointer tracking-wider"
                                >
                                    {loading ? (
                                        <>
                                            <Activity size={20} className="animate-spin text-white/70" />
                                            <span>Kirilmoqda...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Kirish</span>
                                            <ArrowRight size={18} strokeWidth={2.5} />
                                        </>
                                    )}
                                </button>
                                
                                {/* "yoki" divider */}
                                <div className="flex items-center gap-4 py-2">
                                    <div className="h-[1px] bg-slate-900 flex-1 opacity-60"></div>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">yoki</span>
                                    <div className="h-[1px] bg-slate-900 flex-1 opacity-60"></div>
                                </div>

                                {/* SSO button */}
                                <button
                                    type="button"
                                    className="w-full h-[54px] bg-transparent hover:bg-white/[0.02] border border-[#0062ff]/30 hover:border-[#0062ff]/65 text-[#38bdf8] hover:text-[#00f2fe] font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2.5 text-xs tracking-wider cursor-pointer"
                                >
                                    <Key size={15} strokeWidth={2.5} />
                                    <span>SSO orqali kirish</span>
                                </button>
                            </form>

                            {/* Prompt for non-user */}
                            <p className="text-center text-xs text-slate-500 mt-8 font-semibold">
                                PROERP foydalanuvchisi emasmisiz?{" "}
                                <a href="mailto:info@proerp.uz" className="text-[#0062ff] hover:text-[#38bdf8] hover:underline font-bold ml-1 transition-colors">
                                    Administrator bilan bog'laning
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#0f172a] border border-slate-800 w-full max-w-sm rounded-[28px] p-8 shadow-2xl relative">
                        <button 
                            onClick={() => setShowForgotModal(false)} 
                            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mx-auto mb-6 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                            <CircleAlert size={32} strokeWidth={2.2} />
                        </div>
                        <h3 className="text-xl font-bold text-white text-center mb-3">Parolni tiklash</h3>
                        <p className="text-slate-400 text-center text-sm leading-relaxed mb-8 font-medium">
                            Parolni tiklash yoki o'zgartirish uchun <br />
                            <span className="text-[#38bdf8] font-bold mt-1.5 inline-block">Plan (Rejalashtirish)</span> <br />
                            bo'limiga murojaat qiling.
                        </p>
                        <button
                            onClick={() => setShowForgotModal(false)}
                            className="w-full bg-[#1e293b] hover:bg-slate-800 text-white border border-slate-700 font-bold py-3.5 rounded-xl transition-all cursor-pointer"
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
