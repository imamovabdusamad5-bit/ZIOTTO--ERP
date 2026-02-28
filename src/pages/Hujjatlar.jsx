import React, { useState, useEffect } from 'react';
import { Plus, Save, FileText, Trash2, Search, ArrowRightLeft, Package, User, Calendar, Tag, Info, X, Activity, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Hujjatlar = () => {
    const { profile } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        doc_no: '',
        doc_type: 'ISSUE', // ISSUE, CONSUME, RETURN, SCRAP
        department_from: '',
        department_to: '',
        order_id: '',
        notes: ''
    });

    const [items, setItems] = useState([
        { material_type_id: '', qty: '', unit: 'kg', color: '', part_name: '' }
    ]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [docRes, orderRes, matRes] = await Promise.all([
                supabase.from('material_documents').select(`*, production_orders(order_number, id)`).order('created_at', { ascending: false }),
                supabase.from('production_orders').select('id, order_number').order('created_at', { ascending: false }),
                supabase.from('material_types').select('*').order('name')
            ]);

            if (docRes.data) setDocuments(docRes.data);
            if (orderRes.data) setOrders(orderRes.data);
            if (matRes.data) setMaterials(matRes.data);
        } catch (error) {
            console.error("Data fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setItems([...items, { material_type_id: '', qty: '', unit: 'kg', color: '', part_name: '' }]);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        // Auto-fill unit from material_type
        if (field === 'material_type_id') {
            const mat = materials.find(m => m.id === value);
            if (mat) newItems[index].unit = mat.unit || 'kg';
        }

        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.order_id) {
            alert("Iltimos, buyurtmani (Order) tanlang!");
            return;
        }
        if (items.some(i => !i.material_type_id || !i.qty)) {
            alert("Barcha satrlarni to'ldiring!");
            return;
        }

        try {
            setLoading(true);

            // 1. Create Document Header
            const { data: doc, error: docError } = await supabase
                .from('material_documents')
                .insert([{
                    ...formData,
                    created_by: profile?.id
                }])
                .select()
                .single();

            if (docError) throw docError;

            // 2. Create Items
            const itemsToSave = items.map(item => ({
                document_id: doc.id,
                ...item,
                qty: parseFloat(item.qty)
            }));

            const { error: itemsError } = await supabase
                .from('material_document_items')
                .insert(itemsToSave);

            if (itemsError) throw itemsError;

            alert("Hujjat muvaffaqiyatli saqlandi!");
            setShowForm(false);
            setFormData({ doc_no: '', doc_type: 'ISSUE', department_from: '', department_to: '', order_id: '', notes: '' });
            setItems([{ material_type_id: '', qty: '', unit: 'kg', color: '', part_name: '' }]);
            fetchData();
        } catch (error) {
            alert("Saqlashda xatolik: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getDocTypeColor = (type) => {
        switch (type) {
            case 'ISSUE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'CONSUME': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'RETURN': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'SCRAP': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getDocTypeLabel = (type) => {
        switch (type) {
            case 'ISSUE': return 'Mato Chiqimi (Issued)';
            case 'CONSUME': return 'Ishlatish (Used)';
            case 'RETURN': return 'Qaytarish (Returned)';
            case 'SCRAP': return 'Brak/Zayl (Scrap)';
            default: return type;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Hujjatlar (Nakladnoylar)</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Materiallar harakati va faktlarni kiritish</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => {
                            setShowForm(true);
                            setFormData({ ...formData, doc_no: `N-${Date.now().toString().slice(-6)}` });
                        }}
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 font-black text-xs uppercase tracking-widest"
                    >
                        <Plus size={18} />
                        Yangi Hujjat
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-[#161b22] rounded-[3rem] shadow-4xl border border-white/5 overflow-hidden animate-in slide-in-from-top-10 duration-500">
                    <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Yangi Nakladnoy Formasi</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Materiallar harakatini rasmiylashtiring</p>
                            </div>
                        </div>
                        <button onClick={() => setShowForm(false)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-10">
                        {/* Header Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Nakladnoy №</label>
                                <input
                                    required
                                    className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl font-black text-white focus:border-indigo-500 outline-none transition-all font-mono"
                                    value={formData.doc_no}
                                    onChange={e => setFormData({ ...formData, doc_no: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Hujjat Turi</label>
                                <select
                                    required
                                    className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl font-bold text-white focus:border-indigo-500 outline-none transition-all"
                                    value={formData.doc_type}
                                    onChange={e => {
                                        let from = formData.department_from;
                                        let to = formData.department_to;
                                        if (e.target.value === 'ISSUE') { from = 'Ombor'; to = 'Kesim'; }
                                        if (e.target.value === 'CONSUME') { from = 'Kesim'; to = 'Used'; }
                                        if (e.target.value === 'RETURN') { from = 'Kesim'; to = 'Ombor'; }
                                        setFormData({ ...formData, doc_type: e.target.value, department_from: from, department_to: to });
                                    }}
                                >
                                    <option value="ISSUE">Mato Chiqimi (Issued)</option>
                                    <option value="CONSUME">Ishlatish (Used)</option>
                                    <option value="RETURN">Qaytarish (Returned)</option>
                                    <option value="SCRAP">Brak/Zayl (Scrap)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Buyurtma (Order №)</label>
                                <select
                                    required
                                    className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl font-bold text-white focus:border-indigo-500 outline-none transition-all"
                                    value={formData.order_id}
                                    onChange={e => setFormData({ ...formData, order_id: e.target.value })}
                                >
                                    <option value="">Tanlang...</option>
                                    {orders.map(o => <option key={o.id} value={o.id}>{o.order_number}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Qaysi bo'limdan</label>
                                <input
                                    required
                                    className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl font-bold text-white focus:border-indigo-500 outline-none transition-all"
                                    value={formData.department_from}
                                    onChange={e => setFormData({ ...formData, department_from: e.target.value })}
                                    placeholder="Masalan: Ombor"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Qaysi bo'limga</label>
                                <input
                                    required
                                    className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl font-bold text-white focus:border-indigo-500 outline-none transition-all"
                                    value={formData.department_to}
                                    onChange={e => setFormData({ ...formData, department_to: e.target.value })}
                                    placeholder="Masalan: Kesim"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Izoh</label>
                                <input
                                    className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl font-bold text-white focus:border-indigo-500 outline-none transition-all"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Ixtiyoriy..."
                                />
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                                    <Package size={18} className="text-indigo-500" />
                                    Materiallar Ro'yxati
                                </h4>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="text-[10px] font-black text-indigo-400 flex items-center gap-2 hover:bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 transition-all uppercase tracking-widest"
                                >
                                    <Plus size={14} /> Material Qo'shish
                                </button>
                            </div>

                            <div className="border border-white/5 rounded-[2.5rem] overflow-hidden bg-black/20 shadow-inner">
                                <table className="w-full text-left">
                                    <thead className="bg-white/[0.02] text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono">
                                        <tr>
                                            <th className="px-8 py-5">Material (Master)</th>
                                            <th className="px-8 py-5 w-32">Birlik</th>
                                            <th className="px-8 py-5 w-40">Haqiqiy Miqdor</th>
                                            <th className="px-8 py-5">Rang/Detal (Ixtiyoriy)</th>
                                            <th className="px-6 py-5"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-5 py-4">
                                                    <select
                                                        required
                                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 transition-all font-bold text-xs"
                                                        value={item.material_type_id}
                                                        onChange={e => updateItem(idx, 'material_type_id', e.target.value)}
                                                    >
                                                        <option value="">Tanlang...</option>
                                                        {materials.map(m => (
                                                            <option key={m.id} value={m.id}>
                                                                {m.name} {m.code ? `(${m.code})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="px-4 py-3 bg-white/5 rounded-xl text-xs font-black text-gray-400 text-center uppercase tracking-widest">
                                                        {item.unit}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <input
                                                        required
                                                        type="number"
                                                        step="0.001"
                                                        className="w-full px-4 py-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-indigo-400 outline-none focus:border-indigo-500 transition-all font-black text-sm text-center"
                                                        value={item.qty}
                                                        placeholder="0.000"
                                                        onChange={e => updateItem(idx, 'qty', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex gap-2">
                                                        <input
                                                            className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 transition-all font-bold text-xs"
                                                            value={item.color}
                                                            placeholder="Rang..."
                                                            onChange={e => updateItem(idx, 'color', e.target.value)}
                                                        />
                                                        <input
                                                            className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 transition-all font-bold text-xs"
                                                            value={item.part_name}
                                                            placeholder="Detal..."
                                                            onChange={e => updateItem(idx, 'part_name', e.target.value)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <button type="button" onClick={() => handleRemoveItem(idx)} className="text-gray-600 hover:text-rose-500 transition-all p-3 hover:bg-rose-500/10 rounded-xl">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end gap-6 pt-10 border-t border-white/5">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center gap-3 shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <Save size={20} />
                                {loading ? 'Saqlanmoqda...' : 'Hujjatni Tasdiqlash'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Documents List */}
            <div className="bg-[#161b22] rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-3">
                        <clipboardList className="text-indigo-500" size={20} />
                        Mavjud Hujjatlar
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.02] text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Sana</th>
                                <th className="px-8 py-5">№ Nakladnoy</th>
                                <th className="px-8 py-5">Turi</th>
                                <th className="px-8 py-5">Buyurtma (Order)</th>
                                <th className="px-8 py-5">Yo'nalish</th>
                                <th className="px-8 py-5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-5 text-xs text-gray-400 font-mono">
                                        {new Date(doc.created_at).toLocaleString('uz-UZ').slice(0, 16)}
                                    </td>
                                    <td className="px-8 py-5 text-sm font-black text-white font-mono">
                                        {doc.doc_no}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border shadow-sm ${getDocTypeColor(doc.doc_type)}`}>
                                            {getDocTypeLabel(doc.doc_type)}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-xs font-black text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-3 py-1 rounded w-max">
                                            {doc.production_orders?.order_number || '-'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                            <span>{doc.department_from}</span>
                                            <arrowRightLeft size={12} className="text-gray-600" />
                                            <span>{doc.department_to}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-xs text-emerald-500 font-black">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                            <span>{doc.status}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {documents.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-gray-600 font-bold uppercase tracking-widest text-[10px] italic">
                                        Hujjatlar topilmadi
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Hujjatlar;
