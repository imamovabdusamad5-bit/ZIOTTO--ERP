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
            const ref = references.find(r => r.id === inboundData.reference_id);
            if (!ref) return;

            // 1. Check existing
            const { data: existing } = await supabase
                .from('inventory')
                .select('*')
                .eq('item_name', ref.name)
                .eq('color', inboundData.color)
                .eq('category', 'Mato')
                .eq('batch_number', inboundData.batch_number)
                .maybeSingle();

            let inventoryId;

            if (existing) {
                const newQty = Number(existing.quantity || 0) + Number(inboundData.quantity);
                await supabase.from('inventory').update({
                    quantity: newQty,
                    last_updated: new Date(),
                    color_code: inboundData.color_code || existing.color_code
                }).eq('id', existing.id);
                inventoryId = existing.id;
            } else {
                const { data: created, error } = await supabase
                    .from('inventory')
                    .insert([{
                        item_name: ref.name,
                        category: 'Mato',
                        quantity: Number(inboundData.quantity),
                        unit: ref.unit,
                        color: inboundData.color,
                        color_code: inboundData.color_code,
                        batch_number: inboundData.batch_number,
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
                batch_number: inboundData.batch_number,
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

            alert('Mato muvaffaqiyatli qabul qilindi!');
            setShowInboundModal(false);
            setInboundData({ reference_id: '', color: '', color_code: '', batch_number: '', quantity: '', reason: 'Yangi kirim', rolls: [] });
            onRefresh();
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
            setShowOutboundModal(false);
            onRefresh();
        } catch (error) {
            alert('Xatolik: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Search / Add */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#161b22] p-4 rounded-3xl border border-white/5 shadow-2xl">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Mato, rang yoki partiya bo'yicha qidiruv..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none font-medium transition-all"
                    />
                </div>
                <button
                    onClick={() => setShowInboundModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl hover:scale-105 transition-all shadow-xl shadow-indigo-600/20 font-bold uppercase text-xs tracking-widest"
                >
                    <Plus size={18} /> Yangi Mato Kirimi
                </button>
            </div>

            {/* Content Table */}
            <div className="overflow-x-auto bg-[#1a1c2e]/50 rounded-[2.5rem] border border-white/5">
                <table className="w-full text-left">
                    <thead className="bg-[#1a1c2e] text-gray-400 uppercase tracking-widest text-[10px]">
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
                            <tr key={item.id} className="hover:bg-white/5 transition-all group">
                                <td className="px-8 py-6 align-top">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                                            <Warehouse size={24} />
                                        </div>
                                        <div>
                                            <div className="text-white font-black text-lg uppercase tracking-tight">{item.item_name}</div>
                                            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Partiya: {item.batch_number || '---'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 align-top text-gray-300 font-medium text-sm">
                                    {item.material_types?.thread_type || '---'}
                                    <br />
                                    <span className="text-xs text-gray-500">{item.material_types?.grammage ? `${item.material_types.grammage} gr` : ''}</span>
                                </td>
                                <td className="px-8 py-6 align-top">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-white font-bold uppercase text-sm">{item.color}</span>
                                        {item.color_code && (
                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 font-mono w-fit">{item.color_code}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-6 align-top text-right">
                                    <div className="text-2xl font-black text-indigo-400">{item.quantity}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{item.unit}</div>
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
                                            className="p-3 bg-white/5 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all"
                                            title="Qaytim qilish (Qo'shish)"
                                        >
                                            <History size={16} />
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
                                            className="p-3 bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                                            title="Chiqim qilish"
                                        >
                                            <ArrowUpRight size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredInventory.length === 0 && (
                    <div className="p-10 text-center text-gray-500">
                        Ma'lumot topilmadi
                    </div>
                )}
            </div>

            {/* INBOUND MODAL */}
            {showInboundModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ArrowDownCircle className="text-indigo-600" /> Yangi Mato Kirimi
                            </h3>
                            <button onClick={() => setShowInboundModal(false)}><ArrowDownCircle className="rotate-45" /></button>
                        </div>
                        <form onSubmit={handleKirim} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Mato Nomi</label>
                                    <select
                                        required
                                        className="w-full text-lg font-bold p-3 border rounded-xl"
                                        value={inboundData.selected_material_name}
                                        onChange={e => setInboundData({ ...inboundData, selected_material_name: e.target.value, reference_id: '' })}
                                    >
                                        <option value="">Tanlang...</option>
                                        {[...new Set(references.filter(r => r.type === 'Mato').map(r => r.name))].map(n => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Turi va Grammaj</label>
                                    <select
                                        required
                                        disabled={!inboundData.selected_material_name}
                                        className="w-full text-lg font-bold p-3 border rounded-xl"
                                        value={inboundData.reference_id}
                                        onChange={e => setInboundData({ ...inboundData, reference_id: e.target.value })}
                                    >
                                        <option value="">Tanlang...</option>
                                        {references
                                            .filter(r => r.name === inboundData.selected_material_name)
                                            .map(r => <option key={r.id} value={r.id}>{r.thread_type} - {r.grammage}gr</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Rangi</label>
                                    <input required type="text" className="w-full text-lg font-bold p-3 border rounded-xl uppercase" value={inboundData.color} onChange={e => setInboundData({ ...inboundData, color: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Partiya №</label>
                                    <input required type="text" className="w-full text-lg font-bold p-3 border rounded-xl uppercase" value={inboundData.batch_number} onChange={e => setInboundData({ ...inboundData, batch_number: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Rang Kodi (ID)</label>
                                    <input type="text" className="w-full text-lg font-bold p-3 border rounded-xl uppercase" value={inboundData.color_code} onChange={e => setInboundData({ ...inboundData, color_code: e.target.value })} />
                                </div>
                            </div>

                            {/* Rolls */}
                            <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold uppercase text-xs text-gray-500">Poylar (O'ramlar)</h4>
                                    <button type="button" onClick={() => setInboundData({ ...inboundData, rolls: [...inboundData.rolls, { weight: '' }] })} className="text-indigo-600 font-bold text-xs uppercase">+ Poy Qo'shish</button>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {inboundData.rolls.map((r, i) => (
                                        <div key={i} className="relative">
                                            <input
                                                type="number"
                                                className="w-full py-2 text-center font-bold border rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                                            }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">x</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 text-right">
                                    <span className="text-xs font-bold uppercase text-gray-400 mr-2">Jami Miqdor:</span>
                                    <span className="text-3xl font-black text-indigo-600">{inboundData.quantity || 0} <span className="text-sm">kg</span></span>
                                </div>
                            </div>

                            <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase hover:bg-indigo-700 transition">Kirimni Saqlash</button>
                        </form>
                    </div>
                </div>
            )}

            {/* OUTBOUND MODAL */}
            {showOutboundModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg">
                        <div className="p-6 border-b flex justify-between items-center bg-rose-50 rounded-t-[2rem]">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-rose-600">
                                <ArrowUpRight /> Ombordan Chiqim
                            </h3>
                            <button onClick={() => setShowOutboundModal(false)} className="text-rose-400 font-bold text-2xl">×</button>
                        </div>
                        <form onSubmit={handleChiqim} className="p-8 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Qaysi Buyurtma Uchun? (Optional)</label>
                                <select
                                    className="w-full p-3 border rounded-xl font-bold text-gray-700"
                                    value={outboundData.order_id}
                                    onChange={e => setOutboundData({ ...outboundData, order_id: e.target.value })}
                                >
                                    <option value="">Tanlanmagan (Umumiy chiqim)</option>
                                    {orders.map(o => (
                                        <option key={o.id} value={o.id}>Order #{o.order_number} - {o.models?.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Chiqim Miqdori</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full p-4 border-2 border-rose-100 rounded-xl font-black text-3xl text-rose-600 focus:border-rose-500 outline-none"
                                    value={outboundData.quantity}
                                    onChange={e => setOutboundData({ ...outboundData, quantity: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Sabab / Qayerga</label>
                                <textarea
                                    className="w-full p-3 border rounded-xl"
                                    value={outboundData.reason}
                                    onChange={e => setOutboundData({ ...outboundData, reason: e.target.value })}
                                />
                            </div>

                            <button className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold uppercase hover:bg-rose-700 transition">Chiqimni Tasdiqlash</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatoOmbori;
