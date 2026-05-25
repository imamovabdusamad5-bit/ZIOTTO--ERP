import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Activity, 
    X, 
    CircleAlert
} from 'lucide-react';

const ProErpLogo = () => (
    <svg className="filter drop-shadow-[0_0_20px_rgba(56,189,248,0.7)] shrink-0" viewBox="0 0 100 100" fill="none" width="90" height="90" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logoBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#0072ff" />
            </linearGradient>
            <linearGradient id="logoCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="logoDark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0b2545" />
                <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
        </defs>
        <g strokeLinejoin="round" strokeLinecap="round">
            {/* Left face */}
            <path d="M15 30 L45 13 L45 87 L15 70 Z" fill="url(#logoDark)" />
            {/* Top Right face */}
            <path d="M45 13 L85 36 L85 53 L70 61 L70 45 L45 31 Z" fill="url(#logoBlue)" />
            {/* Bottom Right face */}
            <path d="M70 61 L85 53 L85 70 L45 93 L15 76 L30 67 L45 76 Z" fill="url(#logoCyan)" />
            {/* Center P Inner loop */}
            <path d="M45 31 L70 45 L70 61 L45 76 L30 67 L30 51 L45 60 L45 42 M45 42 L30 34 Z" fill="url(#logoBlue)" opacity="0.9" />
            {/* Highlights */}
            <path d="M45 13 L85 36" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
            <path d="M15 30 L45 13" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
            <path d="M45 93 L85 70" stroke="#00f2fe" strokeWidth="2" opacity="0.8" />
            <path d="M15 76 L45 93" stroke="#00f2fe" strokeWidth="1.5" opacity="0.6" />
        </g>
    </svg>
);

const Login = () => {
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
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
        <div className="login-page-container">
            {/* Direct Injection of User's Exact Custom CSS Styles */}
            <style dangerouslySetInnerHTML={{__html: `
                .login-page-container {
                    width: 100%;
                    height: 100vh;
                    background: #020817;
                    color: white;
                    overflow: hidden;
                    font-family: 'Inter', sans-serif;
                }

                .container {
                    width: 100%;
                    height: 100vh;
                    display: flex;
                }

                /* LEFT SIDE */
                .left {
                    width: 55%;
                    height: 100%;
                    padding: 60px;
                    background: radial-gradient(circle at top left, #0f172a, #020617 60%);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .logo {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    margin-bottom: 40px;
                }

                .logo h1 {
                    font-size: 64px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    line-height: 1;
                }

                .logo span {
                    color: #2ea8ff;
                }

                .tagline {
                    margin-top: -5px;
                    color: #94a3b8;
                    font-size: 14px;
                    letter-spacing: 2px;
                }

                .title {
                    font-size: 58px;
                    line-height: 1.2;
                    font-weight: 700;
                    margin-top: 20px;
                    max-width: 700px;
                }

                .title span {
                    color: #2ea8ff;
                }

                .desc {
                    margin-top: 30px;
                    color: #94a3b8;
                    font-size: 18px;
                    line-height: 1.8;
                    max-width: 650px;
                }

                .features {
                    display: flex;
                    gap: 20px;
                    margin-top: 50px;
                    flex-wrap: wrap;
                }

                .feature {
                    width: 180px;
                    height: 110px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 18px;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(10px);
                    padding: 20px;
                    transition: 0.3s;
                }

                .feature:hover {
                    transform: translateY(-5px);
                    border-color: #2ea8ff;
                    box-shadow: 0 0 20px rgba(46, 168, 255, .2);
                }

                .feature h3 {
                    margin-top: 12px;
                    font-size: 18px;
                }

                .feature p {
                    color: #94a3b8;
                    font-size: 13px;
                    margin-top: 8px;
                }

                /* RIGHT SIDE */
                .right {
                    width: 45%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: radial-gradient(circle at center, #0f172a, #020617 70%);
                    position: relative;
                }

                .login-box {
                    width: 480px;
                    padding: 50px;
                    border-radius: 28px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(18px);
                    box-shadow: 0 0 40px rgba(0, 0, 0, .4);
                }

                .login-box h2 {
                    font-size: 42px;
                    margin-bottom: 10px;
                    font-weight: 700;
                }

                .login-box p {
                    color: #94a3b8;
                    margin-bottom: 35px;
                    font-size: 15px;
                }

                .input-group {
                    margin-bottom: 20px;
                }

                .input-group label {
                    display: block;
                    margin-bottom: 10px;
                    font-size: 14px;
                    color: #cbd5e1;
                    font-weight: 500;
                }

                .input-group input {
                    width: 100%;
                    height: 58px;
                    background: #0f172a;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 14px;
                    padding: 0 18px;
                    color: white;
                    font-size: 15px;
                    outline: none;
                    transition: 0.3s;
                }

                .input-group input:focus {
                    border-color: #2ea8ff;
                    box-shadow: 0 0 12px rgba(46, 168, 255, .25);
                }

                .login-btn {
                    width: 100%;
                    height: 58px;
                    border: none;
                    border-radius: 14px;
                    background: linear-gradient(90deg, #2563eb, #38bdf8);
                    color: white;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 10px;
                    transition: 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }

                .login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 0 20px rgba(56, 189, 248, .35);
                }

                .login-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .extra {
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                    color: #94a3b8;
                    font-size: 14px;
                    align-items: center;
                }

                .extra label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .extra a {
                    color: #38bdf8;
                    text-decoration: none;
                    font-weight: 500;
                }

                .extra a:hover {
                    text-decoration: underline;
                }

                .footer {
                    margin-top: 35px;
                    text-align: center;
                    color: #64748b;
                    font-size: 13px;
                }

                .error-alert {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    padding: 12px 16px;
                    border-radius: 12px;
                    font-size: 14px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                /* RESPONSIVE */
                @media(max-width: 1200px) {
                    .login-page-container {
                        overflow-y: auto;
                        height: auto;
                    }

                    .container {
                        flex-direction: column;
                        height: auto;
                    }

                    .left,
                    .right {
                        width: 100%;
                        height: auto;
                    }

                    .left {
                        padding: 40px;
                    }

                    .title {
                        font-size: 42px;
                    }

                    .login-box {
                        width: 90%;
                        margin: 40px auto;
                        padding: 30px;
                    }
                }
            `}} />

            <div className="container">

                {/* LEFT */}
                <div className="left">
                    <div className="logo">
                        {/* High-visibility vector logo that matches the pixel-perfect layout and size */}
                        <ProErpLogo />

                        <div>
                            <h1>PRO<span>ERP</span></h1>
                            <div className="tagline">
                                BIZNESNI OSON BOSHQARUV
                            </div>
                        </div>
                    </div>

                    <div className="title">
                        Korxonangizni <span>raqamli kelajakka</span> biz bilan olib chiqing
                    </div>

                    <div className="desc">
                        PROERP — korxonalarni yagona platformada boshqarish,
                        ishlab chiqarish, ombor, HR, CRM va moliyaviy jarayonlarni
                        avtomatlashtirish uchun zamonaviy ERP yechimi.
                    </div>

                    <div className="features">
                        <div className="feature">
                            <span style={{ fontSize: '24px' }}>📦</span>
                            <h3>Ombor</h3>
                            <p>Mato va aksessuar nazorati</p>
                        </div>

                        <div className="feature">
                            <span style={{ fontSize: '24px' }}>👥</span>
                            <h3>HRM</h3>
                            <p>Xodimlar boshqaruvi</p>
                        </div>

                        <div className="feature">
                            <span style={{ fontSize: '24px' }}>📊</span>
                            <h3>Analitika</h3>
                            <p>Real vaqt statistikasi</p>
                        </div>

                        <div className="feature">
                            <span style={{ fontSize: '24px' }}>🔒</span>
                            <h3>Xavfsizlik</h3>
                            <p>Himoyalangan tizim</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="right">
                    <div className="login-box">
                        <h2>Tizimga kirish</h2>
                        <p>
                            Hisobingizga kirish uchun ma'lumotlarni kiriting
                        </p>

                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="error-alert">
                                    <CircleAlert size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="input-group">
                                <label>Login yoki email</label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="Login kiriting"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label>Parol</label>
                                <input 
                                    required
                                    type="password" 
                                    placeholder="Parol kiriting"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                            </div>

                            <button type="submit" className="login-btn" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Activity size={18} className="animate-spin" />
                                        <span>Kirilmoqda...</span>
                                    </>
                                ) : (
                                    <span>Kirish</span>
                                )}
                            </button>
                        </form>

                        <div className="extra">
                            <label>
                                <input type="checkbox" defaultChecked />
                                Meni eslab qol
                            </label>

                            <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }}>
                                Parolni unutdingizmi?
                            </a>
                        </div>

                        <div className="footer">
                            © 2026 PROERP. Barcha huquqlar himoyalangan.
                        </div>
                    </div>
                </div>

            </div>

            {/* Forgot Password Modal */}
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
