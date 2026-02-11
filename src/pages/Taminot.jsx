import React, { useState, useEffect } from 'react';
import {
    Truck,
    Users,
    Search,
    Plus,
    Filter,
    Download,
    ShoppingBag,
    History,
    TrendingUp,
    MoreVertical,
    CircleCheck,
    Clock,
    TriangleAlert,
    Mail,
    Phone,
    MapPin,
    ArrowUpRight,
    ArrowDownLeft,
    X,
    CircleAlert,
    Warehouse,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Taminot = () => {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('inventory'); // inventory, suppliers, orders, logs
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Mock Data (To be replaced with real Supabase calls)
    const [inventory, setInventory] = useState([
        { id: 1, name: 'Ip (Cotton 30/1)', category: 'Ip', stock: 1250, unit: 'kg', min: 200, price: '3.20$' },
        { id: 2, name: 'Supreme (Oq)', category: 'Mato', stock: 450, unit: 'kg', min: 100, price: '6.50$' },
        { id: 3, name: 'Furnitura (Tugma)', category: 'Furnitura', stock: 15000, unit: 'dona', min: 1000, price: '0.05$' },
    ]);

    const [suppliers, setSuppliers] = useState([
        { id: 1, name: 'Gurlan Global Tex', contact: 'Azimjon', phone: '+998 90 123 45 67', items: 'Mato, Ip', rating: 4.8 },
        { id: 2, name: 'Aksessuarlar Markazi', contact: 'Dilshod', phone: '+998 93 777 88 99', items: 'Tugma, Zamok', rating: 4.5 },
    ]);

    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Confirmed Production Orders
        const { data: prodOrders, error } = await supabase
            .from('production_orders')
            .select('*, models(name, code)')
            .eq('status', 'Confirmed')
            .order('created_at', { ascending: false });

        if (!error && prodOrders) {
            // Transform to fit Taminot view if needed, or just use as is
            setOrders(prodOrders);
        }
        setLoading(false);
    };

    const [logs, setLogs] = useState([
        { id: 1, user: 'ABDUSAMAD', action: 'Mato miqdorini o\'zgartirdi', item: 'Supreme (Oq)', date: '2024-03-21 10:15' },
        { id: 2, user: 'TEMUR', action: 'Yangi buyurtma yaratdi', item: 'Ip (Cotton 30/1)', date: '2024-03-20 16:45' },
    ]);

    const [showKirimModal, setShowKirimModal] = useState(false);
    const [newOrder, setNewOrder] = useState({ item: '', qty: '', supplier: '', price: '' });

    const handleKirim = async (e) => {
        e.preventDefault();
        // Here we would save to Supabase and record an activity log
        const logEntry = {
            user: profile?.username || 'ADMIN',
            action: 'Yangi kirim qo\'shdi',
            item: newOrder.item,
            date: new Date().toLocaleString()
        };
        setLogs([logEntry, ...logs]);
        setInventory([...inventory, { ...newOrder, id: Date.now(), stock: parseInt(newOrder.qty), unit: 'kg', min: 100 }]);
        setShowKirimModal(false);
        setNewOrder({ item: '', qty: '', supplier: '', price: '' });
    };

    const hasFullAccess = profile?.role === 'admin' || profile?.permissions?.taminot === 'full';

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-600/20 rotate-3 transition-transform hover:rotate-0">
                        <Truck size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Ta'minot Boshqaruvi</h2>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Logistika va xaridlar</p>
                    </div>
                </div>
                {hasFullAccess && (
                    <button
                        onClick={() => setShowKirimModal(true)}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Plus size={20} />
                        Yangi Kirim / Buyurtma
                    </button>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Oylik Xarajat', value: '$12,450', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: 'Faol Buyurtmalar', value: '8 ta', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Kamchiligi bor stok', value: '3 xil', icon: CircleAlert, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { label: 'Hamkorlar', value: '24 ta', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] shadow-xl group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-[#161b22]/80 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                {[
                    { id: 'inventory', label: 'Xom-ashyo Ombori', icon: Warehouse },
                    { id: 'suppliers', label: 'Yetkazib beruvchilar', icon: Users },
                    { id: 'orders', label: 'Buyurtmalar', icon: ShoppingBag },
                    { id: 'logs', label: 'O\'zgarishlar Tarixi', icon: History },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-[#161b22]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-4 md:p-8 shadow-3xl min-h-[500px]">
                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Qidirish (Nomi, Bo'lim, Kategoriya)..."
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 outline-none focus:border-blue-500/50 transition-all font-bold"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {activeTab === 'inventory' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {inventory.map((item) => (
                            <div key={item.id} className="bg-white/5 border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.07] transition-all group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-50"></div>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-600/10 px-3 py-1 rounded-full">{item.category}</span>
                                        <h3 className="text-xl font-black text-white mt-3 tracking-tight">{item.name}</h3>
                                    </div>
                                    <ShoppingBag size={24} className="text-gray-700 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Joriy Qoldiq</p>
                                            <p className={`text-3xl font-black mt-1 ${item.stock < item.min ? 'text-rose-500' : 'text-white'}`}>
                                                {item.stock} <span className="text-sm text-gray-400 font-bold">{item.unit}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Oxirgi Narx</p>
                                            <p className="text-lg font-black text-green-500">{item.price}</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${item.stock < item.min ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-blue-600'}`}
                                            style={{ width: `${Math.min((item.stock / item.min) * 50, 100)}%` }}
                                        ></div>
                                    </div>
                                    {item.stock < item.min && (
                                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter flex items-center gap-1">
                                            <TriangleAlert size={12} /> Minimal qoldiqdan kam!
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 uppercase tracking-[0.2em] text-[10px] font-black text-gray-500">
                                <tr>
                                    <th className="px-8 py-5 border-b border-white/5">Model</th>
                                    <th className="px-8 py-5 border-b border-white/5">Order Raqami</th>
                                    <th className="px-8 py-5 border-b border-white/5">Miqdor</th>
                                    <th className="px-8 py-5 border-b border-white/5">Muddat</th>
                                    <th className="px-8 py-5 border-b border-white/5 text-right">Holat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-10 text-center text-gray-500 font-bold uppercase tracking-widest text-xs">
                                            Tasdiqlangan rejalar hozircha yo'q
                                        </td>
                                    </tr>
                                ) : orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/5 transition-all group">
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-white uppercase tracking-tight">{order.models?.name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold">{order.models?.code}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-gray-400">#{order.order_number}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-white">{order.total_quantity} dona</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-bold text-gray-500">{new Date(order.deadline).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
                                                {order.status === 'Confirmed' ? 'Tasdiqlangan' : order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <div key={log.id} className="flex items-center gap-4 bg-white/5 p-5 rounded-[2rem] border border-white/5 group hover:border-blue-500/30 transition-all">
                                <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-110 transition-transform">
                                    <History size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-white tracking-widest">{log.user}</span>
                                        <span className="text-[10px] text-gray-600 font-bold">• {log.date}</span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {log.action}: <strong className="text-blue-400 uppercase tracking-tighter">{log.item}</strong>
                                    </p>
                                </div>
                                < ArrowUpRight className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Kirim Modal */}
            {showKirimModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-lg rounded-[3rem] p-8 shadow-4xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-white tracking-tight">Yangi Kirim Kiratish</h3>
                            <button onClick={() => setShowKirimModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleKirim} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mahsulot Nomi</label>
                                    <input
                                        required
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all font-bold"
                                        value={newOrder.item}
                                        onChange={(e) => setNewOrder({ ...newOrder, item: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Miqdori (kg/dona)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all font-bold"
                                        value={newOrder.qty}
                                        onChange={(e) => setNewOrder({ ...newOrder, qty: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Yetkazib beruvchi</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all font-bold"
                                        value={newOrder.supplier}
                                        onChange={(e) => setNewOrder({ ...newOrder, supplier: e.target.value })}
                                    >
                                        <option value="">Tanlang</option>
                                        {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Narxi (Birlik uchun)</label>
                                    <input
                                        placeholder="masalan: 2.50$"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all font-bold"
                                        value={newOrder.price}
                                        onChange={(e) => setNewOrder({ ...newOrder, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest text-xs">
                                Kirimni Saqlash
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Taminot;
