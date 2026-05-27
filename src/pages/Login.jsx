import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    User, Lock, Eye, EyeOff, Activity, ShieldCheck, LogIn
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
            
            {/* Background Glows to match the tech atmosphere */}
            <div className="absolute top-1/4 left-[10%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[150px] pointer-events-none z-0" />
            <div className="absolute bottom-1/4 right-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

            {/* Subtle Map Background overlay */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-no-repeat bg-center bg-cover" style={{ filter: 'invert(1)' }}></div>

            <div className="w-full max-w-[1600px] min-h-screen flex flex-col lg:flex-row relative z-10 px-4 sm:px-8">
                
                {/* Left Side: Mockup Image and Logo */}
                <div className="hidden lg:flex lg:w-[55%] flex-col justify-center items-center xl:items-start pt-10 pb-10 xl:pl-16">
                    {/* The new uploaded Logo */}
                    <img 
                        src="/logo_3d.png" 
                        alt="PROERP Logo" 
                        className="w-full max-w-[400px] object-contain shrink-0 mb-6 animate-in fade-in slide-in-from-left duration-700 filter drop-shadow-2xl" 
                    />
                    
                    {/* The user's provided mockup containing text, features, and laptop */}
                    <img 
                        src="/dashboard_mockup.png" 
                        alt="Dashboard Features" 
                        className="w-full max-w-[850px] object-contain animate-in fade-in zoom-in duration-1000 delay-200 xl:-ml-4"
                    />
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full lg:w-[45%] flex items-center justify-center z-10">
                    
                    {/* Glassmorphic Login Card */}
                    <div className="w-full max-w-[460px] bg-[#060d20]/80 backdrop-blur-xl border border-blue-400/20 rounded-[28px] p-1.5 shadow-[0_0_60px_rgba(0,100,255,0.15)] relative overflow-hidden">
                        
                        {/* The Arched Team Image inside the login card */}
                        <div className="w-full h-[220px] relative overflow-hidden rounded-t-[26px] flex items-center justify-center mb-4">
                            {/* The Arch Shape Mask */}
                            <div className="absolute top-0 w-[90%] h-[180px] overflow-hidden border border-blue-500/20" style={{ clipPath: 'ellipse(100% 100% at 50% 0%)' }}>
                                <img 
                                    src="/login_arch_team.png" 
                                    alt="Team" 
                                    className="w-full h-full object-cover opacity-90 scale-105"
                                />
                                {/* Bottom fade out */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#060d20] via-[#060d20]/30 to-transparent" />
                                <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,100,255,0.4)] rounded-full mix-blend-overlay"></div>
                            </div>
                        </div>

                        {/* Form Content - positioned slightly over the faded arch image */}
                        <div className="px-8 sm:px-10 pb-10 -mt-10 relative z-10">
                            
                            <div className="text-center mb-8">
                                <h2 className="text-[28px] font-bold text-white mb-2 tracking-tight">Xush kelibsiz!</h2>
                                <p className="text-[#94a3b8] text-[13px] font-medium">Hisobingizga kirish uchun ma'lumotlaringizni kiriting</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Username */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#38bdf8] transition-colors">
                                        <User size={18} strokeWidth={2.2} />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Foydalanuvchi nomi"
                                        className="w-full h-[52px] bg-[#10172a]/90 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-[#38bdf8]/70 focus:ring-1 focus:ring-[#38bdf8]/20 transition-all text-[14.5px] shadow-inner"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>

                                {/* Password */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#38bdf8] transition-colors">
                                        <Lock size={18} strokeWidth={2.2} />
                                    </div>
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Parol"
                                        className="w-full h-[52px] bg-[#10172a]/90 border border-slate-700/50 rounded-xl py-3 pl-11 pr-11 text-white placeholder:text-slate-500 outline-none focus:border-[#38bdf8]/70 focus:ring-1 focus:ring-[#38bdf8]/20 transition-all text-[14.5px] shadow-inner"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                                    </button>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="text-red-400 text-[13px] font-medium text-center bg-red-500/10 py-2.5 rounded-lg border border-red-500/20">
                                        {error}
                                    </div>
                                )}

                                {/* Checkbox and Forgot Password */}
                                <div className="flex items-center justify-between py-2">
                                    <label className="flex items-center gap-2.5 cursor-pointer group">
                                        <div className="relative flex items-center justify-center">
                                            <input type="checkbox" className="peer sr-only" defaultChecked={true} />
                                            <div className="w-[18px] h-[18px] bg-[#10172a] border border-slate-600 rounded-[4px] group-hover:border-[#38bdf8] transition-all peer-checked:bg-[#0062ff] peer-checked:border-[#0062ff]" />
                                            <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <span className="text-slate-300 text-[13px] group-hover:text-white transition-colors select-none">Meni eslab qolish</span>
                                    </label>
                                    <button
                                        type="button"
                                        className="text-[#38bdf8] text-[13px] hover:text-[#00f2fe] transition-colors cursor-pointer"
                                    >
                                        Parolni unutdingiz?
                                    </button>
                                </div>

                                {/* Submit */}
                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full h-[52px] bg-gradient-to-r from-[#0062ff] to-[#0099ff] hover:from-[#0052d4] hover:to-[#0088ee] text-white font-semibold text-[15px] rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-[0_8px_20px_-6px_rgba(0,98,255,0.5)] cursor-pointer"
                                >
                                    {loading ? (
                                        <Activity size={20} className="animate-spin text-white/70" />
                                    ) : (
                                        <>
                                            <LogIn size={18} strokeWidth={2.5} />
                                            <span className="tracking-wide">Kirish</span>
                                        </>
                                    )}
                                </button>
                                
                                {/* Divider */}
                                <div className="flex items-center gap-4 py-2">
                                    <div className="h-[1px] bg-slate-700/60 flex-1"></div>
                                    <span className="text-[12px] text-slate-500 font-medium tracking-wide">yoki</span>
                                    <div className="h-[1px] bg-slate-700/60 flex-1"></div>
                                </div>

                                {/* SSO */}
                                <button
                                    type="button"
                                    className="w-full h-[50px] bg-transparent hover:bg-[#10172a] border border-slate-700/70 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer text-[14px]"
                                >
                                    <ShieldCheck size={18} strokeWidth={2} />
                                    <span>Single Sign-On (SSO)</span>
                                </button>

                                {/* Footer text */}
                                <div className="pt-5 flex items-center justify-center gap-1.5 text-slate-500">
                                    <Lock size={12} strokeWidth={2.5} />
                                    <span className="text-[11px] font-medium tracking-wide">Ma'lumotlaringiz xavfsiz himoyalangan</span>
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
