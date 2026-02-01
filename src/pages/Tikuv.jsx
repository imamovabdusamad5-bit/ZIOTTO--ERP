import React, { useState, useEffect } from 'react';
import { Users, Shirt, Timer, Play, CheckCircle2, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Tikuv = () => {
    const [activeTab, setActiveTab] = useState('orders');
    const [bundles, setBundles] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders();
        } else {
            fetchBundles();
        }
    }, [activeTab]);

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

    const handleBundleAction = async (bundle, action) => {
        const nextStep = action === 'finish' ? 'OTK' : 'Tikuv';
        const nextStatus = action === 'finish' ? 'Pending' : 'In Progress'; // If finish, it becomes Pending for OTK.

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
                user_name: 'Tikuvchi',
                action: `${bundle.bundle_number} - ${action === 'finish' ? 'OTKga yuborildi' : 'Ishga olindi'}`,
                details: JSON.stringify(bundle)
            }]);
            fetchBundles();
        }
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">Tikuv Bo'limi</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Ish taqsimoti va guruhlar nazorati</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-gray-200">
                    <button onClick={() => setActiveTab('orders')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>Ummumiy Rejalar</button>
                    <button onClick={() => setActiveTab('bundles')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'bundles' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>Partiyalar (Ishlar)</button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Activity className="animate-spin text-indigo-600" size={32} /></div>
            ) : activeTab === 'orders' ? (
                orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <p className="text-gray-400 font-bold">Tikuv uchun tasdiqlangan buyurtmalar yo'q</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                                    <Shirt size={120} className="text-indigo-900" />
                                </div>
                                <div className="flex justify-between items-start mb-6 relative">
                                    <div>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${order.status === 'Sewing' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${order.status === 'Sewing' ? 'bg-indigo-600 animate-pulse' : 'bg-emerald-600'}`}></span>
                                            {order.status === 'Sewing' ? 'Jarayonda' : 'Tasdiqlangan'}
                                        </span>
                                        <h3 className="text-2xl font-black text-gray-900 uppercase leading-none">{order.models?.name}</h3>
                                        <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">Buyurtma № {order.order_number}</p>
                                    </div>
                                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                                        <Shirt size={24} />
                                    </div>
                                </div>
                                <div className="space-y-6 relative">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-2xl">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Jami Soni</p>
                                            <p className="text-xl font-black text-gray-900">{order.total_quantity} <span className="text-xs text-gray-400">dona</span></p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-2xl">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Muddat</p>
                                            <p className="text-sm font-black text-gray-900 flex items-center gap-2 mt-1">
                                                <Timer size={14} className="text-rose-500" />
                                                {new Date(order.deadline).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2 flex gap-3">
                                        {order.status === 'Confirmed' ? (
                                            <button
                                                onClick={() => handleStartSewing(order.id)}
                                                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                                            >
                                                <Play size={16} fill="white" />
                                                Tikuvni Boshlash
                                            </button>
                                        ) : (
                                            <button className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-2xl text-xs font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2">
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
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <p className="text-gray-400 font-bold">Tikuvda bajarilishi kerak bo'lgan partiyalar yo'q</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {bundles.map((bundle) => (
                            <div key={bundle.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{bundle.status}</span>
                                        <h3 className="text-lg font-black text-gray-900 mt-2 uppercase">{bundle.production_orders?.models?.name}</h3>
                                        <p className="text-xs text-gray-400 font-bold"># {bundle.bundle_number}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-6">
                                    <p className="text-sm font-bold text-gray-600">Rang: {bundle.color}</p>
                                    <p className="text-sm font-bold text-gray-600">O'lcham: {bundle.size}</p>
                                    <p className="text-xl font-black text-indigo-600">{bundle.quantity} dona</p>
                                </div>
                                {bundle.status === 'Pending' || bundle.status === 'Ready' ? ( // 'Ready' likely from Tasnif
                                    <button onClick={() => handleBundleAction(bundle, 'start')} className="w-full bg-indigo-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700">
                                        Ishni Boshlash
                                    </button>
                                ) : (
                                    <button onClick={() => handleBundleAction(bundle, 'finish')} className="w-full bg-emerald-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700">
                                        Tamomlash va OTKga
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default Tikuv;
