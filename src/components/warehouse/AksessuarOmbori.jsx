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
            const ref = references.find(r => r.name === inboundData.selected_material_name);
            // Aksessuarda ref bo'lmasligi mumkin (masalan, yangi nom bo'lsa), 
            // lekin biz strict qilib ref dan olamiz yoki direct name ishlatamiz.
            // Bu yerda simple logic: Reference required emas deb faraz qilamiz yoki mavjud refdan olamiz.

            const unit = ref ? ref.unit : 'dona';
            const refId = ref ? ref.id : null;

            // Check existing
            const { data: existing } = await supabase.from('inventory')
                .select('*')
                .eq('item_name', inboundData.selected_material_name)
                .eq('color', inboundData.color)
                .eq('category', 'Aksessuar')
                .maybeSingle();

            let inventoryId;
            if (existing) {
                await supabase.from('inventory').update({
                    quantity: Number(existing.quantity || 0) + Number(inboundData.quantity),
                    last_updated: new Date()
                }).eq('id', existing.id);
                inventoryId = existing.id;
            } else {
                const { data: created, error } = await supabase.from('inventory').insert([{
                    item_name: inboundData.selected_material_name,
                    category: 'Aksessuar',
                    quantity: Number(inboundData.quantity),
                    unit: unit,
                    color: inboundData.color,
                    color_code: inboundData.color_code,
                    reference_id: refId,
                    last_updated: new Date()
                }]).select().single();
                if (error) throw error;
                inventoryId = created.id;
            }

            await supabase.from('inventory_logs').insert([{
                inventory_id: inventoryId,
                type: 'In',
                quantity: Number(inboundData.quantity),
                reason: inboundData.reason
            }]);

            alert('Aksessuar qabul qilindi!');
            setShowInboundModal(false);
            setInboundData({ selected_material_name: '', color: 'Asosiy', color_code: '', quantity: '', reason: 'Yangi aksessuar' });
            onRefresh();
        } catch (error) {
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

            alert('Chiqim qilindi!');
            setShowOutboundModal(false);
            onRefresh();
        } catch (error) {
            alert('Xato: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#161b22] p-4 rounded-3xl border border-white/5 shadow-2xl">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Aksessuar qidiruv..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 outline-none font-medium transition-all"
                    />
                </div>
                <button
                    onClick={() => setShowInboundModal(true)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-2xl hover:scale-105 transition-all shadow-xl shadow-purple-600/20 font-bold uppercase text-xs tracking-widest"
                >
                    <Plus size={18} /> Yangi Aksessuar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredInventory.map(item => (
                    <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-purple-50 hover:border-purple-200 hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <Package size={24} />
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-purple-600">{item.quantity}</div>
                                <div className="text-[10px] font-black uppercase text-gray-400">{item.unit}</div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-black text-gray-800 uppercase text-lg leading-tight mb-1">{item.item_name}</h4>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-4">{item.color} {item.color_code ? `(${item.color_code})` : ''}</p>

                            <div className="flex gap-2 pt-4 border-t border-gray-100">
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
                                    className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-purple-100 hover:text-purple-600 transition-colors"
                                >
                                    <History size={14} className="mx-auto mb-1" /> Qaytim
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
                                    className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-rose-100 hover:text-rose-600 transition-colors"
                                >
                                    <ArrowUpRight size={14} className="mx-auto mb-1" /> Chiqim
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODALS */}
            {showInboundModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 space-y-4">
                        <h3 className="text-xl font-bold text-purple-600 flex items-center gap-2"><ArrowDownCircle /> Aksessuar Kirim</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-400">Nomi</label>
                                <select
                                    className="w-full p-3 border rounded-xl font-bold"
                                    value={inboundData.selected_material_name}
                                    onChange={(e) => setInboundData({ ...inboundData, selected_material_name: e.target.value })}
                                >
                                    <option value="">Tanlang...</option>
                                    {[...new Set(references.filter(r => r.type === 'Aksessuar').map(r => r.name))].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-400">Rangi</label>
                                    <input className="w-full p-3 border rounded-xl font-bold" value={inboundData.color} onChange={e => setInboundData({ ...inboundData, color: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-400">Miqdor</label>
                                    <input type="number" className="w-full p-3 border rounded-xl font-bold" value={inboundData.quantity} onChange={e => setInboundData({ ...inboundData, quantity: e.target.value })} />
                                </div>
                            </div>
                            <button onClick={handleKirim} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold uppercase">Saqlash</button>
                            <button onClick={() => setShowInboundModal(false)} className="w-full py-3 text-gray-500 font-bold uppercase">Bekor qilish</button>
                        </div>
                    </div>
                </div>
            )}

            {showOutboundModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 space-y-4">
                        <h3 className="text-xl font-bold text-rose-600 flex items-center gap-2"><ArrowUpRight /> Chiqim</h3>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-400">Miqdor</label>
                            <input type="number" className="w-full p-3 border rounded-xl font-bold text-2xl text-rose-600" value={outboundData.quantity} onChange={e => setOutboundData({ ...outboundData, quantity: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-gray-400">Izoh</label>
                            <input className="w-full p-3 border rounded-xl" value={outboundData.reason} onChange={e => setOutboundData({ ...outboundData, reason: e.target.value })} />
                        </div>
                        <button onClick={handleChiqim} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold uppercase">Tasdiqlash</button>
                        <button onClick={() => setShowOutboundModal(false)} className="w-full py-3 text-gray-500 font-bold uppercase">Bekor qilish</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AksessuarOmbori;
