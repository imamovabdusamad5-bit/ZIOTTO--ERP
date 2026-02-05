import React, { useState } from 'react';
import {
    Package, Search, Plus, History, ArrowDownCircle,
    ArrowUpRight, Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AksessuarOmbori = ({ inventory, references, orders, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showInboundModal, setShowInboundModal] = useState(false);
    const [showOutboundModal, setShowOutboundModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Filter
    const filteredInventory = inventory.filter(item => {
        const query = searchTerm.toLowerCase();
        return (
            !searchTerm ||
            item.item_name?.toLowerCase().includes(query) ||
            item.color?.toLowerCase().includes(query) ||
            item.batch_number?.toLowerCase().includes(query)
        );
    });

    const [inboundData, setInboundData] = useState({
        selected_material_name: '',
        color: 'Asosiy',
        color_code: '',
        quantity: '',
        reason: 'Yangi aksessuar'
    });

    const [outboundData, setOutboundData] = useState({
        inventory_id: '',
        quantity: '',
        reason: 'Ishlab chiqarishga'
    });

    // HANDLERS
    const handleKirim = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const cleanName = inboundData.selected_material_name.trim();
            const cleanColor = inboundData.color.trim();

            if (!cleanName) return alert('Iltimos, aksessuar nomini tanlang!');
            if (!inboundData.quantity || Number(inboundData.quantity) <= 0) return alert('Iltimos, to\'g\'ri miqdor kiriting!');

            const ref = references.find(r => r.name === inboundData.selected_material_name);
            const unit = ref ? ref.unit : 'dona';
            const refId = ref ? ref.id : null;


            // Check existing
            const { data: existing } = await supabase.from('inventory')
                .select('*')
                .eq('item_name', cleanName)
                .eq('color', cleanColor)
                .filter('category', 'ilike', 'Aksessuar')
                .maybeSingle();

            let inventoryId;
            if (existing) {
                const { error: updateError } = await supabase.from('inventory').update({
                    quantity: Number(existing.quantity || 0) + Number(inboundData.quantity),
                    last_updated: new Date()
                }).eq('id', existing.id);
                if (updateError) throw updateError;
                inventoryId = existing.id;
            } else {
                const { data: created, error } = await supabase.from('inventory').insert([{
                    item_name: cleanName,
                    category: 'Aksessuar',
                    quantity: Number(inboundData.quantity),
                    unit: unit,
                    color: cleanColor,
                    color_code: inboundData.color_code.trim(),
                    reference_id: refId,
                    last_updated: new Date()
                }]).select().single();
                if (error) throw error;
                inventoryId = created.id;
            }

            const { error: logError } = await supabase.from('inventory_logs').insert([{
                inventory_id: inventoryId,
                type: 'In',
                quantity: Number(inboundData.quantity),
                reason: inboundData.reason
            }]);
            if (logError) throw logError;

            // Success feedback
            setShowInboundModal(false);
            setInboundData({ selected_material_name: '', color: 'Asosiy', color_code: '', quantity: '', reason: 'Yangi aksessuar' });

            // Refresh data
            await onRefresh();
            alert(`Muvaffaqiyatli! Aksessuar qabul qilindi.`);
        } catch (error) {
            console.error('Kirim xatosi:', error);
            alert('Xato: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChiqim = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const item = inventory.find(i => i.id === outboundData.inventory_id);
            if (Number(outboundData.quantity) > Number(item.quantity)) {
                alert('Yetarli miqdor yo\'q!');
                return;
            }

            const newQty = Number(item.quantity) - Number(outboundData.quantity);
            await supabase.from('inventory').update({ quantity: newQty, last_updated: new Date() }).eq('id', item.id);

            await supabase.from('inventory_logs').insert([{
                inventory_id: item.id,
                type: 'Out',
                quantity: Number(outboundData.quantity),
                reason: outboundData.reason
            }]);

            setShowOutboundModal(false);
            setOutboundData({ inventory_id: '', quantity: '', reason: 'Ishlab chiqarishga' });
            await onRefresh();
            alert('Chiqim muvaffaqiyatli amalga oshirildi!');
        } catch (error) {
            alert('Xato: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0f172a]/60 backdrop-blur-3xl p-6 rounded-[3rem] border border-white/5 shadow-2xl">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-purple-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Aksessuar qidiruv..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-[#020617]/50 border border-white/5 rounded-3xl focus:border-purple-500/50 text-white placeholder-slate-500 outline-none font-bold transition-all shadow-inner hover:bg-[#020617]/80"
                    />
                </div>
                <button
                    onClick={() => setShowInboundModal(true)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-[2rem] hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20 font-black uppercase text-xs tracking-widest border border-purple-400/20"
                >
                    <Plus size={18} /> Yangi Aksessuar
                </button>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredInventory.map(item => (
                    <div key={item.id} className="bg-[#0f172a]/60 backdrop-blur-3xl p-0 rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-900/10 transition-all group flex flex-col">
                        <div className="bg-[#020617]/50 p-6 border-b border-white/5 flex items-start justify-between">
                            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <Package size={24} />
                            </div>
                            <div className="text-right">
                                <h4 className="text-3xl font-black text-white">{item.quantity}</h4>
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.unit}</p>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <div className="mb-6 flex-1">
                                <h4 className="font-black text-white uppercase text-lg leading-tight mb-2 tracking-tight bg-gradient-to-r from-white via-purple-100 to-slate-400 bg-clip-text text-transparent">{item.item_name}</h4>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-lg text-slate-400 font-bold uppercase border border-white/5">{item.color}</span>
                                    {item.color_code && <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-lg text-slate-400 font-bold uppercase border border-white/5">{item.color_code}</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => {
                                        setInboundData({
                                            selected_material_name: item.item_name,
                                            color: item.color,
                                            color_code: item.color_code,
                                            quantity: '',
                                            reason: 'Qaytim'
                                        });
                                        setShowInboundModal(true);
                                    }}
                                    className="py-3 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:bg-purple-500/20 hover:text-purple-300 transition-all hover:border hover:border-purple-500/20 flex flex-col items-center gap-1"
                                >
                                    <History size={16} /> Qaytim
                                </button>
                                <button
                                    onClick={() => {
                                        setOutboundData({
                                            inventory_id: item.id,
                                            quantity: '',
                                            reason: 'Ishlab chiqarishga'
                                        });
                                        setShowOutboundModal(true);
                                    }}
                                    className="py-3 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:bg-rose-500/20 hover:text-rose-300 transition-all hover:border hover:border-rose-500/20 flex flex-col items-center gap-1"
                                >
                                    <ArrowUpRight size={16} /> Chiqim
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredInventory.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 border border-white/5 rounded-[3rem] bg-[#0f172a]/30 backdrop-blur-sm">
                    <Package size={48} className="mb-4 opacity-20" />
                    <span className="font-bold uppercase tracking-widest text-xs">Aksessuarlar topilmadi</span>
                </div>
            )}

            {/* INBOUND MODAL */}
            {showInboundModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#0f172a] border border-white/10 w-full max-w-lg rounded-[3rem] p-10 space-y-8 shadow-2xl shadow-purple-900/20 animate-in zoom-in-95 duration-300 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-8 sticky top-0 bg-[#0f172a] z-10 pt-2">
                            <div className="p-3 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-600/30">
                                <ArrowDownCircle size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight bg-gradient-to-r from-white via-purple-200 to-slate-400 bg-clip-text text-transparent">Aksessuar Kirim</h3>
                                <p className="text-[11px] text-purple-300/60 font-black uppercase tracking-widest mt-1">Omborga yangi aksessuar qabul qilish</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nomi</label>
                                <select
                                    className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500 focus:bg-[#020617] transition-all font-bold appearance-none cursor-pointer placeholder-slate-500 shadow-inner"
                                    value={inboundData.selected_material_name}
                                    onChange={(e) => setInboundData({ ...inboundData, selected_material_name: e.target.value })}
                                >
                                    <option value="" className="bg-slate-900 text-slate-500">Tanlang...</option>
                                    {[...new Set(references.filter(r => r.type === 'Aksessuar').map(r => r.name))].map(n => (
                                        <option key={n} value={n} className="bg-slate-900 text-white">{n}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Rangi</label>
                                    <input
                                        className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500 focus:bg-[#020617] transition-all font-bold placeholder-slate-500 shadow-inner"
                                        value={inboundData.color}
                                        onChange={e => setInboundData({ ...inboundData, color: e.target.value })}
                                        placeholder="Masalan: Qora"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Miqdor</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500 focus:bg-[#020617] transition-all font-black text-lg placeholder-slate-500 shadow-inner"
                                        value={inboundData.quantity}
                                        onChange={e => setInboundData({ ...inboundData, quantity: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setShowInboundModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all">Bekor qilish</button>
                                <button onClick={handleKirim} className="flex-[2] py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-purple-600/30 transition-all active:scale-95">Saqlash</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showOutboundModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#0f172a] border border-white/10 w-full max-w-lg rounded-[3rem] p-10 space-y-8 shadow-2xl shadow-rose-900/20 animate-in zoom-in-95 duration-300 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-8 sticky top-0 bg-[#0f172a] z-10 pt-2">
                            <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/30">
                                <ArrowUpRight size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight bg-gradient-to-r from-white via-rose-200 to-slate-400 bg-clip-text text-transparent">Chiqim Qilish</h3>
                                <p className="text-[11px] text-rose-300/60 font-black uppercase tracking-widest mt-1">Aksessuarni ishlab chiqarishga berish</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Chiqim Miqdori</label>
                                <input
                                    type="number"
                                    className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-rose-500 focus:bg-[#020617] transition-all font-black text-2xl placeholder-slate-500 shadow-inner"
                                    value={outboundData.quantity}
                                    onChange={e => setOutboundData({ ...outboundData, quantity: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Izoh / Sabab</label>
                                <input
                                    className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-rose-500 focus:bg-[#020617] transition-all font-bold placeholder-slate-500 shadow-inner"
                                    value={outboundData.reason}
                                    onChange={e => setOutboundData({ ...outboundData, reason: e.target.value })}
                                    placeholder="Masalan: Ishlab chiqarish uchun"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setShowOutboundModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all">Bekor qilish</button>
                                <button onClick={handleChiqim} className="flex-[2] py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-600/30 transition-all active:scale-95">Tasdiqlash</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AksessuarOmbori;
