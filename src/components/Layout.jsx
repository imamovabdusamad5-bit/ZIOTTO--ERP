import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation, Outlet } from 'react-router-dom';
import { Activity, Menu, CheckCircle, Eye, EyeOff, History, RotateCcw } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [alerts, setAlerts] = useState([]);

    // Initialize from localStorage safely
    const [hiddenAlertKeys, setHiddenAlertKeys] = useState(() => {
        try {
            const saved = localStorage.getItem('ziyo_hidden_alerts');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Storage error", e);
            return [];
        }
    });

    const [showHidden, setShowHidden] = useState(false);
    const location = useLocation();

    // Department Mapping
    const deptMap = {
        '/kesim': ['Kesim'],
        '/tikuv': ['Tikuv'],
        '/otk': ['OTK'],
        '/dazmol': ['Dazmol', 'Qadoq'],
        '/ombor': ['Ombor'],
        '/moliya': ['Moliya']
    };

    // Fetch Alerts
    useEffect(() => {
        const fetchAlerts = async () => {
            const pathParts = location.pathname.split('/');
            const currentPath = '/' + (pathParts[1] || '');
            const targetDepts = deptMap[currentPath];

            if (!targetDepts) {
                setAlerts([]);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('models')
                    .select('id, name, code, notes')
                    .not('notes', 'is', null);

                if (error) throw error;

                const activeAlerts = [];
                const seenKeys = new Set();

                data.forEach(model => {
                    if (Array.isArray(model.notes)) {
                        model.notes.forEach(note => {
                            if (targetDepts.includes(note.department) && note.text && note.text.trim() !== '') {
                                const uniqueKey = `${model.id}-${note.text.trim()}`;
                                if (!seenKeys.has(uniqueKey)) {
                                    activeAlerts.push({
                                        id: model.id,
                                        uniqueKey,
                                        modelName: model.name,
                                        modelCode: model.code,
                                        dept: note.department,
                                        text: note.text
                                    });
                                    seenKeys.add(uniqueKey);
                                }
                            }
                        });
                    }
                });

                setAlerts(activeAlerts);
            } catch (err) {
                console.error('Alert fetch error:', err);
            }
        };

        fetchAlerts();
    }, [location.pathname]);

    const toggleHideAlert = (key) => {
        const newHidden = hiddenAlertKeys.includes(key)
            ? hiddenAlertKeys.filter(k => k !== key)
            : [...hiddenAlertKeys, key];

        setHiddenAlertKeys(newHidden);
        localStorage.setItem('ziyo_hidden_alerts', JSON.stringify(newHidden));
    };

    const visibleAlerts = alerts.filter(a => !hiddenAlertKeys.includes(a.uniqueKey));
    const hiddenCount = alerts.length - visibleAlerts.length;
    // Show panel if there are ANY alerts (even if all are hidden)
    const showPanel = alerts.length > 0;

    return (
        <div className="min-h-screen bg-[#0d1117] flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[60] md:hidden backdrop-blur-md transition-all"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 transition-all duration-300 md:pl-64 flex flex-col min-h-screen">
                <header className="bg-[#161b22]/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-3 -ml-3 hover:bg-gray-100 rounded-xl md:hidden text-gray-700 active:bg-gray-200 transition-colors"
                        >
                            <Menu size={28} />
                        </button>
                        <h2 className="text-lg md:text-xl font-black text-white tracking-tight uppercase">
                            Ziotto <span className="text-indigo-500">ERP</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:block text-[10px] text-gray-400 font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl">
                            {new Date().toLocaleDateString('uz-UZ')}
                        </span>
                    </div>
                </header>

                {/* ALERTS SYSTEM */}
                {showPanel && (visibleAlerts.length > 0 || showHidden || hiddenCount > 0) && (
                    <div className={`border-b relative overflow-hidden animate-in slide-in-from-top-2 shrink-0 transition-colors ${visibleAlerts.length === 0 && !showHidden
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-rose-50 border-rose-100'
                        }`}>
                        <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${visibleAlerts.length === 0 && !showHidden ? 'bg-gray-300' : 'bg-rose-500'
                            }`}></div>
                        <div className="max-w-7xl mx-auto py-4 px-4 md:px-8">
                            <div className="flex items-start gap-4">
                                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 shadow-sm transition-colors ${visibleAlerts.length === 0 && !showHidden
                                    ? 'bg-white text-gray-400'
                                    : 'bg-rose-100 text-rose-600 animate-pulse'
                                    }`}>
                                    <Activity size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                        <h4 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${visibleAlerts.length === 0 && !showHidden ? 'text-gray-500' : 'text-rose-800'
                                            }`}>
                                            {visibleAlerts.length === 0 && !showHidden
                                                ? "Barcha eslatmalar o'qib chiqildi"
                                                : "Bo'lim Eslatmalari"
                                            }
                                            {(visibleAlerts.length > 0 || showHidden) && (
                                                <span className="bg-rose-200 text-rose-700 px-2 py-0.5 rounded-full text-xs">
                                                    {visibleAlerts.length}
                                                </span>
                                            )}
                                        </h4>
                                        {hiddenCount > 0 && (
                                            <button
                                                onClick={() => setShowHidden(!showHidden)}
                                                className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition-colors px-2 py-1 rounded hover:bg-gray-200/50 ml-auto md:ml-0"
                                            >
                                                {showHidden
                                                    ? <><EyeOff size={14} /> Yashirish</>
                                                    : <><History size={14} /> Tarix ({hiddenCount})</>
                                                }
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid gap-3 transition-all max-h-[40vh] md:max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {/* Visible Alerts */}
                                        {visibleAlerts.map((alert) => (
                                            <div key={alert.uniqueKey} className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm flex flex-col md:flex-row md:items-center gap-3 hover:shadow-md transition-shadow group">
                                                <div className="flex items-center gap-3 shrink-0 border-b md:border-b-0 border-gray-100 pb-2 md:pb-0">
                                                    <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">{alert.dept}</span>
                                                    <div className="flex flex-col leading-tight">
                                                        <span className="font-bold text-gray-800 text-sm whitespace-nowrap">{alert.modelName}</span>
                                                        <span className="text-rose-500 font-mono font-black text-xs bg-rose-50 px-1 rounded w-fit">#{alert.modelCode}</span>
                                                    </div>
                                                </div>
                                                <div className="hidden md:block w-px h-8 bg-gray-200"></div>
                                                <div className="text-gray-700 font-medium text-sm leading-snug flex-1">
                                                    {alert.text}
                                                </div>
                                                <button
                                                    onClick={() => toggleHideAlert(alert.uniqueKey)}
                                                    className="p-2 bg-gray-50 hover:bg-green-50 text-gray-300 hover:text-green-600 rounded-lg transition-all ml-auto shrink-0"
                                                    title="Tanishdim (Yashirish)"
                                                >
                                                    <CheckCircle size={20} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Hidden Alerts */}
                                        {showHidden && alerts
                                            .filter(a => hiddenAlertKeys.includes(a.uniqueKey))
                                            .map((alert) => (
                                                <div key={alert.uniqueKey} className="bg-gray-50/50 opacity-60 p-3 rounded-xl border border-gray-200 border-dashed flex flex-col md:flex-row md:items-center gap-3 grayscale hover:grayscale-0 transition-all">
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <span className="bg-gray-200 text-gray-500 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">{alert.dept}</span>
                                                        <div className="flex flex-col leading-tight">
                                                            <span className="font-bold text-gray-500 text-sm">{alert.modelName}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-gray-400 font-medium text-sm leading-snug flex-1 italic line-through decoration-gray-300">
                                                        {alert.text}
                                                    </div>
                                                    <button
                                                        onClick={() => toggleHideAlert(alert.uniqueKey)}
                                                        className="p-2 text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg ml-auto shrink-0 transition-all"
                                                        title="Qaytarish"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
