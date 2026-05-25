import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Activity, 
    X, 
    CircleAlert
} from 'lucide-react';

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
            {/* Direct Injection of User's Exact Custom CSS Styles (V3 with Imgur Logo) */}
            <style dangerouslySetInnerHTML={{__html: `
                .login-page-container {
                    width: 100%;
                    height: 100vh;
                    background: #020617;
                    color: white;
                    overflow: hidden;
                    font-family: 'Inter', sans-serif;
                }

                html, body {
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }

                .login-page-container {
                    background:
                    radial-gradient(circle at top left, #0f172a, #020617 45%),
                    radial-gradient(circle at bottom right, #111827, #020617 50%);
                }

                .container {
                    width: 100%;
                    min-height: 100vh;
                    display: flex;
                }

                /* LEFT */
                .left {
                    width: 60%;
                    padding: 60px 70px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    position: relative;
                }

                .logo {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    margin-bottom: 45px;
                }

                .logo img {
                    width: 85px;
                    height: 85px;
                    object-fit: contain;
                }

                .logo-text h1 {
                    font-size: 58px;
                    font-weight: 800;
                    line-height: 1;
                }

                .logo-text span {
                    color: #2ea8ff;
                }

                .logo-text p {
                    color: #94a3b8;
                    margin-top: 8px;
                    font-size: 12px;
                    letter-spacing: 3px;
                }

                .title {
                    font-size: 72px;
                    font-weight: 800;
                    line-height: 1.1;
                    max-width: 820px;
                }

                .title span {
                    color: #2ea8ff;
                }

                .description {
                    margin-top: 35px;
                    max-width: 650px;
                    color: #94a3b8;
                    font-size: 18px;
                    line-height: 1.8;
                }

                /* FEATURES */
                .features {
                    display: flex;
                    gap: 22px;
                    margin-top: 55px;
                    flex-wrap: wrap;
                }

                .feature-box {
                    width: 190px;
                    height: 135px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    backdrop-filter: blur(20px);
                    padding: 22px;
                    transition: .3s;
                }

                .feature-box:hover {
                    transform: translateY(-5px);
                    border-color: #38bdf8;
                    box-shadow: 0 0 20px rgba(56, 189, 248, .25);
                }

                .icon {
                    width: 54px;
                    height: 54px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    background: linear-gradient(135deg, #2563eb, #38bdf8);
                }

                .feature-box h3 {
                    margin-top: 16px;
                    font-size: 21px;
                    font-weight: 700;
                }

                .feature-box p {
                    margin-top: 7px;
                    color: #94a3b8;
                    font-size: 14px;
                }

                /* RIGHT */
                .right {
                    width: 40%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding-right: 70px;
                    position: relative;
                }

                /* GLOW */
                .right::before {
                    content: '';
                    position: absolute;
                    width: 500px;
                    height: 500px;
                    background: #2563eb;
                    filter: blur(160px);
                    opacity: .15;
                    pointer-events: none;
                }

                /* LOGIN CARD */
                .login-card {
                    width: 470px;
                    padding: 50px;
                    border-radius: 32px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(30px);
                    box-shadow: 0 0 40px rgba(0, 0, 0, .45), inset 0 0 0 1px rgba(255, 255, 255, .02);
                    position: relative;
                    z-index: 10;
                }

                .login-card h2 {
                    font-size: 48px;
                    margin-bottom: 12px;
                    font-weight: 800;
                }

                .sub {
                    color: #94a3b8;
                    font-size: 15px;
                    margin-bottom: 35px;
                }

                /* INPUT GROUP */
                .input-group {
                    margin-bottom: 22px;
                }

                .input-group label {
                    display: block;
                    margin-bottom: 10px;
                    color: #cbd5e1;
                    font-size: 14px;
                    font-weight: 500;
                }

                .input-group input {
                    width: 100%;
                    height: 62px;
                    border-radius: 18px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    background: #0f172a;
                    padding: 0 18px;
                    color: white;
                    font-size: 15px;
                    outline: none;
                    transition: .3s;
                }

                .input-group input:focus {
                    border-color: #38bdf8;
                    box-shadow: 0 0 20px rgba(56, 189, 248, .25);
                }

                /* BUTTON */
                .login-btn {
                    width: 100%;
                    height: 62px;
                    border: none;
                    border-radius: 18px;
                    background: linear-gradient(90deg, #2563eb, #38bdf8);
                    color: white;
                    font-size: 19px;
                    font-weight: 700;
                    cursor: pointer;
                    margin-top: 10px;
                    transition: .3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }

                .login-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 0 22px rgba(56, 189, 248, .35);
                }

                .login-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                /* OPTIONS */
                .options {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 22px;
                    font-size: 14px;
                    color: #94a3b8;
                }

                .options label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .options a {
                    color: #38bdf8;
                    text-decoration: none;
                    font-weight: 500;
                }

                .options a:hover {
                    text-decoration: underline;
                }

                /* FOOTER */
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    font-size: 13px;
                    color: #64748b;
                }

                .error-alert {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    padding: 12px 16px;
                    border-radius: 12px;
                    font-size: 14px;
                    margin-bottom: 22px;
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
                        padding: 50px 35px;
                    }

                    .right {
                        padding: 40px 20px;
                    }

                    .title {
                        font-size: 50px;
                    }

                    .login-card {
                        width: 100%;
                        max-width: 500px;
                        margin: 40px auto;
                        padding: 30px;
                    }
                }
            `}} />

            <div className="container">

                {/* LEFT */}
                <div className="left">
                    <div className="logo">
                        {/* Perfect glowing high-res Imgur Logo exactly as provided */}
                        <img src="https://i.imgur.com/8Km9tLL.png" alt="PROERP Logo" className="shrink-0" />

                        <div className="logo-text">
                            <h1>PRO<span>ERP</span></h1>
                            <p>BIZNESNI OSON BOSHQARUV</p>
                        </div>
                    </div>

                    <div className="title">
                        Korxonangizni <span>raqamli kelajakka</span> biz bilan olib chiqing
                    </div>

                    <div className="description">
                        PROERP — ishlab chiqarish, ombor, HR,
                        CRM va moliyaviy jarayonlarni yagona
                        platformada boshqaruvchi zamonaviy ERP tizimi.
                    </div>

                    <div className="features">
                        <div className="feature-box">
                            <div className="icon">📦</div>
                            <h3>Ombor</h3>
                            <p>Mato va aksessuar nazorati</p>
                        </div>

                        <div className="feature-box">
                            <div className="icon">👥</div>
                            <h3>HRM</h3>
                            <p>Xodimlar boshqaruvi</p>
                        </div>

                        <div className="feature-box">
                            <div className="icon">📊</div>
                            <h3>Analitika</h3>
                            <p>Real vaqt statistikasi</p>
                        </div>

                        <div className="feature-box">
                            <div className="icon">🔒</div>
                            <h3>Xavfsizlik</h3>
                            <p>Himoyalangan tizim</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="right">
                    <div className="login-card">
                        <h2>Tizimga kirish</h2>
                        <div className="sub">
                            Hisobingizga kirish uchun ma'lumotlaringizni kiriting
                        </div>

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

                        <div className="options">
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
