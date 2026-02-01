import React, { useState } from 'react';
import {
    CheckCircle2, Search, Truck, ShoppingCart, Tag, Plus, ArrowDownCircle, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TayyorMahsulotOmbori = ({ inventory, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [showKirimModal, setShowKirimModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Filter
    const filteredInventory = inventory.filter(item => {
        const query = searchTerm.toLowerCase();
        return (
            !searchTerm ||
            item.item_name?.toLowerCase().includes(query) ||
            item.color?.toLowerCase().includes(query) ||
            item.color_code?.toLowerCase().includes(query) ||
            item.batch_number?.toLowerCase().includes(query)
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
            window.location.reload();
            setShowSaleModal(false);
            setSaleData({ inventory_id: '', quantity: '', client_name: '', price: '', notes: '' });
            onRefresh();
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

            console.log("Tayyor mahsulot saqlandi. ID:", inventoryId);
            alert(`Mahsulot muvaffaqiyatli kirim qilindi! Baza ID: ${inventoryId}`);
            window.location.reload();
            setShowKirimModal(false);
            setKirimData({ item_name: '', color: '', color_code: '', quantity: '', unit: 'dona', reason: 'Yangi Kirim' });
            onRefresh();
        } catch (error) {
            alert('Xatolik: ' + error.message);
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
                        placeholder="Model, rang yoki artikul..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 outline-none font-medium transition-all"
                    />
                </div>
                <button
                    onClick={() => setShowKirimModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                >
                    <Plus size={18} /> Yangi Kirim
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredInventory.map(item => (
                    <div key={item.id} className="bg-white p-0 rounded-[2.5rem] overflow-hidden border border-emerald-50 hover:shadow-2xl transition-all group relative">
                        <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-600 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            ID: {item.id}
                        </div>
                        <div className="bg-emerald-500/5 p-8 border-b border-emerald-50 flex flex-col gap-4">
                            <div>
                                <h3 className="text-2xl font-black text-emerald-900 uppercase tracking-tight leading-none">{item.item_name}</h3>
                                <p className="text-xs font-bold text-emerald-500 uppercase mt-2 bg-emerald-100/50 w-fit px-2 py-1 rounded-lg">Artikul: {item.color_code || '---'}</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rangi</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: item.color === 'Oq' ? '#fff' : item.color === 'Qora' ? '#000' : 'transparent' }}></div>
                                        <p className="text-sm font-bold text-gray-700 uppercase">{item.color}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Yoshi / O'lcham</p>
                                    <div className="flex items-center gap-2">
                                        <Tag size={14} className="text-emerald-400" />
                                        <p className="text-sm font-bold text-gray-700 uppercase">{item.unit === 'dona' ? 'Standard' : item.unit}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Mavjud Qoldiq</p>
                                    <h4 className="text-3xl font-black text-gray-800 flex items-baseline gap-2">
                                        {item.quantity}
                                        <span className="text-xs font-black text-gray-400">dona</span>
                                    </h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Oxirgi Kirim</p>
                                    <p className="text-xs font-bold text-gray-400">{new Date(item.last_updated).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setSaleData({ ...saleData, inventory_id: item.id });
                                    setShowSaleModal(true);
                                }}
                                className="w-full py-4 bg-[#1a1c2e] text-white rounded-2xl font-black uppercase text-xs hover:bg-emerald-600 transition-colors shadow-xl shadow-gray-200 flex items-center justify-center gap-2 tracking-widest"
                            >
                                <ShoppingCart size={16} /> Sotuvga Chiqarish
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* SALE MODAL */}
            {showSaleModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 bg-emerald-50">
                            <h3 className="text-2xl font-black text-emerald-800 flex items-center gap-3">
                                <Truck size={28} /> Mahsulotni Sotish
                            </h3>
                            <p className="text-xs font-bold text-emerald-600 uppercase mt-1 ml-10">Mijozga yuklab jo'natish</p>
                        </div>
                        <form onSubmit={handleSale} className="p-8 space-y-6">
                            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 mb-4">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Tanlangan Mahsulot</p>
                                <h4 className="text-lg font-black text-emerald-900 uppercase">
                                    {inventory.find(i => i.id === saleData.inventory_id)?.item_name}
                                </h4>
                                <div className="flex gap-4 mt-2 text-xs font-bold text-gray-500 uppercase">
                                    <span>Rang: {inventory.find(i => i.id === saleData.inventory_id)?.color}</span>
                                    <span>Artikul: {inventory.find(i => i.id === saleData.inventory_id)?.color_code || '---'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase block mb-2 text-[#194052]">1. Mijoz Nomi</label>
                                <input
                                    required
                                    className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-emerald-500 outline-none transition-all super-input super-border"
                                    placeholder="Masalan: ABDULLOH SAVDO..."
                                    value={saleData.client_name}
                                    onChange={e => setSaleData({ ...saleData, client_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold uppercase block mb-2 text-[#194052]">2. Miqdor (Dona)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full p-4 bg-gray-50 rounded-2xl font-black text-2xl border-2 border-transparent focus:border-emerald-500 outline-none super-input super-border"
                                        placeholder="0"
                                        value={saleData.quantity}
                                        onChange={e => setSaleData({ ...saleData, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase block mb-2 text-[#194052]">3. Narxi (Opt, $)</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xl border-2 border-transparent focus:border-emerald-500 outline-none super-input super-border"
                                        placeholder="$0.00"
                                        value={saleData.price}
                                        onChange={e => setSaleData({ ...saleData, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase block mb-2 text-[#194052]">4. Qo'shimcha Izoh</label>
                                <textarea
                                    rows="2"
                                    className="w-full p-4 bg-gray-50 rounded-2xl font-medium border-2 border-transparent focus:border-emerald-500 outline-none resize-none super-input super-border"
                                    placeholder="Yuk xati raqami yoki mashina nomeri..."
                                    value={saleData.notes}
                                    onChange={e => setSaleData({ ...saleData, notes: e.target.value })}
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-5 bg-[#1a1c2e] text-white rounded-[2rem] font-black uppercase tracking-widest hover:scale-[1.02] shadow-2xl transition-all flex items-center justify-center gap-3"
                                >
                                    {loading ? 'Bajarilmoqda...' : (
                                        <>
                                            <ShoppingCart size={20} />
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
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-2xl font-black text-emerald-800 flex items-center gap-3">
                                    <ArrowDownCircle size={28} /> Yangi Kirim
                                </h3>
                                <p className="text-xs font-bold text-gray-400 uppercase mt-1">Tayyor mahsulotni omborga olish</p>
                            </div>
                            <button onClick={() => setShowKirimModal(false)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleKirim} className="p-8 space-y-6">
                            <div>
                                <label className="text-xs font-bold uppercase block mb-2 text-[#194052]">Model Nomi</label>
                                <input required className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-emerald-500 outline-none uppercase super-input super-border" value={kirimData.item_name} onChange={e => setKirimData({ ...kirimData, item_name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase block mb-2 text-[#194052]">Rangi</label>
                                    <input required className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-emerald-500 outline-none uppercase super-input super-border" value={kirimData.color} onChange={e => setKirimData({ ...kirimData, color: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase block mb-2 text-[#194052]">Artikul (Code)</label>
                                    <input className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-emerald-500 outline-none uppercase super-input super-border" value={kirimData.color_code} onChange={e => setKirimData({ ...kirimData, color_code: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase block mb-2 text-[#194052]">Miqdor</label>
                                    <input required type="number" className="w-full p-4 bg-gray-50 rounded-2xl font-black text-2xl border-2 border-transparent focus:border-emerald-500 outline-none super-input super-border" value={kirimData.quantity} onChange={e => setKirimData({ ...kirimData, quantity: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase block mb-2 text-[#194052]">O'lchov Birligi</label>
                                    <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-emerald-500 outline-none uppercase super-input super-border" value={kirimData.unit} onChange={e => setKirimData({ ...kirimData, unit: e.target.value })}>
                                        <option value="dona" className="text-[#194052]">Dona</option>
                                        <option value="kg" className="text-[#194052]">Kg</option>
                                        <option value="metr" className="text-[#194052]">Metr</option>
                                        <option value="komplekt" className="text-[#194052]">Komplekt</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button type="submit" disabled={loading} className="w-full py-5 bg-[#1a1c2e] text-white rounded-[2rem] font-black uppercase tracking-widest hover:scale-[1.02] shadow-2xl transition-all">
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
