import React, { useState, useEffect } from 'react';
import { Package, Truck, Users, X, UserCheck, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Dazmol = () => {
    const [bundles, setBundles] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showFinishModal, setShowFinishModal] = useState(false);
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [selectedWorkerId, setSelectedWorkerId] = useState('');

    useEffect(() => {
        fetchBundles();
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('status', true);
        setWorkers(data || []);
    };

    const fetchBundles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('production_bundles')
            .select('*, production_orders(models(name))')
            .eq('current_step', 'Dazmol')
            .eq('status', 'Pending');

        if (!error) setBundles(data || []);
        setLoading(false);
    };

    const handleOpenFinish = (bundle) => {
        setSelectedBundle(bundle);
        setShowFinishModal(true);
    };

    const handleFinish = async () => {
        if (!selectedWorkerId) {
            alert('Iltimos, ishni bajargan xodimni tanlang!');
            return;
        }

        const bundle = selectedBundle;
        const worker = workers.find(w => w.id === selectedWorkerId);

        setLoading(true);

        // 1. Update Bundle Status
        const { error: bundleError } = await supabase
            .from('production_bundles')
            .update({
                current_step: 'Finished',
                status: 'Completed'
            })
            .eq('id', bundle.id);

        if (bundleError) {
            alert('Xatolik: ' + bundleError.message);
            setLoading(false);
            return;
        }

        // 2. Add to Inventory (Tayyor Mahsulot)
        const modelName = bundle.production_orders?.models?.name;
        const { data: existing } = await supabase
            .from('inventory')
            .select('*')
            .eq('item_name', modelName)
            .eq('category', 'Tayyor Mahsulot')
            .eq('color', bundle.color)
            .maybeSingle();

        if (existing) {
            await supabase.from('inventory').update({
                quantity: Number(existing.quantity) + Number(bundle.quantity),
                last_updated: new Date()
            }).eq('id', existing.id);
        } else {
            await supabase.from('inventory').insert([{
                item_name: modelName,
                category: 'Tayyor Mahsulot',
                quantity: Number(bundle.quantity),
                unit: 'dona',
                color: bundle.color,
                last_updated: new Date()
            }]);
        }

        // 3. Log with Worker Info
        await supabase.from('activity_logs').insert([{
            department: 'Dazmol',
            user_name: worker.username,
            action: `${bundle.bundle_number} - Omborga topshirildi`,
            details: JSON.stringify({
                bundle_id: bundle.id,
                worker_id: worker.id,
                quantity: bundle.quantity,
                operation: 'Ironing'
            })
        }]);

        setShowFinishModal(false);
        setSelectedWorkerId('');
        fetchBundles();
        setLoading(false);
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Dazmol va Qadoqlash</h2>
                    <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] mt-1">Tayyor mahsulotlarni omborga topshirish</p>
                </div>
                <button onClick={fetchBundles} className="p-4 bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-2xl border border-[var(--border-color)] transition-all">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading && bundles.length === 0 ? (
                    <div className="col-span-full py-20 text-center"><Activity className="animate-spin mx-auto text-indigo-600" size={32} /></div>
                ) : bundles.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] shadow-2xl">
                        <Package className="mx-auto text-[var(--text-secondary)] mb-4" size={64} />
                        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-xs">Hozircha qadoqlash uchun ish yo'q</p>
                    </div>
                ) : bundles.map((bundle) => (
                    <div key={bundle.id} className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] shadow-2xl hover:border-orange-500/30 transition-all relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                            <Package size={120} className="text-orange-400" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 inline-block">Tayyorlandi</span>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight leading-none">{bundle.production_orders?.models?.name}</h3>
                                    <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-2 uppercase tracking-widest">{bundle.bundle_number}</p>
                                </div>
                                <div className="p-4 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20 shadow-inner">
                                    <Package size={24} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-[var(--bg-body)] p-4 rounded-2xl border border-[var(--border-color)] shadow-inner">
                                    <p className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-widest mb-1">Miqdor</p>
                                    <div className="flex items-center gap-2 font-black text-[var(--text-primary)] text-xl">
                                        <Users size={16} className="text-orange-500" />
                                        {bundle.quantity} <span className="text-[10px] text-[var(--text-secondary)] uppercase">dona</span>
                                    </div>
                                </div>
                                <div className="bg-[var(--bg-body)] p-4 rounded-2xl border border-[var(--border-color)] shadow-inner">
                                    <p className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-widest mb-1">Rang / O'lcham</p>
                                    <div className="text-sm font-black text-[var(--text-primary)] mt-1">
                                        {bundle.color} | {bundle.size}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleOpenFinish(bundle)}
                                className="w-full flex items-center justify-center gap-3 bg-orange-600 text-white py-4 rounded-2xl hover:bg-orange-500 transition-all font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-orange-600/20"
                            >
                                <Truck size={18} />
                                Omborga Topshirish
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Finish Modal */}
            {showFinishModal && selectedBundle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-md rounded-[3.5rem] p-10 shadow-4xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Qadoqlashni Yakunlash</h3>
                                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Partiya: {selectedBundle.bundle_number}</p>
                            </div>
                            <button onClick={() => setShowFinishModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <UserCheck size={14} className="text-orange-400" />
                                    Dazmolchi / Qadoqlovchi
                                </label>
                                <select
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-orange-500 transition-all font-bold appearance-none cursor-pointer"
                                    value={selectedWorkerId}
                                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                                >
                                    <option value="" className="bg-[var(--bg-card)]">Xodimni tanlang...</option>
                                    {workers.map(w => (
                                        <option key={w.id} value={w.id} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{w.full_name} (@{w.username})</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleFinish}
                                disabled={loading}
                                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-5 rounded-3xl transition-all shadow-2xl shadow-orange-600/20 uppercase tracking-widest text-xs disabled:opacity-50"
                            >
                                {loading ? 'Yozilmoqda...' : 'Omborga Topshirish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dazmol;
