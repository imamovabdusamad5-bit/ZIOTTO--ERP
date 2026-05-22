/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../lib/supabase';
import {
    Clock,
    UserCheck,
    UserX,
    Camera,
    ChevronLeft,
    History,
    Zap,
    CircleCheck,
    CircleAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AttendanceScanner = () => {
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [scannerStatus, setScannerStatus] = useState('idle');
    const [statusMsg, setStatusMsg] = useState('');
    const [lastScannedCode, setLastScannedCode] = useState(null);
    const scannerRef = useRef(null);

    async function fetchRecentLogs() {
        const { data, error } = await supabase
            .from('attendance')
            .select('*, profiles(full_name, username, department)')
            .eq('date', new Date().toISOString().split('T')[0])
            .order('check_in', { ascending: false })
            .limit(5);

        if (!error) setRecentAttendance(data || []);
    };

    useEffect(() => {
        fetchRecentLogs();

        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            aspectRatio: 1.0
        });

        scanner.render(onScanSuccess, onScanError);

        function onScanError(err) {
            // console.warn(err);
        }

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear scanner. ", error);
            });
        };
    }, []);

    const onScanSuccess = async (decodedText) => {
        // Prevent double scanning same code immediately
        if (loading || (lastScannedCode === decodedText && scannerStatus === 'success')) return;

        setLastScannedCode(decodedText);
        setLoading(true);
        setScannerStatus('scanning');
        setStatusMsg('Qidirilmoqda...');

        try {
            // 1. Find profile by unique_code
            const { data: profile, error: profError } = await supabase
                .from('profiles')
                .select('*')
                .eq('unique_code', decodedText)
                .single();

            if (profError || !profile) {
                throw new Error("Xodim topilmadi yoki unikal kod xato!");
            }

            const today = new Date().toISOString().split('T')[0];
            const now = new Date();

            // 2. Check if already checked in today
            const { data: existing, error: attError } = await supabase
                .from('attendance')
                .select('*')
                .eq('profile_id', profile.id)
                .eq('date', today)
                .single();

            if (attError && attError.code !== 'PGRST116') throw attError;

            if (!existing) {
                // FIRST SCAN TODAY -> CHECK IN
                const startTime = new Date();
                startTime.setHours(8, 30, 0); // 08:30 threshold for lateness

                const isLate = now > startTime;
                const lateMin = isLate ? Math.floor((now - startTime) / 60000) : 0;

                const record = {
                    profile_id: profile.id,
                    date: today,
                    check_in: now.toISOString(),
                    status: isLate ? 'late' : 'present',
                    late_minutes: lateMin,
                    efficiency: 100
                };

                const { error: insError } = await supabase.from('attendance').insert(record);
                if (insError) throw insError;

                setScannerStatus('success');
                setStatusMsg(`Xush kelibsiz, ${profile.full_name || profile.username}! Kirish qayd etildi.`);
            } else if (!existing.check_out) {
                // SECOND SCAN TODAY -> CHECK OUT
                const { error: updError } = await supabase
                    .from('attendance')
                    .update({ check_out: now.toISOString() })
                    .eq('id', existing.id);

                if (updError) throw updError;

                setScannerStatus('success');
                setStatusMsg(`Yaxshi dam oling, ${profile.full_name || profile.username}! Chiqish qayd etildi.`);
            } else {
                // ALREADY CHECKED OUT
                setScannerStatus('error');
                setStatusMsg("Bugun uchun kirish-chiqish tugatilgan.");
            }

            fetchRecentLogs();

            // Auto-reset status after 3 seconds
            setTimeout(() => {
                setScannerStatus('idle');
                setStatusMsg('');
                setLastScannedCode(null);
            }, 3000);

        } catch (err) {
            setScannerStatus('error');
            setStatusMsg(err.message);
            setTimeout(() => setScannerStatus('idle'), 4000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-body)] flex flex-col md:flex-row overflow-hidden">
            {/* Left Side: Scanner */}
            <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center relative">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-8 left-8 p-4 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-[1.5rem] hover:text-[var(--text-primary)] transition-all"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">QR Skaner</h2>
                    <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Xodimlarning keldi-ketdisini qayd etish</p>
                </div>

                <div className="w-full max-w-md relative group">
                    {/* Scanner Frame Decoration */}
                    <div className="absolute -inset-4 bg-indigo-600/20 rounded-[4rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>

                    <div className={`relative bg-[var(--bg-card)] border-4 rounded-[3.5rem] overflow-hidden shadow-4xl transition-all duration-500 ${scannerStatus === 'success' ? 'border-emerald-500 shadow-emerald-500/20' :
                            scannerStatus === 'error' ? 'border-rose-500 shadow-rose-500/20' :
                                scannerStatus === 'scanning' ? 'border-indigo-500 animate-pulse' : 'border-[var(--border-color)]'
                        }`}>
                        <div id="reader" className="w-full"></div>

                        {/* Overlay Status */}
                        <AnimatePresence>
                            {scannerStatus !== 'idle' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={`absolute inset-0 flex flex-col items-center justify-center p-8 backdrop-blur-md z-10 ${scannerStatus === 'success' ? 'bg-emerald-600/80' :
                                            scannerStatus === 'error' ? 'bg-rose-600/80' : 'bg-indigo-600/80'
                                        }`}
                                >
                                    {scannerStatus === 'success' ? <CircleCheck size={80} className="text-white mb-6 animate-bounce" /> :
                                        scannerStatus === 'error' ? <CircleAlert size={80} className="text-white mb-6" /> :
                                            <Zap size={80} className="text-white mb-6 animate-pulse" />}

                                    <p className="text-white text-center font-black text-xl tracking-tight leading-tight">
                                        {statusMsg}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Laser Scanner Animation */}
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[scan_2s_infinite] pointer-events-none opacity-50"></div>
                </div>

                <div className="mt-12 flex items-center gap-4 text-[var(--text-secondary)] bg-[var(--bg-card)] px-8 py-4 rounded-3xl border border-[var(--border-color)]">
                    <Camera size={20} className="text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-widest">QR kodni kamera qarshisiga tuting</span>
                </div>
            </div>

            {/* Right Side: Log */}
            <div className="w-full md:w-[450px] bg-[var(--bg-card)] border-l border-[var(--border-color)] p-8 md:p-12 overflow-y-auto hidden md:block">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                        <History size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Bugungi jurnali</h3>
                        <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">So'nggi 5 ta harakat</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {recentAttendance.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-[var(--border-color)] rounded-[2.5rem]">
                            <History size={40} className="mx-auto text-[var(--border-color)] mb-4" />
                            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Hozircha ma'lumot yo'q</p>
                        </div>
                    ) : (
                        recentAttendance.map((log) => (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                key={log.id}
                                className="bg-[var(--bg-body)] p-6 rounded-[2rem] border border-[var(--border-color)] group hover:border-indigo-500/30 transition-all"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 font-black">
                                            {log.profiles?.username?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-[var(--text-primary)] text-sm">{log.profiles?.full_name || log.profiles?.username}</p>
                                            <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{log.profiles?.department}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${log.status === 'late' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                                        }`}>
                                        {log.status === 'late' ? 'Kechikish' : 'Vaqtida'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Kirish</p>
                                        <p className="text-sm font-black text-[var(--text-primary)] font-mono">
                                            {new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-xl border ${log.check_out ? 'bg-purple-500/5 border-purple-500/10' : 'bg-[var(--bg-card)] border-[var(--border-color)] opacity-50'}`}>
                                        <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">Chiqish</p>
                                        <p className="text-sm font-black text-[var(--text-primary)] font-mono">
                                            {log.check_out ? new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0%, 100% { top: 10%; }
                    50% { top: 90%; }
                }
                #reader__scan_region video {
                    object-fit: cover !important;
                    border-radius: 2rem !important;
                }
                #reader {
                    border: none !important;
                }
                #reader__dashboard_section_csr button {
                    display: block;
                    width: 100%;
                    padding: 1rem;
                    background: var(--bg-body);
                    border: 1px solid var(--border-color);
                    border-radius: 1rem;
                    color: var(--text-primary);
                    font-weight: bold;
                    margin-top: 1rem;
                }
            `}</style>
        </div>
    );
};

export default AttendanceScanner;
