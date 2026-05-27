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
    ArrowRight,
    Key
} from 'lucide-react';

const ProErpLogo = ({ className = "w-20 h-20" }) => (
    <svg 
        className={`${className} filter drop-shadow-[0_0_20px_rgba(0,198,255,0.75)] shrink-0`} 
        viewBox="0 0 100 100" 
        fill="none" 
        width="85" 
        height="85" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="pBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="50%" stopColor="#00c6ff" />
                <stop offset="100%" stopColor="#0062ff" />
            </linearGradient>
            <linearGradient id="pCyan" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#0099ff" />
            </linearGradient>
            <linearGradient id="pDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0a1d37" />
                <stop offset="100%" stopColor="#020815" />
            </linearGradient>
            <linearGradient id="pBevel" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
        </defs>
        
        {/* Volumetric 3D Hexagonal "P" Ribbon Icon */}
        <g strokeLinejoin="round" strokeLinecap="round">
            {/* Back Bezel/Dark Shadow Plate */}
            <path d="M22 65 L22 35 L48 20 L78 37 L78 57 L48 74 Z" fill="url(#pDark)" />
            
            {/* Outer Left Vertical Column of Hexagon */}
            <path d="M22 35 L34 28 L34 78 L22 85 Z" fill="url(#pBlue)" />
            
            {/* Glossy Upper Ribbon Loop forming the curve of P */}
            <path d="M34 28 L58 14 L82 28 L82 52 L58 66 L58 48 L70 41 L70 35 L58 28 L34 42 Z" fill="url(#pCyan)" />
            
            {/* Inner Volumetric Stem face (diagonal cut/tail) */}
            <path d="M46 42 L58 35 L58 85 L46 92 Z" fill="url(#pBlue)" />
            
            {/* Chrome Bevel Highlights */}
            <path d="M34 42 L58 28 L58 35 L34 49 Z" fill="url(#pBevel)" opacity="0.55" />
            <path d="M58 48 L70 41 L70 47 L58 54 Z" fill="url(#pBevel)" opacity="0.45" />
            <path d="M58 66 L82 52 L82 58 L58 72 Z" fill="url(#pDark)" opacity="0.6" />
            <path d="M34 49 L58 35 L70 42 L70 54 L58 61 L34 75 Z" fill="url(#pCyan)" opacity="0.8" />

            {/* Bright Edge Lines for Glossiness */}
            <path d="M58 14 L82 28" stroke="#ffffff" strokeWidth="1.75" opacity="0.75" />
            <path d="M34 28 L58 14" stroke="#ffffff" strokeWidth="1.75" opacity="0.85" />
            <path d="M22 35 L34 28" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
            <path d="M58 85 L46 92" stroke="#00f2fe" strokeWidth="1.75" opacity="0.9" />
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

    const handleCloseClick = () => {
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

            <div className="w-full min-h-screen flex flex-col lg:flex-row relative z-10">
                {/* Left Side: Branding & Features */}
                <div className="hidden lg:flex lg:w-[56%] flex-col justify-between p-12 xl:p-16 select-none relative">
                    {/* Header: Logo and Title (Sync to new stylized logo card) */}
                    <div className="flex items-center gap-5 animate-in fade-in slide-in-from-left-6 duration-700">
                        <ProErpLogo className="w-18 h-18 shrink-0" />
                        <div className="flex flex-col">
                            <h1 className="text-4xl xl:text-5xl font-black tracking-tight flex items-center leading-none text-white">
                                PRO<span className="bg-gradient-to-r from-[#00f2fe] to-[#0062ff] bg-clip-text text-transparent">ERP</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-2.5">
                                <span className="h-[2px] w-6 bg-gradient-to-r from-transparent to-[#00f2fe]" />
                                <p className="text-white uppercase tracking-[0.25em] text-[10px] xl:text-[11px] font-bold leading-none">
                                    Biznesni oson boshqaruv
                                </p>
                                <span className="h-[2px] w-6 bg-gradient-to-r from-[#0062ff] to-transparent" />
                            </div>
                        </div>
                    </div>

                    {/* Content Section: Taglines and Grid */}
                    <div className="my-auto py-2 space-y-7">
                        {/* Heading */}
                        <div className="space-y-4">
                            <h2 className="text-[44px] xl:text-[50px] font-extrabold leading-[1.15] text-white tracking-tight animate-in fade-in slide-in-from-left-6 duration-1000 delay-150">
                                Korxonangizni raqamli kelajakka <br />
                                <span className="text-[#0062ff] font-extrabold drop-shadow-[0_0_15px_rgba(0,98,255,0.45)]">biz bilan</span> olib boring.
                            </h2>
                        </div>

                        {/* 2x2 Feature Grid with a vertical divider */}
                        <div className="flex items-center gap-8 pt-1 animate-in fade-in slide-in-from-left-6 duration-1000 delay-350 max-w-xl">
                            {/* Column 1 */}
                            <div className="flex-1 space-y-5">
                                {/* Item 1 */}
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-[#2ea8ff] shrink-0 border border-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                                        <BarChart3 size={20} strokeWidth={2.2} />
                                    </div>
                                    <span className="text-sm text-slate-300 font-semibold tracking-wide leading-snug group-hover:text-white transition-colors">
                                        Barcha jarayonlar <br /> bir platformada
                                    </span>
                                </div>
                                {/* Item 2 */}
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-[#818cf8] shrink-0 border border-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                                        <ShieldCheck size={20} strokeWidth={2.2} />
                                    </div>
                                    <span className="text-sm text-slate-300 font-semibold tracking-wide leading-snug group-hover:text-white transition-colors">
                                        Xavfsiz va ishonchli <br /> ma'lumotlar
                                    </span>
                                </div>
                            </div>

                            {/* Vertical Divider */}
                            <div className="w-px h-16 bg-slate-800/80 self-center"></div>

                            {/* Column 2 */}
                            <div className="flex-1 space-y-5">
                                {/* Item 3 */}
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-[#34d399] shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                                        <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-slate-300 font-semibold tracking-wide leading-snug group-hover:text-white transition-colors">
                                        Tezkor va samarali <br /> ishlash
                                    </span>
                                </div>
                                {/* Item 4 */}
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-[#fbbf24] shrink-0 border border-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                                        <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-slate-300 font-semibold tracking-wide leading-snug group-hover:text-white transition-colors">
                                        Jamoa bilan qulay <br /> hamkorlik
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Photorealistic Workspace Laptop & Hologram Illustration directly from User Mockup */}
                        <div className="relative w-full max-w-2xl h-[330px] flex items-center justify-center pt-2 animate-in fade-in duration-1000 delay-300">
                            {/* Blue Glowing Light Spot underneath */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none z-0" />
                            
                            {/* User's uploaded mockup image directly embedded! */}
                            <img 
                                src="/dashboard_mockup.png" 
                                alt="PROERP premium dashboard workspace" 
                                className="w-full h-full object-contain rounded-2xl filter drop-shadow-[0_20px_50px_rgba(0,98,255,0.25)] hover:scale-[1.01] transition-transform duration-500 relative z-10" 
                            />
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
                        <h1 className="text-2xl font-black tracking-tighter flex items-center text-white">
                            PRO<span className="bg-gradient-to-r from-[#00f2fe] to-[#0062ff] bg-clip-text text-transparent text-transparent">ERP</span>
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
