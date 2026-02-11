import React, { useState } from 'react';
import {
    CheckCircle2, Search, Truck, ShoppingCart, Tag, Plus, ArrowDownCircle, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TayyorMahsulotOmbori = ({ inventory, onRefresh, viewMode }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [showKirimModal, setShowKirimModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Filter
    const filteredInventory = inventory.filter(item => {
        const query = searchTerm.toLowerCase();
        return (
            !searchTerm ||
            (item.item_name || '').toLowerCase().includes(query) ||
            (item.color || '').toLowerCase().includes(query) ||
            (item.color_code || '').toLowerCase().includes(query) ||
            (item.batch_number || '').toLowerCase().includes(query)
        );
    });

    // Sale State
    const [saleData, setSaleData] = useState({
        inventory_id: '',
        quantity: '',
        client_name: '',
        price: '',
        notes: ''
    });

    // Kirim State
    const [kirimData, setKirimData] = useState({
        item_name: '',
        color: '',
        color_code: '',
        quantity: '',
        unit: 'dona',
        reason: 'Yangi Kirim'
    });

    const handleSale = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const item = inventory.find(i => i.id === saleData.inventory_id);
            if (!item) return;

            if (Number(saleData.quantity) > Number(item.quantity)) {
                alert('Omborda yetarli mahsulot yo\'q!');
                setLoading(false);
                return;
            }

            // 1. Update Inventory
            const newQty = Number(item.quantity) - Number(saleData.quantity);
            await supabase.from('inventory').update({ quantity: newQty, last_updated: new Date() }).eq('id', item.id);

            // 2. Log Inventory Movement
            await supabase.from('inventory_logs').insert([{
                inventory_id: item.id,
                type: 'Out',
                quantity: Number(saleData.quantity),
                reason: `Sotuv: ${saleData.client_name} (Narxi: $${saleData.price}) - ${saleData.notes}`
            }]);

            alert('Mahsulot sotuvga chiqarildi!');
            setShowSaleModal(false);
            setSaleData({ inventory_id: '', quantity: '', client_name: '', price: '', notes: '' });
            await onRefresh();
        } catch (error) {
            alert('Xatolik: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKirim = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            // Check if exists
            const { data: existing } = await supabase.from('inventory')
                .select('*')
                .eq('item_name', kirimData.item_name)
                .eq('color', kirimData.color)
                .eq('category', 'Tayyor Mahsulot')
                .maybeSingle();

            let inventoryId;
            if (existing) {
                const newQty = Number(existing.quantity || 0) + Number(kirimData.quantity);
                await supabase.from('inventory').update({
                    quantity: newQty,
                    last_updated: new Date(),
                    color_code: kirimData.color_code || existing.color_code
                }).eq('id', existing.id);
                inventoryId = existing.id;
            } else {
                const { data: created, error } = await supabase.from('inventory').insert([{
                    item_name: kirimData.item_name,
                    category: 'Tayyor Mahsulot',
                    quantity: Number(kirimData.quantity),
                    unit: kirimData.unit,
                    color: kirimData.color,
                    color_code: kirimData.color_code,
                    last_updated: new Date()
                }]).select().single();
                if (error) throw error;
                inventoryId = created.id;
            }

            // Log
            await supabase.from('inventory_logs').insert([{
                inventory_id: inventoryId,
                type: 'In',
                quantity: Number(kirimData.quantity),
                reason: kirimData.reason
            }]);

            alert(`Mahsulot muvaffaqiyatli kirim qilindi!`);
            setShowKirimModal(false);
            setKirimData({ item_name: '', color: '', color_code: '', quantity: '', unit: 'dona', reason: 'Yangi Kirim' });
            await onRefresh();
        } catch (error) {
            alert('Xatolik: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-[3rem] border border-[var(--border-color)] shadow-2xl backdrop-blur-3xl">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-hover:text-emerald-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Model, rang yoki artikul..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-3xl focus:border-emerald-500/50 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none font-bold transition-all shadow-inner hover:bg-[var(--bg-card-hover)]"
                    />
                </div>
                <button
                    onClick={() => setShowKirimModal(true)}
                    className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 border border-emerald-400/20"
                >
                    <Plus size={18} /> Yangi Kirim
                </button>
            </div>

            {/* Inventory Display */}
            {viewMode === 'table' ? (
                // TABLE VIEW
                <div className="overflow-hidden bg-[var(--bg-card)] backdrop-blur-3xl rounded-xl border border-[var(--border-color)] shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-[var(--bg-sidebar-footer)] text-[var(--text-secondary)] uppercase tracking-widest text-[10px] font-black border-b border-[var(--border-color)] sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)]">№</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)]">Model Nomi</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)]">Rangi</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)]">Artikul</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)] text-right">Miqdor</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)] text-center">Birlik</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)] text-center">Oxirgi Kirim</th>
                                    <th className="px-4 py-3 text-center">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {filteredInventory.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-[var(--bg-card-hover)] transition-colors even:bg-[var(--bg-body)]">
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] text-[var(--text-secondary)] font-mono text-xs">{index + 1}</td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] font-bold text-[var(--text-primary)]">{item.item_name}</td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] text-[var(--text-primary)] flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full border border-[var(--border-color)] shadow-sm" style={{ backgroundColor: item.color === 'Oq' ? '#fff' : item.color === 'Qora' ? '#000' : 'gray' }}></div>
                                            {item.color}
                                        </td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] font-mono text-xs text-[var(--text-secondary)]">{item.color_code || '-'}</td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] text-right font-bold text-[var(--text-primary)]">{item.quantity}</td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)] uppercase">{item.unit === 'dona' ? 'dona' : item.unit}</td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)]">
                                            {new Date(item.last_updated).toLocaleDateString()}
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => {
                                                        setSaleData({ ...saleData, inventory_id: item.id });
                                                        setShowSaleModal(true);
                                                    }}
                                                    className="p-1.5 hover:bg-emerald-50 text-emerald-500 rounded transition-colors"
                                                    title="Sotuvga chiqarish"
                                                >
                                                    <ShoppingCart size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // CARD VIEW (Grid)
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredInventory.map(item => (
                        <div key={item.id} className="bg-[var(--bg-card)] p-0 rounded-[2.5rem] overflow-hidden border border-[var(--border-color)] hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all group relative backdrop-blur-3xl sm:backdrop-blur-xl">
                            <div className="absolute top-6 right-6 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-lg">
                                ID: {item.id}
                            </div>
                            <div className="bg-[var(--bg-body)] p-8 border-b border-[var(--border-color)] flex flex-col gap-4">
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight leading-none bg-gradient-to-r from-[var(--text-primary)] to-slate-400 bg-clip-text text-transparent">{item.item_name}</h3>
                                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mt-3 bg-[var(--bg-card)] w-fit px-3 py-1.5 rounded-lg border border-[var(--border-color)]">Artikul: {item.color_code || '---'}</p>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Rangi</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full border border-[var(--border-color)] shadow-lg" style={{ backgroundColor: item.color === 'Oq' ? '#fff' : item.color === 'Qora' ? '#000' : 'gray' }}></div>
                                            <p className="text-sm font-bold text-[var(--text-primary)] uppercase">{item.color}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Yoshi / O'lcham</p>
                                        <div className="flex items-center gap-2">
                                            <Tag size={16} className="text-emerald-500" />
                                            <p className="text-sm font-bold text-[var(--text-primary)] uppercase">{item.unit === 'dona' ? 'Standard' : item.unit}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center justify-between group-hover:bg-emerald-500/10 transition-colors shadow-inner">
                                    <div>
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Mavjud Qoldiq</p>
                                        <h4 className="text-3xl font-black text-[var(--text-primary)] flex items-baseline gap-2">
                                            {item.quantity}
                                            <span className="text-xs font-black text-[var(--text-secondary)]">dona</span>
                                        </h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Oxirgi Kirim</p>
                                        <p className="text-xs font-bold text-[var(--text-secondary)]">{new Date(item.last_updated).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setSaleData({ ...saleData, inventory_id: item.id });
                                        setShowSaleModal(true);
                                    }}
                                    className="w-full py-5 bg-[var(--bg-body)] text-[var(--text-secondary)] rounded-2xl font-black uppercase text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-3 tracking-widest border border-[var(--border-color)] hover:border-emerald-500/50 hover:shadow-emerald-600/30 active:scale-95"
                                >
                                    <ShoppingCart size={18} /> Sotuvga Chiqarish
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* SALE MODAL */}
            {showSaleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-lg rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl shadow-emerald-900/20 relative backdrop-blur-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="p-8 border-b border-[var(--border-color)] bg-[var(--bg-card)] sticky top-0 z-10">
                            <button onClick={() => setShowSaleModal(false)} className="absolute top-4 right-4 p-3 rounded-2xl bg-[var(--bg-body)] hover:bg-rose-500/20 text-[var(--text-secondary)] hover:text-rose-500 transition-all border border-[var(--border-color)]"><X size={20} /></button>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-4">
                                <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/30"><Truck size={24} /></div>
                                <span className="bg-gradient-to-r from-[var(--text-primary)] to-slate-400 bg-clip-text text-transparent">Mahsulotni Sotish</span>
                            </h3>
                            <p className="text-xs font-bold text-emerald-500/60 uppercase mt-2 ml-[4.25rem] tracking-wider">Mijozga yuklab jo'natish</p>
                        </div>

                        <form onSubmit={handleSale} className="p-8 space-y-6">
                            <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 relative z-10">Tanlangan Mahsulot</p>
                                <h4 className="text-xl font-black text-[var(--text-primary)] uppercase relative z-10 tracking-tight">
                                    {inventory.find(i => i.id === saleData.inventory_id)?.item_name}
                                </h4>
                                <div className="flex gap-4 mt-3 text-xs font-bold text-[var(--text-secondary)] uppercase relative z-10">
                                    <span className="bg-[var(--bg-body)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">Rang: {inventory.find(i => i.id === saleData.inventory_id)?.color}</span>
                                    <span className="bg-[var(--bg-body)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">Artikul: {inventory.find(i => i.id === saleData.inventory_id)?.color_code || '---'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">1. Mijoz Nomi</label>
                                <input
                                    required
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-emerald-500 focus:bg-[var(--input-focus-bg)] transition-all font-bold placeholder-[var(--text-secondary)] shadow-inner"
                                    placeholder="Masalan: ABDULLOH SAVDO..."
                                    value={saleData.client_name}
                                    onChange={e => setSaleData({ ...saleData, client_name: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">2. Miqdor (Dona)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-emerald-500 focus:bg-[var(--input-focus-bg)] transition-all font-black text-2xl placeholder-[var(--text-secondary)] shadow-inner"
                                        placeholder="0"
                                        value={saleData.quantity}
                                        onChange={e => setSaleData({ ...saleData, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">3. Narxi (Opt, $)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-emerald-500 focus:bg-[var(--input-focus-bg)] transition-all font-black text-xl placeholder-[var(--text-secondary)] shadow-inner"
                                        placeholder="$0.00"
                                        value={saleData.price}
                                        onChange={e => setSaleData({ ...saleData, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">4. Qo'shimcha Izoh</label>
                                <textarea
                                    rows="2"
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-emerald-500 focus:bg-[var(--input-focus-bg)] transition-all font-bold placeholder-[var(--text-secondary)] resize-none shadow-inner"
                                    placeholder="Yuk xati raqami yoki mashina nomeri..."
                                    value={saleData.notes}
                                    onChange={e => setSaleData({ ...saleData, notes: e.target.value })}
                                />
                            </div>

                            <div className="pt-2 flex gap-4">
                                <button type="button" onClick={() => setShowSaleModal(false)} className="flex-1 py-5 bg-[var(--bg-body)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] rounded-[2rem] font-bold uppercase tracking-widest transition-all text-xs border border-[var(--border-color)]">Bekor qilish</button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-xl transition-all flex items-center justify-center gap-3 text-xs active:scale-95 shadow-emerald-600/20"
                                >
                                    {loading ? 'Bajarilmoqda...' : (
                                        <>
                                            <ShoppingCart size={18} />
                                            Sotuvni Tasdiqlash
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* KIRIM MODAL */}
            {showKirimModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-lg rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-200 relative shadow-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] sticky top-0 z-10">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-3">
                                    <ArrowDownCircle size={28} className="text-emerald-500" />
                                    <span className="bg-gradient-to-r from-[var(--text-primary)] to-slate-400 bg-clip-text text-transparent">Yangi Kirim</span>
                                </h3>
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase mt-1 ml-10 tracking-wider">Tayyor mahsulotni omborga olish</p>
                            </div>
                            <button onClick={() => setShowKirimModal(false)} className="w-12 h-12 rounded-2xl bg-[var(--bg-body)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-rose-500 transition-all border border-[var(--border-color)]">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleKirim} className="p-8 space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Model Nomi</label>
                                <input required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-emerald-500 focus:bg-[var(--input-focus-bg)] transition-all font-bold uppercase shadow-inner" value={kirimData.item_name} onChange={e => setKirimData({ ...kirimData, item_name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Rangi</label>
                                    <input required className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-emerald-500 focus:bg-[var(--input-focus-bg)] transition-all font-bold uppercase shadow-inner" value={kirimData.color} onChange={e => setKirimData({ ...kirimData, color: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Artikul (Code)</label>
                                    <input className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-emerald-500 focus:bg-[var(--input-focus-bg)] transition-all font-bold uppercase shadow-inner" value={kirimData.color_code} onChange={e => setKirimData({ ...kirimData, color_code: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Miqdor</label>
                                    <input required type="number" className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-emerald-500 focus:bg-[var(--input-focus-bg)] transition-all font-black text-2xl shadow-inner" value={kirimData.quantity} onChange={e => setKirimData({ ...kirimData, quantity: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">O'lchov Birligi</label>
                                    <select className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-emerald-500 focus:bg-[var(--input-focus-bg)] transition-all font-bold uppercase appearance-none cursor-pointer shadow-inner" value={kirimData.unit} onChange={e => setKirimData({ ...kirimData, unit: e.target.value })}>
                                        <option value="dona" className="bg-[var(--bg-card)]">Dona</option>
                                        <option value="kg" className="bg-[var(--bg-card)]">Kg</option>
                                        <option value="metr" className="bg-[var(--bg-card)]">Metr</option>
                                        <option value="komplekt" className="bg-[var(--bg-card)]">Komplekt</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button type="submit" disabled={loading} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-xl transition-all shadow-emerald-600/20 text-xs active:scale-95">
                                    {loading ? 'Saqlanmoqda...' : 'Kirimni Tasdiqlash'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TayyorMahsulotOmbori;
