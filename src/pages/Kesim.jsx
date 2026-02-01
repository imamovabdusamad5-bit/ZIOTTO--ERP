import React, { useState, useEffect } from 'react';
import {
    Scissors, Activity, AlertCircle, CheckCircle,
    Layers, Package, ChevronRight, ArrowUpRight,
    Search, Filter, Plus, ClipboardList, Ruler,
    History, TrendingUp, Printer, X, Trash2,
    ArrowDownLeft, ArrowRight,
    CheckCircle2, Scale
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { insertCuttingActual } from '../services/cuttingService';

const Kesim = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showFabricModal, setShowFabricModal] = useState(false);
    const [inventory, setInventory] = useState([]);
    const [fabricRequest, setFabricRequest] = useState({
        inventory_id: '',
        quantity: '',
        reason: 'Kesim uchun'
    });
    const [bundles, setBundles] = useState([]);
    const [showCutModal, setShowCutModal] = useState(false);
    const [cutData, setCutData] = useState([]);

    // Actual Material Usage State
    const [showActualModal, setShowActualModal] = useState(false);
    const [actualData, setActualData] = useState({
        roll_id: '',
        actual_weight_kg: '',
        layer_count: '',
        lay_length_meters: ''
    });

    const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'requests'
    const [requests, setRequests] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [confirmData, setConfirmData] = useState({ received_qty: '', notes: '' });

    useEffect(() => {
        fetchOrders();
        fetchBundles();
        if (activeTab === 'requests') fetchRequests();
    }, [activeTab]);

    const fetchBundles = async () => {
        const { data, error } = await supabase
            .from('production_bundles')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setBundles(data || []);
    };

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('production_orders')
            .select(`
                *,
                models(*, bom_items(*)),
                production_order_items(*)
            `)
            .in('status', ['Planning', 'Confirmed', 'Cutting'])
            .order('created_at', { ascending: false });

        if (!error) setOrders(data || []);
        setLoading(false);
    };

    const fetchRequests = async () => {
        setLoading(true);
        // Using activity_logs as a fallback or a mock for material_requests if table not yet created
        const { data, error } = await supabase
            .from('material_requests')
            .select('*, inventory:inventory_id(item_name, color, unit)')
            .eq('department', 'Kesim')
            .order('created_at', { ascending: false });

        if (!error) setRequests(data || []);
        setLoading(false);
    };

    const fetchMatchingInventory = async () => {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('category', 'Mato');
        if (!error) setInventory(data || []);
    };

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        if (!selectedOrder) {
            alert('Iltimos, avval buyurtmani tanlang');
            return;
        }
        if (!fabricRequest.inventory_id || !fabricRequest.quantity) {
            alert('Iltimos, barcha maydonlarni to\'ldiring');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('material_requests')
                .insert([{
                    inventory_id: fabricRequest.inventory_id,
                    requested_qty: Number(fabricRequest.quantity),
                    reason: fabricRequest.reason,
                    department: 'Kesim',
                    status: 'Pending',
                    order_id: selectedOrder.id
                }]);

            if (error) throw error;

            alert('Mato so\'rovi muvaffaqiyatli yuborildi!');
            setShowFabricModal(false);
            setFabricRequest({ inventory_id: '', quantity: '', reason: 'Kesim uchun' });
            fetchRequests();
        } catch (error) {
            alert('Xatolik: ' + error.message + '\n"material_requests" jadvali mavjudligini tekshiring.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReceipt = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase
            .from('material_requests')
            .update({
                status: 'Received',
                received_qty: Number(confirmData.received_qty),
                notes: confirmData.notes,
                received_at: new Date()
            })
            .eq('id', selectedRequest.id);

        if (!error) {
            if (Number(confirmData.received_qty) !== Number(selectedRequest.issued_qty)) {
                await supabase.from('activity_logs').insert([{
                    department: 'Kesim',
                    user_name: 'Kesim Usta',
                    action: `XABARDORLIK: ${selectedRequest.id} raqamli mato qabulida tafovut!`,
                    details: `Kutilgan: ${selectedRequest.issued_qty}, Olindi: ${confirmData.received_qty}. Izoh: ${confirmData.notes}`
                }]);
            }
            alert('Qabul tasdiqlandi!');
            setShowConfirmModal(false);
            fetchRequests();
        }
        setLoading(false);
    };

    const handleRecordCut = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const bundlesToInsert = cutData
                .filter(row => row.quantity && Number(row.quantity) > 0)
                .map((row, idx) => ({
                    order_id: selectedOrder.id,
                    bundle_number: `B-${selectedOrder.order_number}-${(bundles.filter(b => b.order_id === selectedOrder.id).length + idx + 1).toString().padStart(2, '0')}`,
                    color: row.color,
                    size: row.size,
                    quantity: Number(row.quantity),
                    current_step: 'Tasnif', // Move to Tasnif
                    status: 'Active'
                }));

            if (bundlesToInsert.length === 0) return;

            const { error } = await supabase.from('production_bundles').insert(bundlesToInsert);
            if (error) throw error;

            alert('Bichilgan detallar muvaffaqiyatli saqlandi va Tasnifga yuborildi!');
            setShowCutModal(false);
            fetchBundles();
        } catch (error) {
            alert('Xatolik: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveActual = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await insertCuttingActual({
                production_order_id: selectedOrder.id,
                ...actualData
            });

            if (data) {
                alert('Mato sarfi (Fakt) muvaffaqiyatli saqlandi!');
                setShowActualModal(false);
                setActualData({ roll_id: '', actual_weight_kg: '', layer_count: '', lay_length_meters: '' });
            }
        } catch (error) {
            alert('Xatolik yuz berdi: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.models?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-rose-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-rose-600/20 rotate-3 transition-transform hover:rotate-0">
                        <Scissors size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Kesim Bo'limi</h2>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Bichish va detallar hisobi</p>
                    </div>
                </div>

                <div className="flex bg-[#161b22] p-1.5 rounded-2xl border border-white/5">
                    {[
                        { id: 'orders', label: 'Buyurtmalar', icon: ClipboardList, color: 'text-rose-500' },
                        { id: 'requests', label: 'Mato So\'rovlari', icon: Package, color: 'text-blue-500' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white/10 text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? tab.color : ''} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'orders' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading && orders.length === 0 ? (
                        <div className="col-span-full py-20 text-center"><Activity className="animate-spin mx-auto text-rose-500" /></div>
                    ) : filteredOrders.map(order => {
                        const orderBundlesCount = bundles.filter(b => b.order_id === order.id).reduce((sum, b) => sum + b.quantity, 0);
                        const progress = (orderBundlesCount / order.total_quantity) * 100;

                        return (
                            <div key={order.id} className="bg-[#161b22] rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-rose-500/30 transition-all group shadow-2xl">
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full">{order.status}</span>
                                            <h3 className="mt-4 text-2xl font-black text-white leading-tight group-hover:text-rose-400 transition-colors uppercase">{order.models?.name}</h3>
                                            <p className="text-[10px] font-mono font-bold text-gray-500 mt-1 tracking-widest"># {order.order_number}</p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5">
                                            <div className="text-xl font-black text-white">{order.total_quantity}</div>
                                            <div className="text-[9px] font-bold text-gray-500 uppercase leading-none mt-1">Jami</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            <span>Progress</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                fetchMatchingInventory();
                                                setShowFabricModal(true);
                                            }}
                                            className="flex items-center justify-center gap-2 py-4 bg-white/5 text-gray-300 border border-white/5 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 active:scale-95 transition-all"
                                        >
                                            <ArrowUpRight size={14} className="text-rose-500" /> Mato So'rash
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setCutData(order.production_order_items.map(item => ({
                                                    color: item.color,
                                                    size: item.size_range,
                                                    quantity: ''
                                                })));
                                                setShowCutModal(true);
                                            }}
                                            className="flex items-center justify-center gap-2 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-rose-500 active:scale-95 transition-all shadow-xl shadow-rose-600/20"
                                        >
                                            <Scissors size={14} /> Hisobot Kirish
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowActualModal(true);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-2xl text-[10px] font-black uppercase hover:bg-blue-600/20 active:scale-95 transition-all"
                                    >
                                        <Scale size={14} /> Mato Sarfi (Fakt)
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-[#161b22] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Sana / ID</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Mato</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Miqdor (Kutilgan | Berilgan)</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Holat</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Amal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {requests.map(req => (
                                <tr key={req.id} className="hover:bg-white/5 transition-all group">
                                    <td className="px-10 py-6">
                                        <p className="text-sm font-black text-white">{new Date(req.created_at).toLocaleDateString()}</p>
                                        <p className="text-[10px] font-mono text-gray-600 uppercase">REQ-{req.id.slice(0, 5)}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500">
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white uppercase">{req.inventory?.item_name}</p>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase">{req.inventory?.color}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-white">{req.requested_qty} {req.inventory?.unit}</span>
                                            <ArrowRight size={14} className="text-gray-600" />
                                            <span className="text-sm font-black text-blue-500">{req.issued_qty || '---'} {req.inventory?.unit}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${req.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                                            req.status === 'Issued' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                                            }`}>
                                            {req.status === 'Pending' ? 'Kutilmoqda' : req.status === 'Issued' ? 'Berildi' : 'Qabul qilindi'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        {req.status === 'Issued' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setConfirmData({ received_qty: req.issued_qty, notes: '' });
                                                    setShowConfirmModal(true);
                                                }}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                                            >
                                                Qabul Qildim
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Request Modal */}
            {showFabricModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-4xl animate-in zoom-in-95 duration-300 relative">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                <ArrowUpRight className="text-rose-500" />
                                Mato So'rovnomasi
                            </h3>
                            <button onClick={() => setShowFabricModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRequest} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Matoni Tanlang</label>
                                <select
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-rose-500 transition-all font-bold"
                                    value={fabricRequest.inventory_id}
                                    onChange={(e) => setFabricRequest({ ...fabricRequest, inventory_id: e.target.value })}
                                >
                                    <option value="">Tanlang...</option>
                                    {inventory.map(item => (
                                        <option key={item.id} value={item.id}>{item.item_name} ({item.color}) - Qoldiq: {item.quantity} {item.unit}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Kerakli Miqdor (kg)</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-rose-500 transition-all font-black text-2xl"
                                    value={fabricRequest.quantity}
                                    onChange={(e) => setFabricRequest({ ...fabricRequest, quantity: e.target.value })}
                                />
                            </div>
                            <button className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-rose-600/20 uppercase tracking-widest text-xs mt-4">
                                Omborga So'rov Yuborish
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Receipt Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-4xl animate-in zoom-in-95 duration-300 relative">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                <CheckCircle2 className="text-emerald-500" />
                                Matoni Qabul Qilish
                            </h3>
                            <button onClick={() => setShowConfirmModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleConfirmReceipt} className="p-10 space-y-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Omborchi tomonidan berilgan miqdor: <span className="text-white text-lg ml-2">{selectedRequest?.issued_qty} kg</span></p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Haqiqiy Olingan Miqdor (kg)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all font-black text-2xl"
                                    value={confirmData.received_qty}
                                    onChange={(e) => setConfirmData({ ...confirmData, received_qty: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Izoh (Agarda farq bo'lsa)</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all font-bold min-h-[100px]"
                                    value={confirmData.notes}
                                    onChange={(e) => setConfirmData({ ...confirmData, notes: e.target.value })}
                                    placeholder="Farq sababini yozing..."
                                />
                            </div>

                            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-emerald-600/20 uppercase tracking-widest text-xs mt-4">
                                Qabulni Tasdiqlash
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Cut Results Modal */}
            {showCutModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                    <div className="bg-[#161b22] border border-white/10 rounded-[4rem] w-full max-w-2xl shadow-4xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                    <Scissors className="text-rose-500" />
                                    Bichilgan Detallar Hisoboti
                                </h3>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1"># {selectedOrder?.order_number} - {selectedOrder?.models?.name}</p>
                            </div>
                            <button onClick={() => setShowCutModal(false)} className="w-12 h-12 rounded-full hover:bg-white/5 transition-all flex items-center justify-center text-gray-500 text-2xl font-light"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleRecordCut} className="flex-1 overflow-y-auto p-10 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {cutData.map((row, idx) => (
                                    <div key={idx} className="bg-white/2 p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">{row.color}</span>
                                            <span className="text-lg font-black text-white">{row.size}</span>
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl focus:border-rose-500 outline-none font-black text-rose-500 text-center"
                                                value={row.quantity}
                                                onChange={e => {
                                                    const updated = [...cutData];
                                                    updated[idx].quantity = e.target.value;
                                                    setCutData(updated);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading || cutData.every(r => !r.quantity)}
                                    className="w-full py-6 bg-rose-600 text-white rounded-[2rem] font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-rose-600/20 disabled:opacity-50"
                                >
                                    {loading ? 'Bajarilmoqda...' : 'Hisobotni Tasdiqlash & Yuborish'}
                                </button>
                                <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-4">Detallar avtomatik ravishda Tasnif bo'limiga o'tadi</p>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ACTUAL USAGE MODAL */}
            {showActualModal && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-4xl animate-in zoom-in-95 duration-300 relative">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                <Scale className="text-blue-500" />
                                Mato Sarfi (Fakt)
                            </h3>
                            <button onClick={() => setShowActualModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveActual} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Rulon ID / Shtrixkod</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Masalan: M-2024-001"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all font-bold"
                                    value={actualData.roll_id}
                                    onChange={(e) => setActualData({ ...actualData, roll_id: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Haqiqiy Og'irlik (kg)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all font-black text-2xl"
                                    value={actualData.actual_weight_kg}
                                    onChange={(e) => setActualData({ ...actualData, actual_weight_kg: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Qavatlar Soni</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all font-bold"
                                        value={actualData.layer_count}
                                        onChange={(e) => setActualData({ ...actualData, layer_count: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Lekal Uzunligi (m)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all font-bold"
                                        value={actualData.lay_length_meters}
                                        onChange={(e) => setActualData({ ...actualData, lay_length_meters: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest text-xs mt-4">
                                Faktni Saqlash
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Kesim;
