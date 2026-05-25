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
    MonitorPlay
} from 'lucide-react';

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
            {/* Dark/Futuristic Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>
            
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

            {/* Left Side - Branding & Features (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 xl:p-20 z-10">
                <div>
                    {/* Logo */}
                    <div className="flex items-center gap-4 mb-2 animate-in fade-in slide-in-from-left-8 duration-700">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                            <span className="text-white font-black text-3xl italic pr-1">P</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-4xl font-black tracking-tight flex items-center">
                                PRO<span className="text-blue-500">ERP</span>
                            </h1>
                            <div className="w-full h-px bg-gradient-to-r from-blue-500/50 to-transparent my-1"></div>
                            <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-bold">Biznesingiz uchun oson boshqaruv</span>
                        </div>
                    </div>

                    {/* Main Tagline */}
                    <h2 className="text-4xl xl:text-5xl font-bold leading-tight mt-12 mb-12 animate-in fade-in slide-in-from-left-8 duration-1000 delay-150">
                        Korxonangizni raqamli kelajakka <span className="text-blue-400">biz bilan</span> olib boring.
                    </h2>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
                        <div className="flex items-start gap-4 group">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                                <BarChart3 size={24} />
                            </div>
                            <p className="text-sm text-gray-300 font-medium leading-relaxed">Barcha jarayonlar <br/> bir platformada</p>
                        </div>
                        <div className="flex items-start gap-4 group">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                                <Zap size={24} />
                            </div>
                            <p className="text-sm text-gray-300 font-medium leading-relaxed">Tezkor va samarali <br/> ishlash</p>
                        </div>
                        <div className="flex items-start gap-4 group">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                                <Shield size={24} />
                            </div>
                            <p className="text-sm text-gray-300 font-medium leading-relaxed">Xavfsiz va ishonchli <br/> ma'lumotlar</p>
                        </div>
                        <div className="flex items-start gap-4 group">
                            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                                <Users size={24} />
                            </div>
                            <p className="text-sm text-gray-300 font-medium leading-relaxed">Jamoa bilan qulay <br/> hamkorlik</p>
                        </div>
                    </div>
                </div>

                {/* Abstract Graphic Representation */}
                <div className="relative h-64 mt-12 w-full max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                    <div className="absolute inset-0 bg-blue-500/5 border border-blue-500/20 rounded-2xl backdrop-blur-sm flex items-center justify-center transform perspective-1000 rotateX-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="w-full h-full relative overflow-hidden rounded-2xl">
                            <div className="absolute top-4 left-4 right-4 h-32 flex gap-4">
                                <div className="w-1/3 h-full bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                                    <BarChart3 size={32} className="text-blue-400/50" />
                                </div>
                                <div className="w-2/3 h-full bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex flex-col gap-2 p-4">
                                    <div className="w-1/2 h-2 bg-indigo-400/30 rounded"></div>
                                    <div className="w-full h-12 bg-indigo-400/10 rounded mt-auto flex items-end gap-1 px-2 pt-2">
                                        <div className="w-1/5 h-[40%] bg-indigo-400/50 rounded-t"></div>
                                        <div className="w-1/5 h-[70%] bg-indigo-400/50 rounded-t"></div>
                                        <div className="w-1/5 h-[50%] bg-indigo-400/50 rounded-t"></div>
                                        <div className="w-1/5 h-[90%] bg-indigo-400/80 rounded-t shadow-[0_0_10px_rgba(129,140,248,0.5)]"></div>
                                        <div className="w-1/5 h-[60%] bg-indigo-400/50 rounded-t"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center px-4">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                                    <div className="w-4 h-4 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
                                </div>
                                <div className="ml-4 w-32 h-2 bg-white/10 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10 relative">
                
                {/* Mobile Logo (visible only on small screens) */}
                <div className="absolute top-8 left-8 lg:hidden flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                        <span className="text-white font-black text-xl italic pr-0.5">P</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center">
                        PRO<span className="text-blue-500">ERP</span>
                    </h1>
                </div>

                <div className="w-full max-w-[480px] relative">
                    {/* Glassmorphism Card */}
                    <div className="bg-[#0f172a]/60 backdrop-blur-2xl border border-blue-500/20 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(59,130,246,0.1)] p-8 sm:p-12 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        
                        {/* Top glowing edge */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80"></div>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-blue-500/20 blur-[30px] rounded-full"></div>

                        {/* Top Arched Graphic Illustration */}
                        <div className="w-full h-32 mb-8 rounded-t-full bg-gradient-to-b from-blue-900/40 to-transparent border-t border-blue-400/30 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-20"></div>
                            <MonitorPlay className="w-12 h-12 text-blue-400/50" />
                            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#0f172a]/60 to-transparent"></div>
                        </div>

                        <div className="text-center mb-8">
                            <h3 className="text-3xl font-bold text-white mb-3">Xush kelibsiz!</h3>
                            <p className="text-sm text-gray-400 font-medium">Hisobingizga kirish uchun ma'lumotlaringizni kiriting</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                                        <User size={20} />
                                    </div>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Foydalanuvchi nomi"
                                        className="w-full bg-[#1e293b]/50 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-500 outline-none focus:border-blue-500 focus:bg-[#1e293b]/80 transition-all font-medium"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Parol"
                                        className="w-full bg-[#1e293b]/50 border border-gray-700 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-gray-500 outline-none focus:border-blue-500 focus:bg-[#1e293b]/80 transition-all font-medium"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl flex items-center gap-3 animate-shake">
                                    <Activity size={18} className="shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input type="checkbox" className="peer sr-only" defaultChecked />
                                        <div className="w-5 h-5 bg-[#1e293b] border border-gray-600 rounded md:rounded-[6px] group-hover:border-blue-500 transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600"></div>
                                        <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Meni eslab qolish</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors hover:underline decoration-blue-500/30 underline-offset-4"
                                >
                                    Parolni unutdingiz?
                                </button>
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? (
                                    <Activity size={24} className="animate-spin text-white/70" />
                                ) : (
                                    <>
                                        <LogIn size={20} />
                                        <span>Kirish</span>
                                    </>
                                )}
                            </button>
                            
                            <div className="flex items-center gap-4 my-6 opacity-60">
                                <div className="h-px bg-gray-700 flex-1"></div>
                                <span className="text-xs text-gray-400 uppercase tracking-wider">yoki</span>
                                <div className="h-px bg-gray-700 flex-1"></div>
                            </div>

                            <button
                                type="button"
                                className="w-full bg-[#1e293b]/40 hover:bg-[#1e293b] border border-gray-700 text-white font-medium py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                <ShieldCheck size={18} className="text-gray-400" />
                                <span>Single Sign-On (SSO)</span>
                            </button>
                        </form>
                    </div>

                    {/* Security Footer */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 text-sm">
                        <Lock size={14} />
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
