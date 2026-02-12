import React, { useState, useEffect } from 'react';
import {
    Activity,
    Layers,
    Clock,
    CircleCheck,
    Search,
    Plus,
    ArrowDownLeft,
    Check,
    Scissors
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Vishefka = () => {
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('incoming');

    useEffect(() => {
        fetchBundles();
    }, [activeTab]);

    const fetchBundles = async () => {
        setLoading(true);
        let query = supabase
            .from('production_bundles')
            .select('*, production_orders(models(name))')
            .eq('current_step', 'Vishefka');

        if (activeTab === 'incoming') {
            query = query.eq('status', 'Pending');
        } else if (activeTab === 'active') {
            query = query.eq('status', 'In Progress');
        } else {
            query = query.eq('status', 'Completed');
        }

        const { data, error } = await query;
        if (!error) setBundles(data || []);
        setLoading(false);
    };

    const handleAction = async (bundle, nextStatus) => {
        setLoading(true);
        const { error } = await supabase
            .from('production_bundles')
            .update({
                status: nextStatus,
                current_step: nextStatus === 'Completed' ? 'Tikuv' : 'Vishefka'
            })
            .eq('id', bundle.id);

        if (!error) {
            await supabase.from('activity_logs').insert([{
                department: 'Vishefka',
                user_name: 'Vishefka Usta',
                action: `${bundle.bundle_number} partiyasini ${nextStatus === 'Completed' ? 'Tikuvga yubordi' : 'Qabul qildi'}`,
                details: JSON.stringify(bundle)
            }]);
            fetchBundles();
        }
        setLoading(false);
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-pink-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-pink-600/20 rotate-3 transition-transform hover:rotate-0">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Vishefka (Kashtachilik)</h2>
                        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Kashta va naqsh bo'limi</p>
                    </div>
                </div>

                <div className="flex bg-[var(--bg-sidebar-footer)] p-1.5 rounded-2xl border border-[var(--border-color)]">
                    {[
                        { id: 'incoming', label: 'Kelganlar', icon: ArrowDownLeft, color: 'text-amber-500' },
                        { id: 'active', label: 'Jarayonda', icon: Scissors, color: 'text-blue-500' },
                        { id: 'completed', label: 'Tayyor', icon: CircleCheck, color: 'text-emerald-500' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xl' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? tab.color : ''} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content List */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {loading ? (
                            <div className="col-span-full py-20 text-center"><Clock className="animate-spin mx-auto text-pink-500" /></div>
                        ) : bundles.map((job) => (
                            <div key={job.id} className="bg-[var(--bg-body)] border border-[var(--border-color)] p-8 rounded-[3.5rem] shadow-xl relative overflow-hidden group hover:border-pink-500/30 transition-all">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                    <Activity size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className={`bg-pink-600/20 text-pink-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                                            {job.bundle_number}
                                        </span>
                                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full ${activeTab === 'incoming' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                                            }`}>
                                            {activeTab === 'incoming' ? 'Qabul kutilmoqda' : 'Faol'}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2 tracking-tight uppercase">{job.production_orders?.models?.name}</h3>
                                    <p className="text-[var(--text-secondary)] font-bold mb-8 uppercase text-[10px] tracking-[0.2em]">{job.color} | {job.size}</p>

                                    <div className="grid grid-cols-2 gap-8 mb-10">
                                        <div>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Miqdor</p>
                                            <p className="text-xl font-black text-[var(--text-primary)]">{job.quantity} <span className="text-xs text-[var(--text-secondary)]">dona</span></p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Bo'lim</p>
                                            <p className="text-xl font-black text-pink-500">Vishefka</p>
                                        </div>
                                    </div>

                                    {activeTab === 'incoming' ? (
                                        <button
                                            onClick={() => handleAction(job, 'In Progress')}
                                            className="w-full flex items-center justify-center gap-3 py-5 bg-pink-600 text-white rounded-[2rem] text-[10px] font-black uppercase hover:bg-pink-500 active:scale-95 transition-all shadow-xl shadow-pink-600/20"
                                        >
                                            <Check size={18} /> Partiyani Qabul Qilish
                                        </button>
                                    ) : activeTab === 'active' ? (
                                        <button
                                            onClick={() => handleAction(job, 'Completed')}
                                            className="w-full flex items-center justify-center gap-3 py-5 bg-emerald-600 text-white rounded-[2rem] text-[10px] font-black uppercase hover:bg-emerald-500 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                                        >
                                            <CircleCheck size={18} /> Tikuvga Yuborish (Tayyor)
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>

                    {!loading && bundles.length === 0 && (
                        <div className="py-20 text-center bg-[var(--bg-body)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                            <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs">Hozircha ishlar yo'q</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Vishefka;
