import React, { useState, useEffect } from 'react';
import {
    Printer,
    Layers,
    Palette,
    Clock,
    CircleCheck,
    CircleAlert,
    Search,
    Plus,
    Activity,
    ArrowDownLeft,
    Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Pechat = () => {
    const [orders, setOrders] = useState([]);
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('incoming');


    useEffect(() => {
        if (activeTab === 'plans') {
            fetchOrders();
        } else {
            fetchBundles();
        }
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('production_orders')
            .select('*, models(name, code)')
            .eq('status', 'Confirmed')
            .order('created_at', { ascending: false });

        if (!error) setOrders(data || []);
        setLoading(false);
    };

    const fetchBundles = async () => {
        setLoading(true);
        let query = supabase
            .from('production_bundles')
            .select('*, production_orders(models(name))')
            .eq('current_step', 'Pechat');

        if (activeTab === 'incoming') {
            query = query.eq('status', 'Pending');
        } else if (activeTab === 'active') {
            query = query.eq('status', 'In Progress');
        } else if (activeTab === 'completed') {
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
                current_step: nextStatus === 'Completed' ? 'Tikuv' : 'Pechat'
            })
            .eq('id', bundle.id);

        if (!error) {
            await supabase.from('activity_logs').insert([{
                department: 'Pechat',
                user_name: 'Pechat Usta',
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
                    <div className="w-16 h-16 bg-purple-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-purple-600/20 rotate-3 transition-transform hover:rotate-0">
                        <Printer size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Pechat & Naqsh</h2>
                        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Bosma ishlov berish bo'limi</p>
                    </div>
                </div>

                <div className="flex bg-[var(--bg-sidebar-footer)] p-1.5 rounded-2xl border border-[var(--border-color)]">
                    {[
                        { id: 'plans', label: 'Rejalar', icon: Clock, color: 'text-[var(--text-primary)]' },
                        { id: 'incoming', label: 'Kelganlar', icon: ArrowDownLeft, color: 'text-amber-500' },
                        { id: 'active', label: 'Jarayonda', icon: Activity, color: 'text-blue-500' },
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

            {/* Content Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === 'plans' ? (
                    // PLANS VIEW
                    orders.map(order => (
                        <div key={order.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-xl hover:border-purple-500/30 transition-all opacity-75 grayscale hover:grayscale-0 hover:opacity-100">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[var(--bg-body)] text-[var(--text-primary)] border border-[var(--border-color)]">
                                        Rejalashtirilgan
                                    </span>
                                    <h3 className="text-xl font-black text-[var(--text-primary)] mt-3 tracking-tight uppercase">{order.models?.name}</h3>
                                    <p className="text-xs font-mono font-bold text-[var(--text-secondary)] mt-1">Order # {order.order_number}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)]">
                                    <span>Jami:</span>
                                    <span className="text-[var(--text-primary)]">{order.total_quantity} dona</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)]">
                                    <span>Muddat:</span>
                                    <span className="text-purple-400">{new Date(order.deadline).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    // BUNDLES VIEW
                    loading ? (
                        <div className="col-span-full py-20 text-center"><Clock className="animate-spin mx-auto text-purple-500" /></div>
                    ) : bundles.map((job) => (
                        <div key={job.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:border-purple-500/30 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                                <Palette size={80} />
                            </div>

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${activeTab === 'incoming' ? 'bg-amber-500/10 text-amber-500' :
                                        activeTab === 'active' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                                        }`}>
                                        {activeTab === 'incoming' ? 'Qabul kutilmoqda' : activeTab === 'active' ? 'Ishlanmoqda' : 'Tugallandi'}
                                    </span>
                                    <h3 className="text-xl font-black text-[var(--text-primary)] mt-3 tracking-tight uppercase">{job.production_orders?.models?.name}</h3>
                                    <p className="text-xs font-mono font-bold text-[var(--text-secondary)] mt-1"># {job.bundle_number}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)]">
                                    <span>Miqdor:</span>
                                    <span className="text-[var(--text-primary)]">{job.quantity} dona</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)]">
                                    <span>Rang:</span>
                                    <span className="text-purple-400">{job.color}</span>
                                </div>
                                <div className="w-full bg-[var(--bg-body)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
                                    <div className={`h-full transition-all duration-1000 ${activeTab === 'incoming' ? 'w-0' : activeTab === 'active' ? 'w-1/2 bg-blue-500' : 'w-full bg-emerald-500'
                                        }`}></div>
                                </div>
                            </div>

                            {activeTab === 'incoming' && (
                                <button
                                    onClick={() => handleAction(job, 'In Progress')}
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-purple-500 active:scale-95 transition-all shadow-xl shadow-purple-600/20"
                                >
                                    <Check size={16} /> Qabul qilish
                                </button>
                            )}

                            {activeTab === 'active' && (
                                <button
                                    onClick={() => handleAction(job, 'Completed')}
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-500 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
                                >
                                    <CircleCheck size={16} /> Yakunlash (Tikuvga)
                                </button>
                            )}
                        </div>
                    ))
                )}

                {!loading && ((activeTab === 'plans' && orders.length === 0) || (activeTab !== 'plans' && bundles.length === 0)) && (
                    <div className="col-span-full py-20 text-center bg-[var(--bg-card)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs">Ma'lumot topilmadi</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Pechat;
