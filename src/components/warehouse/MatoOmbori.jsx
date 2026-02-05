import React, { useState } from 'react';
import {
    Warehouse, Search, Plus, History, ArrowDownCircle,
    ArrowUpRight, ScrollText, Hash, Weight, Trash2, ClipboardList, Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MatoOmbori = ({ inventory, references, orders, onRefresh }) => {
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
            item.color_code?.toLowerCase().includes(query) ||
            item.material_types?.thread_type?.toLowerCase().includes(query) ||
            item.material_types?.grammage?.toString().includes(query) ||
            item.batch_number?.toLowerCase().includes(query)
        );
    });

    // Inbound State
    const [inboundData, setInboundData] = useState({
        selected_material_name: '',
        reference_id: '',
        color: '',
        color_code: '',
        batch_number: '',
        quantity: '',
        reason: 'Yangi kirim',
        rolls: []
    });

    // Outbound State
    const [outboundData, setOutboundData] = useState({
        inventory_id: '',
        quantity: '',
        order_id: '',
        reason: 'Kesimga (Ishlab chiqarishga)'
    });

    // --- HANDLERS ---

    const handleKirim = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            // Loose equality check (==) to handle string '1' vs number 1 id mismatch
            const ref = references.find(r => r.id == inboundData.reference_id);
            if (!ref) {
                console.error("Reference ID mismatch:", inboundData.reference_id, references);
                alert("Xatolik: Mato turi topilmadi (ID mismatch). Iltimos qaytadan tanlang.");
                setLoading(false);
                return;
            }

            // 1. Check existing
            const cleanName = ref.name.trim();
            const cleanColor = inboundData.color.trim();
            const cleanBatch = inboundData.batch_number.trim();
            const cleanColorCode = inboundData.color_code.trim();

            const { data: existing } = await supabase
                .from('inventory')
                .select('*')
                .eq('item_name', cleanName)
                .eq('color', cleanColor)
                .eq('category', 'Mato')
                .eq('batch_number', cleanBatch)
                .maybeSingle();

            let inventoryId;

            if (existing) {
                console.log("Updating existing inventory item:", existing.id);
                const newQty = Number(existing.quantity || 0) + Number(inboundData.quantity);
                const { error: updErr } = await supabase.from('inventory').update({
                    quantity: newQty,
                    last_updated: new Date(),
                    color_code: cleanColorCode || existing.color_code
                }).eq('id', existing.id);
                if (updErr) throw updErr;
                inventoryId = existing.id;
            } else {
                console.log("Creating new inventory item");
                const { data: created, error } = await supabase
                    .from('inventory')
                    .insert([{
                        item_name: cleanName,
                        category: 'Mato',
                        quantity: Number(inboundData.quantity),
                        unit: ref.unit,
                        color: cleanColor,
                        color_code: cleanColorCode,
                        batch_number: cleanBatch,
                        reference_id: ref.id,
                        last_updated: new Date()
                    }])
                    .select()
                    .single();
                if (error) throw error;
                inventoryId = created.id;
            }

            // 2. Log
            await supabase.from('inventory_logs').insert([{
                inventory_id: inventoryId,
                type: 'In',
                quantity: Number(inboundData.quantity),
                batch_number: cleanBatch,
                reason: inboundData.reason
            }]);

            // 3. Rolls
            if (inboundData.rolls.length > 0) {
                const rollsToInsert = inboundData.rolls.map((r, idx) => ({
                    inventory_id: inventoryId,
                    roll_number: `Poy-${(idx + 1).toString().padStart(3, '0')}`,
                    weight: Number(r.weight)
                }));
                await supabase.from('inventory_rolls').insert(rollsToInsert);
            }

            console.log("Mato muvaffaqiyatli saqlandi. ID:", inventoryId);
            console.log("Mato muvaffaqiyatli saqlandi. ID:", inventoryId);
            // alert(`DIQQAT: Mato muvaffaqiyatli qabul qilindi!\nBaza ID: ${inventoryId}`);

            // Clean state first
            setShowInboundModal(false);
            setInboundData({ reference_id: '', color: '', color_code: '', batch_number: '', quantity: '', reason: 'Yangi kirim', rolls: [] });

            // Update parent state
            await onRefresh();

            // Simple success toast/alert
            alert("Mato muvaffaqiyatli qo'shildi!");

        } catch (error) {
            alert('Xatolik: ' + error.message);
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
                alert('Omborda yetarli mato yo\'q!');
                return;
            }

            // 1. Update Inventory
            const newQty = Number(item.quantity) - Number(outboundData.quantity);
            await supabase.from('inventory').update({ quantity: newQty, last_updated: new Date() }).eq('id', item.id);

            // 2. Reason & Order Logic
            let finalReason = outboundData.reason;
            const selectedOrder = orders.find(o => o.id === outboundData.order_id);
            if (selectedOrder) {
                finalReason = `${outboundData.reason} (Buyurtma: #${selectedOrder.order_number})`;
                if (selectedOrder.status === 'Planning') {
                    await supabase.from('production_orders').update({ status: 'Cutting' }).eq('id', selectedOrder.id);
                }
            }

            // 3. Log
            await supabase.from('inventory_logs').insert([{
                inventory_id: item.id,
                type: 'Out',
                quantity: Number(outboundData.quantity),
                reason: finalReason
            }]);

            alert('Mato muvaffaqiyatli chiqim qilindi!');
            // window.location.reload();
            setShowOutboundModal(false);
            onRefresh();
        } catch (error) {
            alert('Xatolik: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Search / Add */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0f172a]/60 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Mato, rang yoki partiya bo'yicha qidiruv..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-[#020617]/50 border border-white/5 rounded-2xl focus:border-indigo-500/50 text-white placeholder-slate-500 outline-none font-bold transition-all shadow-inner hover:bg-[#020617]/80"
                    />
                </div>
                <button
                    onClick={() => setShowInboundModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 font-black uppercase text-xs tracking-widest border border-indigo-400/20"
                >
                    <Plus size={18} /> Yangi Mato Kirimi
                </button>
            </div>

            {/* Content Table */}
            <div className="overflow-hidden bg-[#0f172a]/60 backdrop-blur-3xl rounded-[3rem] border border-white/5 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#020617]/50 text-slate-400 uppercase tracking-widest text-[10px] font-black border-b border-white/5">
                            <tr>
                                <th className="px-8 py-6">Mato Nomi / Turi</th>
                                <th className="px-8 py-6">Xususiya (Parametr)</th>
                                <th className="px-8 py-6">Rangi / Kodi</th>
                                <th className="px-8 py-6 text-right">Qoldiq</th>
                                <th className="px-8 py-6 text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredInventory.map(item => (
                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6 align-top">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                                <Warehouse size={26} />
                                            </div>
                                            <div>
                                                <div className="text-white font-black text-lg uppercase tracking-tight leading-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">{item.item_name}</div>
                                                <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Partiya: {item.batch_number || '---'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 align-top text-slate-300 font-bold text-sm">
                                        {item.material_types?.thread_type || '---'}
                                        <br />
                                        <span className="text-xs text-slate-500 font-medium">{item.material_types?.grammage ? `${item.material_types.grammage} gr` : ''}</span>
                                    </td>
                                    <td className="px-8 py-6 align-top">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-white font-bold uppercase text-sm tracking-wide">{item.color}</span>
                                            {item.color_code && (
                                                <span className="text-[10px] bg-slate-800/80 px-2 py-1 rounded-lg text-slate-400 font-mono w-fit border border-white/5">{item.color_code}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 align-top text-right">
                                        <div className={`text-2xl font-black ${Number(item.quantity) < 100 ? 'text-rose-500' : 'text-indigo-400'}`}>{item.quantity}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{item.unit}</div>
                                    </td>
                                    <td className="px-8 py-6 align-top text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setInboundData({
                                                        reference_id: item.reference_id,
                                                        color: item.color,
                                                        color_code: item.color_code,
                                                        batch_number: item.batch_number,
                                                        quantity: '',
                                                        reason: 'Qaytim',
                                                        rolls: []
                                                    });
                                                    setShowInboundModal(true);
                                                }}
                                                className="p-3 bg-slate-800/50 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all border border-white/5 hover:border-amber-500 shadow-lg hover:shadow-amber-500/20"
                                                title="Qaytim qilish (Qo'shish)"
                                            >
                                                <History size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setOutboundData({
                                                        inventory_id: item.id,
                                                        quantity: '',
                                                        order_id: '',
                                                        reason: 'Kesimga'
                                                    });
                                                    setShowOutboundModal(true);
                                                }}
                                                className="p-3 bg-slate-800/50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-white/5 hover:border-rose-500 shadow-lg hover:shadow-rose-500/20"
                                                title="Chiqim qilish"
                                            >
                                                <ArrowUpRight size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredInventory.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 border-t border-white/5">
                        <Warehouse size={48} className="mb-4 opacity-20" />
                        <span className="font-bold uppercase tracking-widest text-xs">Ma'lumot topilmadi</span>
                    </div>
                )}
            </div>

            {/* INBOUND MODAL */}
            {showInboundModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#0f172a] border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl shadow-indigo-900/40 animate-in zoom-in-95 duration-300 relative custom-scrollbar">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0f172a]/95 backdrop-blur-md z-10 rounded-t-[3rem]">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30"><ArrowDownCircle size={24} /></div>
                                    <span className="bg-gradient-to-r from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent">Yangi Mato Kirimi</span>
                                </h3>
                                <p className="text-[11px] text-indigo-300/60 font-black uppercase tracking-widest mt-2 ml-[3.25rem]">Omborga yangi mato qabul qilish</p>
                            </div>
                            <button onClick={() => setShowInboundModal(false)} className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition-all border border-white/5"><Trash2 className="rotate-45" size={20} /></button>
                        </div>

                        <form onSubmit={handleKirim} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Mato Nomi</label>
                                    <select
                                        required
                                        className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 focus:bg-[#020617] transition-all font-bold appearance-none cursor-pointer placeholder-slate-500 shadow-inner"
                                        value={inboundData.selected_material_name}
                                        onChange={e => setInboundData({ ...inboundData, selected_material_name: e.target.value, reference_id: '' })}
                                    >
                                        <option value="" className="bg-slate-900 text-slate-500">Tanlang...</option>
                                        {[...new Set(references.filter(r => r.type === 'Mato').map(r => r.name))].map(n => (
                                            <option key={n} value={n} className="bg-slate-900 text-white">{n}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Turi va Grammaj</label>
                                    <select
                                        required
                                        disabled={!inboundData.selected_material_name}
                                        className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all font-bold appearance-none cursor-pointer disabled:opacity-50 placeholder-gray-500 shadow-inner"
                                        value={inboundData.reference_id}
                                        onChange={e => setInboundData({ ...inboundData, reference_id: e.target.value })}
                                    >
                                        <option value="" className="bg-[#161b22]">Tanlang...</option>
                                        {references
                                            .filter(r => r.name === inboundData.selected_material_name)
                                            .map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.thread_type} - {r.grammage}gr</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Rangi</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Mato rangi..."
                                        className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 focus:bg-[#020617] transition-all font-bold uppercase placeholder-slate-600 shadow-inner"
                                        value={inboundData.color}
                                        onChange={e => setInboundData({ ...inboundData, color: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Partiya №</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Partiya raqami"
                                        className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 focus:bg-[#020617] transition-all font-black uppercase text-lg placeholder-slate-600 shadow-inner"
                                        value={inboundData.batch_number}
                                        onChange={e => setInboundData({ ...inboundData, batch_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Rang Kodi (ID)</label>
                                    <input
                                        type="text"
                                        placeholder="Rang kodi (ixtiyoriy)"
                                        className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 focus:bg-[#020617] transition-all font-bold uppercase placeholder-slate-600 shadow-inner"
                                        value={inboundData.color_code}
                                        onChange={e => setInboundData({ ...inboundData, color_code: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Rolls */}
                            <div className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-black uppercase text-xs text-indigo-400 tracking-widest flex items-center gap-2"><ScrollText size={16} /> Poylar (O'ramlar)</h4>
                                    <button type="button" onClick={() => setInboundData({ ...inboundData, rolls: [...inboundData.rolls, { weight: '' }] })} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-indigo-600/20 hover:bg-indigo-500">+ Poy Qo'shish</button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {inboundData.rolls.map((r, i) => (
                                        <div key={i} className="relative group animate-in zoom-in-50 duration-300">
                                            <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-sm group-hover:bg-indigo-500/10 transition-all"></div>
                                            <input
                                                type="number"
                                                className="relative w-full py-4 text-center font-black bg-[#020617] border border-white/10 rounded-2xl focus:border-indigo-500 outline-none text-white text-lg transition-all shadow-inner group-hover:border-indigo-500/30"
                                                placeholder="kg"
                                                value={r.weight}
                                                onChange={e => {
                                                    const newRolls = [...inboundData.rolls];
                                                    newRolls[i].weight = e.target.value;
                                                    const total = newRolls.reduce((s, r) => s + (Number(r.weight) || 0), 0);
                                                    setInboundData({ ...inboundData, rolls: newRolls, quantity: total.toFixed(2) });
                                                }}
                                            />
                                            <button type="button" onClick={() => {
                                                const newRolls = inboundData.rolls.filter((_, idx) => idx !== i);
                                                const total = newRolls.reduce((s, r) => s + (Number(r.weight) || 0), 0);
                                                setInboundData({ ...inboundData, rolls: newRolls, quantity: total.toFixed(2) });
                                            }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-[10px] font-black border-4 border-[#0F172A] hover:scale-110 transition-transform shadow-lg z-10 hover:bg-rose-600">×</button>
                                        </div>
                                    ))}
                                    {inboundData.rolls.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">
                                            Hozircha poylar yo'q
                                        </div>
                                    )}
                                </div>
                                <div className="mt-8 flex items-end justify-end gap-3 border-t border-white/5 pt-6">
                                    <span className="text-xs font-black uppercase text-slate-500 tracking-widest mb-1">Jami Og'irlik:</span>
                                    <span className="text-4xl font-black text-white leading-none tracking-tight">{inboundData.quantity || 0} <span className="text-lg text-slate-600">kg</span></span>
                                </div>
                            </div>

                            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30 text-xs active:scale-95">Kirimni Saqlash</button>
                        </form>
                    </div>
                </div>
            )}

            {/* OUTBOUND MODAL */}
            {showOutboundModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#0f172a] border border-white/10 w-full max-w-lg rounded-[3rem] p-10 space-y-8 shadow-2xl shadow-rose-900/20 animate-in zoom-in-95 duration-300 relative">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                            <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/30">
                                <ArrowUpRight size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Ombordan Chiqim</h3>
                                <p className="text-[11px] text-rose-300/60 font-black uppercase tracking-widest mt-1">Matoni ishlab chiqarishga berish</p>
                            </div>
                        </div>

                        <form onSubmit={handleChiqim} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Qaysi Buyurtma Uchun? (Optional)</label>
                                <select
                                    className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-rose-500 focus:bg-[#020617] transition-all font-bold appearance-none cursor-pointer shadow-inner"
                                    value={outboundData.order_id}
                                    onChange={e => setOutboundData({ ...outboundData, order_id: e.target.value })}
                                >
                                    <option value="" className="bg-slate-900 text-slate-400">Tanlanmagan (Umumiy chiqim)</option>
                                    {orders.map(o => (
                                        <option key={o.id} value={o.id} className="bg-slate-900">Order #{o.order_number} - {o.models?.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Chiqim Miqdori</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-rose-500 focus:bg-[#020617] transition-all font-black text-2xl placeholder-slate-600 shadow-inner"
                                    value={outboundData.quantity}
                                    onChange={e => setOutboundData({ ...outboundData, quantity: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Sabab / Qayerga</label>
                                <textarea
                                    className="w-full bg-[#020617] border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-rose-500 focus:bg-[#020617] transition-all font-bold placeholder-slate-600 shadow-inner resize-none h-24"
                                    value={outboundData.reason}
                                    onChange={e => setOutboundData({ ...outboundData, reason: e.target.value })}
                                    placeholder="Masalan: Kesim bo'limiga"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowOutboundModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all">Bekor qilish</button>
                                <button className="flex-[2] py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-600/30 transition-all active:scale-95">Chiqimni Tasdiqlash</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatoOmbori;
