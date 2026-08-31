import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Activity,
    ArrowRight,
    Eye,
    EyeOff,
    Lock,
    LogIn,
    QrCode,
    ShieldCheck,
    User,
    UsersRound,
    Zap,
} from 'lucide-react';

const ProErpLogo = ({ className = 'w-20 h-20' }) => (
    <svg className={`${className} shrink-0 drop-shadow-[0_0_24px_rgba(0,198,255,0.72)]`} viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <defs>
            <linearGradient id="proerp-logo-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#0062ff" />
            </linearGradient>
            <linearGradient id="proerp-logo-deep" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0052d4" />
                <stop offset="100%" stopColor="#6fb1fc" />
            </linearGradient>
        </defs>
        <g strokeLinejoin="round" strokeLinecap="round">
            <path d="M20 30 32 23v54L20 70Z" fill="#0b2545" />
            <path d="m32 23 12 7v40L32 77Z" fill="url(#proerp-logo-deep)" />
            <path d="m44 30 36 14-12 9-24-13Z" fill="url(#proerp-logo-blue)" />
            <path d="M80 44v12L68 65V53Z" fill="#0385db" />
            <path d="m44 40 24 13-12 8-24-14Z" fill="url(#proerp-logo-deep)" />
            <path d="m32 60 24 14 24-14-12-7-12 8-24-14Z" fill="url(#proerp-logo-blue)" opacity=".85" />
            <path d="m32 77 24 13 24-14V60L56 74 32 60Z" fill="url(#proerp-logo-deep)" />
            <path d="m32 23 12 7m0 0 36 14M32 23v54" stroke="white" strokeOpacity=".65" strokeWidth="1.5" />
        </g>
    </svg>
);

const Feature = ({ icon: Icon, title, description, tone }) => (
    <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${tone}`}>
            <Icon size={22} strokeWidth={2.2} />
        </div>
        <p className="max-w-[155px] text-[14px] font-medium leading-5 text-slate-100">{title}<br />{description}</p>
    </div>
);

const WorldMap = () => (
    <svg className="absolute inset-x-0 top-8 h-[330px] w-full opacity-45" viewBox="0 0 800 330" fill="none" aria-hidden="true">
        <defs>
            <pattern id="map-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="#159bff" /></pattern>
            <filter id="map-glow"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path d="M28 118 74 79l73-19 61 25 47-19 31 28-23 21 3 39-35 16-10 42-35-12-33-61-59 12-33-18-4-35Zm283-63 70-20 63 25 67-7 58 40-15 26 26 32-49 31-62-15-34 27-65-12-30-49-34-22Zm257 145 42-9 45 25 12 43-26 35-49-4-38-42Z" fill="url(#map-dots)" filter="url(#map-glow)" />
        <path d="M16 205C142 135 234 237 351 164c113-70 216 38 428-65" stroke="#0878ec" strokeOpacity=".42" strokeWidth="1" />
        <g fill="#38bdf8"><circle cx="76" cy="169" r="4" /><circle cx="288" cy="123" r="3" /><circle cx="480" cy="112" r="4" /><circle cx="653" cy="221" r="3" /></g>
    </svg>
);

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showRecovery, setShowRecovery] = useState(false);
    const { login, tenant } = useAuth();
    const navigate = useNavigate();
    const companyName = tenant?.name || 'PROERP';

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error: loginError } = await login(email, password);
            if (loginError) throw loginError;
            navigate('/');
        } catch (loginFailure) {
            setError(loginFailure.message || 'Email yoki parol noto‘g‘ri.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="box-border min-h-screen overflow-x-hidden bg-[#020817] p-3 text-white sm:p-5 lg:p-7">
            <section className="relative isolate mx-auto grid min-h-[calc(100vh-24px)] max-w-[1800px] overflow-hidden rounded-[30px] border border-[#1d4c92]/50 bg-[#04112a] shadow-[0_30px_100px_rgba(0,0,0,0.55)] lg:h-[calc(100vh-56px)] xl:grid-cols-[1.35fr_0.95fr]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_72%,rgba(0,128,255,.23),transparent_27%),radial-gradient(circle_at_67%_8%,rgba(0,102,255,.18),transparent_22%),linear-gradient(120deg,rgba(3,15,42,.3),rgba(2,8,24,.82))]" />
                <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(35,117,218,.09)_1px,transparent_1px),linear-gradient(90deg,rgba(35,117,218,.07)_1px,transparent_1px)] [background-size:48px_48px]" />

                <div className="relative hidden min-h-full flex-col justify-between overflow-hidden p-10 xl:flex xl:p-14">
                    <WorldMap />
                    <header className="relative z-10 flex items-center gap-4">
                        {tenant?.logo_url ? <img src={tenant.logo_url} alt={companyName} className="h-24 w-24 object-contain" /> : <ProErpLogo className="h-24 w-24" />}
                        <div>
                            <h1 className="text-5xl font-black leading-none tracking-tight"><span className="text-white">PRO</span><span className="text-[#087dff]">ERP</span></h1>
                            <div className="mt-3 flex items-center gap-3 text-[11px] font-bold tracking-[.15em] text-slate-200"><span className="h-px w-9 bg-slate-400" />BIZNESINGIZ UCHUN OSON BOSHQARUV<span className="h-px w-9 bg-slate-400" /></div>
                        </div>
                    </header>

                    <div className="relative z-10 mt-16 max-w-[690px]">
                        <h2 className="text-[clamp(42px,4.2vw,68px)] font-black leading-[1.06] tracking-[-.04em]">Korxonangizni raqamli kelajakka <span className="text-[#00d8ff]">biz bilan</span> olib boring.</h2>
                        <div className="mt-9 grid max-w-[620px] grid-cols-2 gap-x-11 gap-y-7 border-l border-cyan-300/30 pl-7">
                            <Feature icon={ShieldCheck} title="Xavfsiz va ishonchli" description="ma'lumotlar" tone="border-violet-400/45 bg-violet-500/20 text-violet-200" />
                            <Feature icon={Zap} title="Tezkor va samarali" description="ishlash" tone="border-emerald-400/45 bg-emerald-500/20 text-emerald-200" />
                            <Feature icon={LogIn} title="Barcha jarayonlar" description="bir platformada" tone="border-blue-400/45 bg-blue-500/20 text-blue-200" />
                            <Feature icon={UsersRound} title="Jamoa bilan qulay" description="hamkorlik" tone="border-orange-300/45 bg-orange-500/20 text-orange-100" />
                        </div>
                    </div>

                    <div className="relative z-10 mt-8 max-w-[760px]">
                        <img src="/dashboard_mockup.png" alt="ProERP boshqaruv paneli" className="mx-auto max-h-[340px] w-full object-contain object-bottom drop-shadow-[0_22px_34px_rgba(0,93,255,.36)]" />
                    </div>
                </div>

                <div className="relative flex items-center justify-center bg-[linear-gradient(135deg,rgba(7,28,73,.9),rgba(2,12,37,.94))] p-5 sm:p-8 lg:p-10 xl:p-14">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_14%,rgba(0,183,255,.22),transparent_25%),radial-gradient(circle_at_14%_80%,rgba(28,72,190,.24),transparent_35%)]" />
                    <div className="relative w-full max-w-[610px] overflow-hidden rounded-[30px] border border-cyan-200/70 bg-[#071a45]/70 shadow-[0_0_0_1px_rgba(0,132,255,.23),0_30px_80px_rgba(0,0,0,.48),inset_0_1px_0_rgba(255,255,255,.3)] backdrop-blur-xl">
                        <div className="relative h-40 overflow-hidden border-b border-cyan-300/25 sm:h-48">
                            <img src="/login_arch_team.png" alt="ProERP boshqaruv markazi" className="h-full w-full object-cover object-center opacity-80" />
                            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(4,21,68,.04),rgba(4,20,61,.93))]" />
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent" />
                        </div>
                        <div className="relative px-7 pb-8 pt-7 sm:px-12 sm:pb-10 sm:pt-8">
                            <div className="mb-7 text-center">
                                <h3 className="text-3xl font-black tracking-tight sm:text-[40px]">Xush kelibsiz!</h3>
                                <p className="mt-2 text-sm text-blue-100/75 sm:text-base">Boshqaruv paneliga kirish uchun ma'lumotlaringizni kiriting</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <label className="block">
                                    <span className="sr-only">Email yoki Login</span>
                                    <span className="flex h-16 overflow-hidden rounded-2xl border border-cyan-100/35 bg-[#081b45]/90 shadow-inner transition focus-within:border-cyan-200 focus-within:ring-2 focus-within:ring-cyan-400/20">
                                        <span className="flex w-16 items-center justify-center border-r border-cyan-100/20 bg-[#0c2d67] text-cyan-100"><User size={23} /></span>
                                        <input required type="text" autoComplete="username" placeholder="Email yoki Login (masalan: ADMIN)" value={email} onChange={(event) => setEmail(event.target.value)} className="min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-white outline-none placeholder:text-blue-200/55" />
                                    </span>
                                </label>
                                <label className="block">
                                    <span className="sr-only">Parol yoki Kod</span>
                                    <span className="flex h-16 overflow-hidden rounded-2xl border border-cyan-100/35 bg-[#081b45]/90 shadow-inner transition focus-within:border-cyan-200 focus-within:ring-2 focus-within:ring-cyan-400/20">
                                        <span className="flex w-16 items-center justify-center border-r border-cyan-100/20 bg-[#0c2d67] text-cyan-100"><Lock size={23} /></span>
                                        <input required type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Parol yoki Kod (Master PIN: 9999)" value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-white outline-none placeholder:text-blue-200/55" />
                                        <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="w-14 text-blue-100/75 transition hover:text-white" aria-label="Parolni ko‘rsatish">
                                            {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                        </button>
                                    </span>
                                </label>

                                {error && <div className="rounded-xl border border-rose-300/35 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">{error}</div>}

                                <div className="flex items-center justify-between gap-4 pt-1 text-sm">
                                    <span className="flex items-center gap-2 text-blue-100/70"><ShieldCheck size={16} className="text-cyan-300" />Himoyalangan ulanish</span>
                                    <button type="button" onClick={() => setShowRecovery(true)} className="font-semibold text-cyan-300 transition hover:text-cyan-100">Parolni unutdingizmi?</button>
                                </div>

                                <button disabled={loading} type="submit" className="mt-2 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#1559ff] via-[#087dff] to-[#00c9ef] text-lg font-black shadow-[0_15px_30px_rgba(0,111,255,.3)] transition hover:brightness-110 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60">
                                    {loading ? <><Activity className="animate-spin" size={22} />Kirilmoqda...</> : <><LogIn size={24} />Kirish</>}
                                </button>

                                <div className="flex items-center gap-4 py-2"><span className="h-px flex-1 bg-cyan-100/20" /><span className="text-xs text-blue-100/60">yoki</span><span className="h-px flex-1 bg-cyan-100/20" /></div>
                                <button type="button" onClick={() => navigate('/attendance')} className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-cyan-200/55 bg-[#06163b]/70 font-bold text-cyan-100 transition hover:border-cyan-100 hover:bg-cyan-400/10"><QrCode size={20} />Davomat uchun QR skaner</button>
                            </form>

                            <p className="mt-6 text-center text-xs text-blue-100/60">Akkaunt kerakmi? <a href="mailto:info@proerp.uz" className="font-bold text-cyan-300 hover:text-cyan-100">Administrator bilan bog'laning</a></p>
                        </div>
                    </div>
                </div>
            </section>

            {showRecovery && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020817]/80 p-5 backdrop-blur-md">
                    <div className="w-full max-w-sm rounded-3xl border border-cyan-100/30 bg-[#071a45] p-7 text-center shadow-2xl">
                        <ShieldCheck className="mx-auto text-cyan-300" size={38} />
                        <h4 className="mt-4 text-xl font-black">Kirishni tiklash</h4>
                        <p className="mt-3 text-sm leading-6 text-blue-100/70">Parolni yangilash uchun kompaniyangiz administratori bilan bog'laning.</p>
                        <button type="button" onClick={() => setShowRecovery(false)} className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-bold transition hover:bg-blue-500">Tushunarli</button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Login;
