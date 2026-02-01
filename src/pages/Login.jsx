import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, Activity, ShieldCheck, Shirt, X, AlertCircle } from 'lucide-react';

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
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-md relative z-10 transition-all duration-500">
                {/* Logo Section */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-600/30 mb-6 rotate-3 transform hover:rotate-0 transition-transform duration-500">
                        <Shirt size={48} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter flex items-center justify-center gap-2">
                        ZIOTTO <span className="bg-indigo-600/20 text-indigo-500 px-3 py-1 rounded-xl">ERP</span>
                    </h1>
                    <p className="text-gray-500 text-[10px] font-black mt-3 uppercase tracking-[0.3em]">To'qimachilik Boshqaruv Tizimi</p>
                </div>

                {/* Login Card */}
                <div className="bg-[#161b22]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-3xl shadow-black/50 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-50"></div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Foydalanuvchi Ismi</label>
                            <div className="relative group">
                                <Shirt className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    required
                                    type="text"
                                    placeholder="Ismingizni kiriting"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4.5 pl-14 pr-5 text-white placeholder:text-gray-700 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold uppercase tracking-wider"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Maxsus Kod (Parol)</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4.5 pl-14 pr-14 text-white placeholder:text-gray-700 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all font-mono text-xl tracking-widest leading-none"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors p-1"
                                >
                                    {showPassword ? <Activity size={18} className="text-indigo-500" /> : <ShieldCheck size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-500/5 border border-rose-500/20 text-rose-500 text-xs font-bold p-5 rounded-2xl flex items-center gap-3 animate-shake overflow-hidden relative">
                                <div className="absolute left-0 top-0 h-full w-1 bg-rose-500"></div>
                                <Activity size={18} />
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between px-2 pt-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        defaultChecked
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 bg-black/40 border border-white/10 rounded-lg group-hover:border-indigo-500/50 transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                    </div>
                                </div>
                                <span className="text-[11px] text-gray-500 font-bold group-hover:text-gray-300 transition-colors uppercase tracking-widest">Meni eslab qol</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="text-[11px] text-indigo-400 font-black hover:text-indigo-300 transition-all uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                            >
                                PAROLNI UNUTDINGIZMI?
                            </button>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-2xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-4 group"
                        >
                            {loading ? (
                                <Activity size={24} className="animate-spin text-white/50" />
                            ) : (
                                <>
                                    <span className="text-sm uppercase tracking-[0.2em]">Tizimga Kirish</span>
                                    <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="mt-12 flex items-center justify-center gap-8 text-gray-700">
                    <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all hover:text-gray-400">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">ZIOTTO ERP v2.0</span>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal - FIXED: Ensure it stays on top and has dark bg */}
            {showForgotModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-sm rounded-[3rem] p-10 shadow-4xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={() => setShowForgotModal(false)} className="text-gray-600 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 mx-auto mb-8 shadow-inner">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-white text-center mb-4 tracking-tight">Parolni tiklash</h3>
                        <p className="text-gray-400 text-center text-sm leading-relaxed mb-10 font-medium">
                            Parolni tiklash yoki o'zgartirish uchun <br />
                            <span className="text-indigo-400 font-black uppercase tracking-widest border-b-2 border-indigo-500/30 pb-1 mt-2 inline-block">Plan (Rejalashtirish)</span> <br />
                            bo'limiga murojaat qiling.
                        </p>
                        <button
                            onClick={() => setShowForgotModal(false)}
                            className="w-full bg-white text-black font-black py-5 rounded-2xl transition-all hover:bg-gray-200 active:scale-95 shadow-xl shadow-white/5 uppercase tracking-widest text-xs"
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
