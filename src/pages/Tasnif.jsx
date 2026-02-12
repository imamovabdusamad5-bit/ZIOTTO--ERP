import React, { useState, useEffect } from 'react';
import {
    Layers,
    ArrowRight,
    Activity,
    Printer,
    Scissors,
    Shirt,
    Search,
    Clock,
    CircleCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Tasnif = () => {
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedBundle, setSelectedBundle] = useState(null);

    useEffect(() => {
        fetchBundles();
    }, []);

    const fetchBundles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('production_bundles')
            .select('*, production_orders(models(name))')
            .eq('current_step', 'Tasnif')
            .eq('status', 'Active');

        if (!error) {
            setBundles(data || []);
        }
        setLoading(false);
    };

    const handleTransfer = async (targetStep) => {
        if (!selectedBundle) return;

        setLoading(true);
        const { error } = await supabase
            .from('production_bundles')
            .update({
                current_step: targetStep,
                status: targetStep === 'Tikuv' ? 'Ready' : 'Pending'
            })
            .eq('id', selectedBundle.id);

        if (!error) {
            // Log the move
            await supabase.from('activity_logs').insert([{
                department: 'Tasnif',
                user_name: 'Tasnif Birinchi', // Should come from Auth
                action: `${selectedBundle.bundle_number} partiyasini ${targetStep}ga yubordi`,
                details: JSON.stringify(selectedBundle)
            }]);

            setShowTransferModal(false);
            fetchBundles();
        } else {
            alert('Xatolik: ' + error.message);
        }
        setLoading(false);
    };

    const filteredBundles = bundles.filter(b =>
        b.bundle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.production_orders?.models?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-600/20 rotate-3 transition-transform hover:rotate-0">
                        <Layers size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Tasnif Bo'limi</h2>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Saralash va sifat nazorati</p>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Partiya qidirish..."
                        className="bg-[#161b22] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:border-blue-500 outline-none w-64 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Matrix View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center"><Clock className="animate-spin mx-auto text-blue-500" /></div>
                ) : filteredBundles.map((batch) => (
                    <div key={batch.id} className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:border-blue-500/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                            <Layers size={80} />
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">Saralashda</span>
                                <h3 className="text-xl font-black text-white mt-3 tracking-tight group-hover:text-blue-400 transition-colors uppercase">
                                    {batch.production_orders?.models?.name || 'Noma\'lum xil'}
                                </h3>
                                <p className="text-xs font-mono font-bold text-gray-500 mt-1"># {batch.bundle_number}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Miqdor</p>
                                <p className="text-lg font-black text-white">{batch.quantity} <span className="text-[10px] text-gray-600">dona</span></p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Rangi & Olcham</p>
                                <p className="text-sm font-black text-blue-500">{batch.color} | {batch.size}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setSelectedBundle(batch);
                                setShowTransferModal(true);
                            }}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-blue-500 active:scale-95 transition-all shadow-xl shadow-blue-600/20"
                        >
                            <ArrowRight size={16} /> Yo'nalish Belglash
                        </button>
                    </div>
                ))}

                {!loading && filteredBundles.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border-2 border-dashed border-white/5">
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Hozircha saralash uchun partiyalar yo'q</p>
                    </div>
                )}
            </div>

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-4xl animate-in zoom-in-95 duration-300 relative">
                        <div className="p-10 border-b border-white/5 flex flex-col items-center">
                            <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center text-blue-500 mb-6">
                                <ArrowRight size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-white text-center tracking-tight mb-2 uppercase">Navbatdagi Bo'limni Tanlang</h3>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{selectedBundle?.bundle_number} partiyasi uchun</p>
                        </div>

                        <div className="p-10 grid grid-cols-1 gap-4">
                            <button
                                onClick={() => handleTransfer('Pechat')}
                                className="flex items-center gap-5 p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-purple-600 hover:border-purple-500 group transition-all text-left"
                            >
                                <div className="p-4 bg-purple-600/20 text-purple-500 rounded-2xl group-hover:bg-white group-hover:text-purple-600 transition-colors">
                                    <Printer size={24} />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-white group-hover:text-white">Pechatga Yuborish</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-purple-200">Naqsh va bosma ishlari uchun</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleTransfer('Vishefka')}
                                className="flex items-center gap-5 p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-pink-600 hover:border-pink-500 group transition-all text-left"
                            >
                                <div className="p-4 bg-pink-600/20 text-pink-500 rounded-2xl group-hover:bg-white group-hover:text-pink-600 transition-colors">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-white group-hover:text-white">Vishefkaga Yuborish</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-pink-200">Kashta va tikma ishlari uchun</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleTransfer('Tikuv')}
                                className="flex items-center gap-5 p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-emerald-600 hover:border-emerald-500 group transition-all text-left"
                            >
                                <div className="p-4 bg-emerald-600/20 text-emerald-500 rounded-2xl group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                                    <Shirt size={24} />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-white group-hover:text-white">Tikuvga To'g'ridan-to'g'ri</p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-emerald-200">Boshqa ishlov talab etilmasa</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setShowTransferModal(false)}
                                className="mt-4 w-full py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Bekor Qilish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasnif;
