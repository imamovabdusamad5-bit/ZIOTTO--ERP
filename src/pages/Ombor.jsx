import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Warehouse, Package, CheckCircle2, AlertTriangle, Layers,
    History, Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Sub-components
import MatoOmbori from '../components/warehouse/MatoOmbori';
import AksessuarOmbori from '../components/warehouse/AksessuarOmbori';
import TayyorMahsulotOmbori from '../components/warehouse/TayyorMahsulotOmbori';
import MaterialRequests from '../components/warehouse/MaterialRequests';
import OmborTarix from '../components/warehouse/OmborTarix';

const Ombor = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'Mato';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Data State
    const [inventory, setInventory] = useState([]);
    const [logs, setLogs] = useState([]);
    const [requests, setRequests] = useState([]);
    const [references, setReferences] = useState([]);
    const [orders, setOrders] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchInventory(),
                fetchLogs(),
                fetchReferences(),
                fetchOrders(),
                fetchRequests()
            ]);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        // First try with the relation
        const { data, error } = await supabase
            .from('inventory')
            .select(`*, material_types(thread_type, grammage, code)`);

        if (error) {
            console.error("Inventory Fetch Error (Relation):", error);
            // If relation fails (e.g. FK missing), try fetching simple inventory
            const { data: simpleData, error: simpleError } = await supabase
                .from('inventory')
                .select('*');

            if (simpleError) {
                console.error("Inventory Fetch Error (Simple):", simpleError);
                setError(simpleError.message);
            } else {
                setInventory(simpleData || []);
            }
        } else {
            setInventory(data || []);
        }
    };

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from('inventory_logs')
            .select(`*, inventory(item_name, color, category, material_types(thread_type, grammage))`)
            .order('created_at', { ascending: false })
            .limit(50);
        if (!error) setLogs(data || []);
    };

    const fetchReferences = async () => {
        const { data, error } = await supabase.from('material_types').select('*').order('name');
        if (!error) setReferences(data || []);
    };

    const fetchOrders = async () => {
        const { data, error } = await supabase
            .from('production_orders')
            .select(`*, models(*, bom_items(*)), production_order_items(*)`)
            .neq('status', 'Finished')
            .order('created_at', { ascending: false });
        if (!error) setOrders(data || []);
    };

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from('material_requests')
            .select('*, inventory:inventory_id(item_name, color, unit)')
            .order('created_at', { ascending: false });
        if (!error) setRequests(data || []);
    };

    // --- AGGREGATION LOGIC ---
    const getAggregatedItems = (category) => {
        const filtered = inventory.filter(i => i.category?.toLowerCase() === category.toLowerCase() || i.category === category);
        const map = new Map();

        filtered.forEach(item => {
            const name = item.item_name;
            const current = map.get(name) || { quantity: 0, unit: item.unit, count: 0 };
            map.set(name, {
                quantity: current.quantity + (Number(item.quantity) || 0),
                unit: item.unit || current.unit,
                count: current.count + 1
            });
        });

        return Array.from(map.entries()).map(([name, data]) => ({
            label: name,
            value: data.quantity,
            unit: data.unit,
            isLow: data.quantity <= 0 // Condition for Red alert
        }));
    };

    // Generic Stats for History/Overview
    const genericStats = [
        { label: 'Jami Mato', value: inventory.filter(i => i.category === 'Mato').reduce((a, b) => a + (Number(b.quantity) || 0), 0).toFixed(1), unit: 'kg', icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { label: 'Aksessuarlar', value: inventory.filter(i => i.category === 'Aksessuar').reduce((a, b) => a + (Number(b.quantity) || 0), 0), unit: 'dona', icon: Package, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        { label: 'Tayyor Mahsulot', value: inventory.filter(i => i.category === 'Tayyor Mahsulot').reduce((a, b) => a + (Number(b.quantity) || 0), 0), unit: 'dona', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { label: 'Zaxira Kam', value: inventory.filter(i => Number(i.quantity || 0) < 5).length, unit: 'tur', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
    ];

    // Determine what to show based on Tab
    let displayStats = [];
    if (activeTab === 'Mato') {
        const items = getAggregatedItems('Mato');
        displayStats = items.map(i => ({
            label: i.label,
            value: i.value.toFixed(1),
            unit: i.unit || 'kg',
            icon: Layers,
            color: i.isLow ? 'text-rose-500' : 'text-indigo-400',
            bg: i.isLow ? 'bg-rose-500/10' : 'bg-indigo-500/10',
            border: i.isLow ? 'border-rose-500/20' : 'border-indigo-500/20',
            isLow: i.isLow
        }));
    } else if (activeTab === 'Aksessuar') {
        const items = getAggregatedItems('Aksessuar');
        displayStats = items.map(i => ({
            label: i.label,
            value: i.value,
            unit: i.unit || 'dona',
            icon: Package,
            color: i.isLow ? 'text-rose-500' : 'text-purple-400',
            bg: i.isLow ? 'bg-rose-500/10' : 'bg-purple-500/10',
            border: i.isLow ? 'border-rose-500/20' : 'border-purple-500/20',
            isLow: i.isLow
        }));
    } else if (activeTab === 'Tayyor Mahsulot') {
        const items = getAggregatedItems('Tayyor Mahsulot');
        displayStats = items.map(i => ({
            label: i.label,
            value: i.value,
            unit: i.unit || 'dona',
            icon: CheckCircle2, // Changed from Package to CheckCircle2 per original
            color: i.isLow ? 'text-rose-500' : 'text-emerald-400',
            bg: i.isLow ? 'bg-rose-500/10' : 'bg-emerald-500/10',
            border: i.isLow ? 'border-rose-500/20' : 'border-emerald-500/20',
            isLow: i.isLow
        }));
    } else {
        displayStats = genericStats;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[#0f172a]/40 p-6 rounded-[3rem] border border-white/5 backdrop-blur-xl">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30">
                            <Warehouse size={28} className="text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent">
                            {activeTab === 'Mato' ? 'Mato Ombori' : activeTab === 'Aksessuar' ? 'Aksessuar Ombori' : activeTab === 'Tayyor Mahsulot' ? 'Tayyor Mahsulot' : 'Ombor Tarixi'}
                        </span>
                    </h2>
                    <p className="text-slate-400 text-sm font-medium mt-2 ml-[4.5rem]">
                        Ombor qoldig'i va kirim-chiqim operatsiyalari nazorati
                        {inventory.length > 0 && <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full ml-3 font-black border border-indigo-500/20">BAZADA: {inventory.length} OBYEKT (KIRIM)</span>}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchInitialData}
                        className={`p-4 rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 text-slate-400 hover:text-white hover:bg-slate-800 transition-all ${loading ? 'animate-spin' : ''}`}
                        title="Ma'lumotlarni yangilash"
                    >
                        <History size={20} />
                    </button>
                    {(activeTab === 'Mato' || activeTab === 'Aksessuar') && (
                        <div className="bg-indigo-500/10 text-indigo-400 px-6 py-3 rounded-2xl text-xs font-black uppercase border border-indigo-500/20 flex items-center gap-2 shadow-lg shadow-indigo-500/10 backdrop-blur-md">
                            <CheckCircle2 size={16} /> Avto Sinxron
                        </div>
                    )}
                </div>
            </div>

            {/* Dynamic Stats Cards - Horizontal Scroll if many */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4 custom-scrollbar">
                {displayStats.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-slate-500 italic border border-dashed border-white/10 rounded-3xl">Hech qanday ma'lumot topilmadi</div>
                ) : (
                    displayStats.map((stat, idx) => (
                        <div key={idx} className={`bg-[#0f172a]/60 backdrop-blur-3xl p-6 rounded-[3rem] border ${stat.border || 'border-white/5'} shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-between relative group min-w-[250px]`}>
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${stat.isLow ? 'text-rose-500' : 'text-slate-500'}`}>
                                    {stat.label.length > 20 ? stat.label.substring(0, 20) + '...' : stat.label}
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <h3 className={`text-3xl font-black ${stat.isLow ? 'text-rose-500' : 'text-white'}`}>{stat.value}</h3>
                                    <span className="text-xs font-bold text-slate-500">{stat.unit}</span>
                                </div>
                                {stat.isLow && <span className="text-[9px] text-rose-500 font-bold uppercase tracking-widest mt-1 block animate-pulse">Qoldiq tugadi</span>}
                            </div>
                            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform shadow-inner shrink-0`}>
                                <stat.icon size={28} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-[#0f172a]/60 backdrop-blur-3xl p-1.5 rounded-[3rem] border border-white/10 w-fit overflow-x-auto max-w-full shadow-2xl">
                {['Mato', 'Aksessuar', 'Tayyor Mahsulot', 'So\'rovlar', 'Tarix'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setSearchParams({ tab }); }}
                        className={`px-8 py-3 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105' : 'text-slate-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {loading && inventory.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 font-bold uppercase tracking-widest text-xs">Yuklanmoqda...</div>
                ) : (
                    <>
                        {activeTab === 'Mato' && (
                            <MatoOmbori
                                inventory={inventory.filter(i => i.category?.toLowerCase() === 'mato')}
                                references={references.filter(r => r.type === 'Mato')}
                                orders={orders}
                                onRefresh={fetchInitialData}
                            />
                        )}
                        {activeTab === 'Aksessuar' && (
                            <AksessuarOmbori
                                inventory={inventory.filter(i => i.category?.toLowerCase() === 'aksessuar')}
                                references={references}
                                orders={orders}
                                onRefresh={fetchInitialData}
                            />
                        )}
                        {activeTab === 'Tayyor Mahsulot' && (
                            <TayyorMahsulotOmbori
                                inventory={inventory.filter(i => i.category?.toLowerCase() === 'tayyor mahsulot')}
                                onRefresh={fetchInitialData}
                            />
                        )}
                        {activeTab === 'So\'rovlar' && (
                            <MaterialRequests
                                requests={requests}
                                onRefresh={fetchInitialData}
                            />
                        )}
                        {activeTab === 'Tarix' && (
                            <OmborTarix logs={logs} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Ombor;
