import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
    ScanFace, 
    QrCode, 
    UserCheck, 
    XCircle,
    CheckCircle2,
    Activity,
    LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';

const AttendanceScanner = () => {
    const { tenant } = useAuth();
    const navigate = useNavigate();
    const [mode, setMode] = useState('qr'); // 'qr' or 'face'
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const scannerRef = useRef(null);
    const videoRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [profiles, setProfiles] = useState([]);
    const isScanningFace = useRef(false);

    const isUltra = tenant?.plan_tier === 'ultra';

    useEffect(() => {
        if (mode === 'qr') {
            stopFaceScanner();
            startQrScanner();
        } else if (mode === 'face') {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
                scannerRef.current = null;
            }
            loadFaceDependencies();
        }
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
                scannerRef.current = null;
            }
            stopFaceScanner();
        };
    }, [mode]);

    const loadFaceDependencies = async () => {
        try {
            // Fetch users with face_descriptors
            const { data: users } = await supabase.from('profiles').select('*').not('face_descriptor', 'is', null);
            if (users) {
                setProfiles(users);
            }
            
            // Load models if not loaded
            if (!modelsLoaded) {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                ]);
                setModelsLoaded(true);
            }
            startFaceScanner();
        } catch (error) {
            console.error("Face init error:", error);
        }
    };

    const startFaceScanner = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                isScanningFace.current = true;
                scanFaceLoop();
            }
        } catch (error) {
            console.error("Camera error", error);
        }
    };

    const stopFaceScanner = () => {
        isScanningFace.current = false;
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    const scanFaceLoop = async () => {
        if (!isScanningFace.current || !videoRef.current || loading) {
            if (isScanningFace.current) requestAnimationFrame(scanFaceLoop);
            return;
        }

        try {
            const detection = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
            
            if (detection) {
                if (profiles.length === 0) {
                    setScanResult({
                        success: false,
                        user: "Tizimda yuzlar yo'q",
                        message: "Iltimos, avval Xodimlar bo'limidan yuzingizni ro'yxatdan o'tkazing."
                    });
                    setLoading(true);
                    setTimeout(() => {
                        setLoading(false);
                        setScanResult(null);
                    }, 3000);
                    return;
                }

                // Find best match manually
                let bestMatch = null;
                let minDistance = 0.55; // Relaxed threshold from 0.5 to 0.55
                
                profiles.forEach(profile => {
                    if (profile.face_descriptor) {
                        const dbDesc = new Float32Array(profile.face_descriptor);
                        const distance = faceapi.euclideanDistance(detection.descriptor, dbDesc);
                        if (distance < minDistance) {
                            minDistance = distance;
                            bestMatch = profile;
                        }
                    }
                });

                if (bestMatch) {
                    isScanningFace.current = false; // Pause
                    await handleScanSuccess(JSON.stringify({ id: bestMatch.id, code: bestMatch.unique_code }), null, bestMatch);
                    setTimeout(() => {
                        isScanningFace.current = true;
                        scanFaceLoop();
                    }, 4000);
                    return;
                } else {
                    // Face detected but not recognized
                    setScanResult({
                        success: false,
                        user: "Yuz taninmadi",
                        message: "Sizning yuzingiz bazada topilmadi. Yoki biroz yaqinroq keling."
                    });
                    setLoading(true);
                    setTimeout(() => {
                        setLoading(false);
                        setScanResult(null);
                    }, 2500);
                    return;
                }
            }
        } catch (e) {
            console.error(e);
        }
        
        requestAnimationFrame(scanFaceLoop);
    };

    const startQrScanner = () => {
        try {
            if (scannerRef.current) {
                scannerRef.current.clear();
            }
            
            // Generate a random ID for the div just to be safe
            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
                false
            );
            
            scanner.render(handleScanSuccess, handleScanFailure);
            scannerRef.current = scanner;
        } catch (error) {
            console.error("Scanner init error:", error);
        }
    };

    const handleScanSuccess = async (decodedText, decodedResult) => {
        if (loading) return; // Prevent double scans
        
        try {
            setLoading(true);
            
            // Pause scanner
            if (scannerRef.current) {
                scannerRef.current.pause(true);
            }

            const data = JSON.parse(decodedText);
            
            if (!data.id || !data.code) {
                throw new Error("Noto'g'ri QR Kod");
            }

            // Verify user
            const { data: profile, error: userError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.id)
                .eq('unique_code', data.code)
                .single();

            if (userError || !profile) {
                throw new Error("Xodim topilmadi");
            }

            // Check if already checked in today
            const today = new Date().toISOString().split('T')[0];
            
            const { data: existingAttendance } = await supabase
                .from('attendance')
                .select('*')
                .eq('profile_id', profile.id)
                .eq('date', today)
                .eq('company_id', tenant.id)
                .single();

            let actionText = '';

            if (existingAttendance && !existingAttendance.check_out) {
                // Checkout
                const { error: updateError } = await supabase
                    .from('attendance')
                    .update({ check_out: new Date().toISOString() })
                    .eq('id', existingAttendance.id);
                
                if (updateError) throw updateError;
                actionText = 'Xayr! Ish kuningiz tugadi.';
            } else if (!existingAttendance) {
                // Checkin
                const { error: insertError } = await supabase
                    .from('attendance')
                    .insert([{
                        profile_id: profile.id,
                        company_id: tenant.id,
                        date: today,
                        check_in: new Date().toISOString(),
                        status: 'present'
                    }]);
                
                if (insertError) throw insertError;
                actionText = "Xush kelibsiz! Davomatga yozildingiz.";
            } else {
                // Already checked out
                actionText = "Bugun uchun ish kuningiz allaqachon yopilgan.";
            }

            setScanResult({
                success: true,
                user: profile.full_name || profile.username,
                message: actionText,
                time: new Date().toLocaleTimeString()
            });

        } catch (error) {
            console.error("Scan error:", error);
            setScanResult({
                success: false,
                message: error.message || "Xatolik yuz berdi"
            });
        } finally {
            setLoading(false);
            // Resume scanner after 3 seconds
            setTimeout(() => {
                setScanResult(null);
                if (scannerRef.current && mode === 'qr') {
                    try {
                         scannerRef.current.resume();
                    } catch(e) {}
                }
            }, 4000);
        }
    };

    const handleScanFailure = (error) => {
        // Just ignore continuous errors, Html5QrcodeScanner handles it
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#050b14] text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="absolute top-8 right-8 z-10 flex items-center gap-4">
                <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                    <button
                        onClick={() => setMode('qr')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold ${mode === 'qr' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
                    >
                        <QrCode size={20} />
                        QR Skaner
                    </button>
                    {isUltra && (
                        <button
                            onClick={() => setMode('face')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold ${mode === 'face' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
                        >
                            <ScanFace size={20} />
                            Face ID
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => navigate('/')}
                    className="p-4 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-500/30"
                >
                    <LogOut size={24} />
                </button>
            </div>

            <div className="w-full max-w-xl relative z-10 flex flex-col items-center">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-black mb-2 uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                        PRO ERP SCANNER
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">
                        {mode === 'qr' ? "QR kodni kameraga ko'rsating" : "Kameraga qarang"}
                    </p>
                </div>

                {/* Scanner Container */}
                <div className="w-full aspect-square md:aspect-video bg-black/40 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative flex items-center justify-center backdrop-blur-xl">
                    
                    {loading && (
                        <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                            <Activity className="animate-spin text-indigo-500" size={48} />
                        </div>
                    )}

                    {scanResult && (
                        <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center backdrop-blur-md animate-in zoom-in-95 duration-300 ${scanResult.success ? 'bg-green-500/90' : 'bg-red-500/90'}`}>
                            {scanResult.success ? (
                                <CheckCircle2 size={80} className="text-white mb-6 animate-bounce" />
                            ) : (
                                <XCircle size={80} className="text-white mb-6" />
                            )}
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                                {scanResult.user || 'Xato'}
                            </h2>
                            <p className="text-xl font-bold text-white/90 mb-6">
                                {scanResult.message}
                            </p>
                            {scanResult.time && (
                                <span className="px-6 py-2 bg-black/20 rounded-full text-white font-mono font-bold text-sm border border-white/20 shadow-inner">
                                    {scanResult.time}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="w-full h-full p-4" style={{ display: mode === 'qr' ? 'block' : 'none' }}>
                        <div id="qr-reader" className="w-full h-full rounded-2xl overflow-hidden [&>div]:!border-none" />
                    </div>

                    {mode === 'face' && (
                        <div className="w-full h-full flex flex-col items-center justify-center relative p-0 overflow-hidden rounded-[3rem]">
                            {!modelsLoaded ? (
                                <div className="text-indigo-400 animate-pulse flex flex-col items-center justify-center p-8 text-center">
                                    <Activity size={48} className="mb-4" />
                                    <span>AI Modellar yuklanmoqda...</span>
                                </div>
                            ) : (
                                <video 
                                    ref={videoRef}
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    className="w-full h-full object-cover scale-x-[-1]"
                                />
                            )}
                            {/* Scanning overlay UI */}
                            {modelsLoaded && (
                                <>
                                    <div className="absolute inset-0 border-[8px] border-white/5 pointer-events-none rounded-[3rem]" />
                                    <div className="absolute w-[60%] h-[60%] border-2 border-dashed border-white/30 rounded-[100%] pointer-events-none opacity-50" />
                                    <p className="absolute bottom-6 text-white font-black uppercase tracking-widest text-sm drop-shadow-md">Yuzni kameraga tuting</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                #qr-reader { border: none !important; }
                #qr-reader img[alt="Info icon"] { display: none; }
                #qr-reader__scan_region { background: transparent !important; }
                #qr-reader__dashboard_section_csr { padding-top: 1rem; }
                #qr-reader__dashboard_section_csr button { 
                    background: #4f46e5; border: none; color: white; padding: 0.75rem 1.5rem; 
                    border-radius: 1rem; font-weight: bold; cursor: pointer; text-transform: uppercase;
                    letter-spacing: 0.1em; font-size: 0.75rem;
                }
                #qr-reader__dashboard_section_swaplink { color: #818cf8; text-decoration: none; font-weight: bold; margin-top: 1rem; display: inline-block; }
            `}} />
        </div>
    );
};

export default AttendanceScanner;
