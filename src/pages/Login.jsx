import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    User, Lock, Eye, EyeOff, Activity, ShieldCheck, LogIn,
    BarChart3, Zap, Users
} from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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
        <div className="w-full min-h-screen bg-[#020617] flex items-center justify-center font-sans overflow-hidden text-white select-none relative">
            
            {/* Professional Background Lighting */}
            <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#0062ff]/20 rounded-full blur-[160px] pointer-events-none z-0" />
            <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#00f2fe]/10 rounded-full blur-[150px] pointer-events-none z-0" />
            
            {/* World Map Overlay with Low Opacity to match the theme */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-no-repeat bg-center bg-cover" style={{ filter: 'invert(1)' }}></div>

            <div className="w-full max-w-[1500px] min-h-screen flex flex-col lg:flex-row relative z-10">
                
                {/* LEFT SIDE: Native UI with cropped image blend */}
                <div className="hidden lg:flex lg:w-[55%] flex-col justify-between px-10 xl:px-16 pt-12 pb-6 relative">
                    
                    {/* Logo Section - using screen blend mode to perfectly hide the dark solid background */}
                    <div className="relative z-20 mix-blend-screen animate-in fade-in slide-in-from-left duration-700">
                        <img 
                            src="/logo_3d.png" 
                            alt="PROERP Logo" 
                            className="w-[280px] xl:w-[320px] object-contain filter contrast-125 brightness-110" 
                        />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center mt-8 relative z-20">
                        {/* Native Title */}
                        <h2 className="text-[38px] xl:text-[46px] font-extrabold leading-[1.2] text-white tracking-tight mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                            Korxonangizni raqamli kelajakka <br />
                            <span className="text-[#38bdf8] drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]">biz bilan</span> olib boring.
                        </h2>

                        {/* Native Features Grid */}
                        <div className="grid grid-cols-2 gap-y-10 gap-x-6 max-w-[600px] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                            {/* Feature 1 */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                                    <BarChart3 size={22} strokeWidth={2.5} />
                                </div>
                                <span className="text-sm xl:text-[15px] font-semibold text-slate-200 leading-snug">
                                    Barcha jarayonlar <br /> bir platformada
                                </span>
                            </div>
                            
                            {/* Feature 2 */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                    <Zap size={22} strokeWidth={2.5} />
                                </div>
                                <span className="text-sm xl:text-[15px] font-semibold text-slate-200 leading-snug">
                                    Tezkor va samarali <br /> ishlash
                                </span>
                            </div>

                            {/* Feature 3 */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                    <ShieldCheck size={22} strokeWidth={2.5} />
                                </div>
                                <span className="text-sm xl:text-[15px] font-semibold text-slate-200 leading-snug">
                                    Xavfsiz va ishonchli <br /> ma'lumotlar
                                </span>
                            </div>

                            {/* Feature 4 */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                                    <Users size={22} strokeWidth={2.5} />
                                </div>
                                <span className="text-sm xl:text-[15px] font-semibold text-slate-200 leading-snug">
                                    Jamoa bilan qulay <br /> hamkorlik
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Laptop Illustration - Professionally Cropped & Blended */}
                    {/* We use negative margin and clip-path to perfectly extract only the laptop from the user's mockup image */}
                    <div className="absolute bottom-0 right-0 left-0 h-[450px] w-full flex items-end justify-center pointer-events-none z-10 animate-in fade-in zoom-in-95 duration-1000 delay-500">
                        <img 
                            src="/dashboard_mockup.png" 
                            alt="Dashboard Laptop" 
                            className="w-[110%] max-w-none mix-blend-screen opacity-90"
                            style={{ 
                                objectFit: 'cover', 
                                objectPosition: 'center bottom',
                                clipPath: 'inset(48% 0 0 0)' // Perfectly cuts off the baked-in text/features of the image!
                            }}
                        />
                    </div>
                </div>

                {/* RIGHT SIDE: Glassmorphic Login Form */}
                <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 z-20">
                    <div className="w-full max-w-[460px] bg-[#050b1a]/60 backdrop-blur-[40px] border border-white/5 rounded-[32px] p-2 shadow-[0_20px_70px_rgba(0,10,30,0.8)] relative overflow-hidden">
                        
                        {/* Arched Top Image Area */}
                        <div className="w-full h-[180px] relative rounded-t-[30px] overflow-hidden mb-6 flex items-start justify-center">
                            {/* We create a perfect ellipse mask for the top image */}
                            <div className="absolute top-0 w-[110%] h-[180px]" style={{ clipPath: 'ellipse(60% 100% at 50% 0%)' }}>
                                <img 
                                    src="/login_arch_team.png" 
                                    alt="Professional Team" 
                                    className="w-full h-full object-cover mix-blend-screen opacity-60"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050b1a] via-[#050b1a]/60 to-transparent" />
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="px-8 sm:px-10 pb-10 -mt-8 relative z-10">
                            
                            <div className="text-center mb-8">
                                <h2 className="text-[30px] font-extrabold text-white mb-2 tracking-tight">Xush kelibsiz!</h2>
                                <p className="text-[#94a3b8] text-[13px] font-medium leading-relaxed">Hisobingizga kirish uchun ma'lumotlaringizni kiriting</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Username Input */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#38bdf8] transition-colors">
                                        <User size={18} strokeWidth={2.5} />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Foydalanuvchi nomi"
                                        className="w-full h-[54px] bg-[#0a1128]/80 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-[#38bdf8]/50 focus:ring-1 focus:ring-[#38bdf8]/20 transition-all text-[14px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] font-medium"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>

                                {/* Password Input */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#38bdf8] transition-colors">
                                        <Lock size={18} strokeWidth={2.5} />
                                    </div>
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Parol"
                                        className="w-full h-[54px] bg-[#0a1128]/80 border border-white/5 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-slate-500 outline-none focus:border-[#38bdf8]/50 focus:ring-1 focus:ring-[#38bdf8]/20 transition-all text-[14px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] font-medium"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                                    </button>
                                </div>

                                {/* Error Display */}
                                {error && (
                                    <div className="text-red-400 text-[13px] font-semibold text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20 flex items-center justify-center gap-2">
                                        <Activity size={16} />
                                        {error}
                                    </div>
                                )}

                                {/* Checkbox & Forgot Password */}
                                <div className="flex items-center justify-between py-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input type="checkbox" className="peer sr-only" defaultChecked={true} />
                                            <div className="w-[18px] h-[18px] bg-[#0a1128] border border-slate-600 rounded md group-hover:border-[#38bdf8] transition-all peer-checked:bg-[#0062ff] peer-checked:border-[#0062ff]" />
                                            <svg className="absolute w-[12px] h-[12px] text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <span className="text-slate-300 text-[13px] font-medium group-hover:text-white transition-colors select-none">Meni eslab qolish</span>
                                    </label>
                                    <button
                                        type="button"
                                        className="text-[#38bdf8] text-[13px] font-medium hover:text-[#00f2fe] transition-colors cursor-pointer"
                                    >
                                        Parolni unutdingiz?
                                    </button>
                                </div>

                                {/* Submit Button */}
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full h-[54px] bg-gradient-to-r from-[#0062ff] to-[#0099ff] hover:from-[#0052d4] hover:to-[#0088ee] text-white font-bold text-[15px] rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-[0_10px_25px_-5px_rgba(0,98,255,0.5)] cursor-pointer active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <Activity size={20} className="animate-spin text-white/80" />
                                    ) : (
                                        <>
                                            <LogIn size={18} strokeWidth={2.5} />
                                            <span className="tracking-wide">Kirish</span>
                                        </>
                                    )}
                                </button>
                                
                                {/* Divider */}
                                <div className="flex items-center gap-4 py-3">
                                    <div className="h-[1px] bg-white/10 flex-1"></div>
                                    <span className="text-[11px] text-slate-500 font-bold tracking-widest uppercase">yoki</span>
                                    <div className="h-[1px] bg-white/10 flex-1"></div>
                                </div>

                                {/* SSO Button */}
                                <button
                                    type="button"
                                    className="w-full h-[52px] bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer text-[14px]"
                                >
                                    <ShieldCheck size={18} strokeWidth={2.5} className="text-slate-400" />
                                    <span>Single Sign-On (SSO)</span>
                                </button>

                                {/* Footer Secure Text */}
                                <div className="pt-6 flex items-center justify-center gap-1.5 text-slate-500">
                                    <Lock size={12} strokeWidth={2.5} />
                                    <span className="text-[11px] font-semibold tracking-wide">Ma'lumotlaringiz xavfsiz himoyalangan</span>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
