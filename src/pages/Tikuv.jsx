import React, { useState, useEffect } from 'react';
import { Users, Shirt, Timer, Play, CheckCircle2, Activity, X, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Tikuv = () => {
    const [activeTab, setActiveTab] = useState('orders');
    const [bundles, setBundles] = useState([]);
    const [orders, setOrders] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showFinishModal, setShowFinishModal] = useState(false);
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [selectedWorkerId, setSelectedWorkerId] = useState('');

    useEffect(() => {
        fetchWorkers();
        if (activeTab === 'orders') {
            fetchOrders();
        } else {
            fetchBundles();
        }
    }, [activeTab]);

    const fetchWorkers = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('status', true);
        setWorkers(data || []);
    };

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('production_orders')
            .select(`*, models (name, image_url)`)
            .in('status', ['Confirmed', 'Sewing'])
            .order('created_at', { ascending: false });
        if (!error) setOrders(data || []);
        setLoading(false);
    };

    const fetchBundles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('production_bundles')
            .select('*, production_orders(models(name))')
            .eq('current_step', 'Tikuv')
            .neq('status', 'Completed'); // Show Pending and In Progress
        if (!error) setBundles(data || []);
        setLoading(false);
    };

    const handleStartSewing = async (id) => {
        const { error } = await supabase.from('production_orders').update({ status: 'Sewing', start_date: new Date() }).eq('id', id);
        if (!error) fetchOrders();
    };

    const handleOpenFinish = (bundle) => {
        setSelectedBundle(bundle);
        setShowFinishModal(true);
    };

    const handleBundleAction = async (bundle, action) => {
        if (action === 'start') {
            const { error } = await supabase
                .from('production_bundles')
                .update({ status: 'In Progress' })
                .eq('id', bundle.id);
            if (!error) fetchBundles();
            return;
        }

        // Finish logic
        if (!selectedWorkerId) {
            alert('Iltimos, ishni bajargan xodimni tanlang!');
            return;
        }

        const worker = workers.find(w => w.id === selectedWorkerId);
        const nextStep = 'OTK';
        const nextStatus = 'Pending';

        const { error } = await supabase
            .from('production_bundles')
            .update({
                current_step: nextStep,
                status: nextStatus
            })
            .eq('id', bundle.id);

        if (!error) {
            await supabase.from('activity_logs').insert([{
                department: 'Tikuv',
                user_name: worker.username, // Save the worker who did the job
                action: `${bundle.bundle_number} - OTKga yuborildi`,
                details: JSON.stringify({
                    bundle_id: bundle.id,
                    worker_id: worker.id,
                    quantity: bundle.quantity,
                    operation: 'Sewing'
                })
            }]);

            setShowFinishModal(false);
            setSelectedWorkerId('');
            fetchBundles();
        }
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight text-shadow-glow">Tikuv Bo'limi</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Ish taqsimoti va guruhlar nazorati</p>
                </div>
                <div className="flex bg-[#161b22] p-1 rounded-2xl border border-white/5 shadow-2xl">
                    <button onClick={() => setActiveTab('orders')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Ummumiy Rejalar</button>
                    <button onClick={() => setActiveTab('bundles')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bundles' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Partiyalar (Ishlar)</button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Activity className="animate-spin text-indigo-600" size={32} /></div>
            ) : activeTab === 'orders' ? (
                orders.length === 0 ? (
                    <div className="text-center py-20 bg-[#161b22] rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Tikuv uchun tasdiqlangan buyurtmalar yo'q</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-[#161b22] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                                    <Shirt size={120} className="text-indigo-400" />
                                </div>
                                <div className="flex justify-between items-start mb-6 relative">
                                    <div>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3 ${order.status === 'Sewing' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Sewing' ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                                            {order.status === 'Sewing' ? 'Jarayonda' : 'Tasdiqlangan'}
                                        </span>
                                        <h3 className="text-2xl font-black text-white uppercase leading-none tracking-tight">{order.models?.name}</h3>
                                        <p className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-widest">Buyurtma № {order.order_number}</p>
                                    </div>
                                    <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-inner">
                                        <Shirt size={24} />
                                    </div>
                                </div>
                                <div className="space-y-6 relative">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Jami Soni</p>
                                            <p className="text-xl font-black text-white">{order.total_quantity} <span className="text-[10px] text-gray-600">dona</span></p>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Muddat</p>
                                            <p className="text-xs font-black text-white flex items-center gap-2 mt-1">
                                                <Timer size={14} className="text-rose-500" />
                                                {new Date(order.deadline).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        {order.status === 'Confirmed' ? (
                                            <button
                                                onClick={() => handleStartSewing(order.id)}
                                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                                            >
                                                <Play size={16} fill="white" />
                                                Tikuvni Boshlash
                                            </button>
                                        ) : (
                                            <button className="w-full bg-white/5 text-gray-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2 border border-white/5">
                                                <Activity size={16} />
                                                Jarayonda...
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                bundles.length === 0 ? (
                    <div className="text-center py-20 bg-[#161b22] rounded-[2.5rem] border border-white/5 shadow-2xl">
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Tikuvda bajarilishi kerak bo'lgan partiyalar yo'q</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {bundles.map((bundle) => (
                            <div key={bundle.id} className="bg-[#161b22] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-indigo-500/30 transition-all relative group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${bundle.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'}`}>{bundle.status}</span>
                                        <h3 className="text-lg font-black text-white mt-2 uppercase tracking-tight">{bundle.production_orders?.models?.name}</h3>
                                        <p className="text-[10px] text-gray-500 font-bold"># {bundle.bundle_number}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <p className="text-[8px] text-gray-600 font-black uppercase mb-1">Xususiyat</p>
                                        <p className="text-[10px] font-bold text-gray-300">{bundle.color} | {bundle.size}</p>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <p className="text-[8px] text-gray-600 font-black uppercase mb-1">Miqdor</p>
                                        <p className="text-sm font-black text-indigo-400">{bundle.quantity} ta</p>
                                    </div>
                                </div>
                                {bundle.status === 'Pending' || bundle.status === 'Ready' ? (
                                    <button onClick={() => handleBundleAction(bundle, 'start')} className="w-full bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">
                                        Ishni Boshlash
                                    </button>
                                ) : (
                                    <button onClick={() => handleOpenFinish(bundle)} className="w-full bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20">
                                        Tamomlash va OTKga
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Finish Modal */}
            {showFinishModal && selectedBundle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-md rounded-[3rem] p-10 shadow-4xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Ishni Yakunlash</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Bundle: {selectedBundle.bundle_number}</p>
                            </div>
                            <button onClick={() => setShowFinishModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <UserCheck size={14} className="text-indigo-400" />
                                    Ishni kim bajardi?
                                </label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all font-bold appearance-none cursor-pointer"
                                    value={selectedWorkerId}
                                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                                >
                                    <option value="">Xodimni tanlang...</option>
                                    {workers.map(w => (
                                        <option key={w.id} value={w.id} className="bg-[#161b22]">{w.full_name} (@{w.username})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-gray-500">Miqdor:</span>
                                    <span className="text-indigo-400">{selectedBundle.quantity} dona</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleBundleAction(selectedBundle, 'finish')}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-indigo-600/20 uppercase tracking-widest text-xs"
                            >
                                OTKga Yuborish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tikuv;

