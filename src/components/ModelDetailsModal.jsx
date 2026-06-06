import React, { useState, useEffect } from 'react';
import { X, Save, CircleDollarSign, Scissors, History, Box, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ModelDetailsModal = ({ model, onClose, onRefresh, suggestedSizes = [], suggestedSeasons = [], suggestedComponents = [] }) => {
    const [activeTab, setActiveTab] = useState('kartasi'); // kartasi, xarajatlar, ish_rejasi, xronologiya
    const [saving, setSaving] = useState(false);
    const [draftLoaded, setDraftLoaded] = useState(false);

    // Initial state setup
    const [colors, setColors] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [components, setComponents] = useState([]);

    // Load Draft Data
    useEffect(() => {
        if (!model?.id) return;
        const draftKey = `draft_model_details_${model.id}`;
        const draftStr = localStorage.getItem(draftKey);
        
        if (draftStr) {
            try {
                const parsed = JSON.parse(draftStr);
                setColors(parsed.colors || []);
                setSizes(parsed.sizes || []);
                setSeasons(parsed.seasons || []);
                setComponents(parsed.components || []);
            } catch (e) {
                console.error("Draft parsing error", e);
            }
        } else {
            setColors(model?.colors || []);
            setSizes(model?.sizes || []);
            setSeasons(model?.seasons || []);
            setComponents(model?.components || []);
        }
        setDraftLoaded(true);
    }, [model?.id]);

    // Save Draft Data
    useEffect(() => {
        if (!draftLoaded || !model?.id) return;
        const draftKey = `draft_model_details_${model.id}`;
        const draft = { colors, sizes, seasons, components };
        localStorage.setItem(draftKey, JSON.stringify(draft));
    }, [colors, sizes, seasons, components, draftLoaded, model?.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('models')
                .update({ colors, sizes, seasons, components })
                .eq('id', model.id);
            if (error) throw error;
            // Clear draft after successful save
            localStorage.removeItem(`draft_model_details_${model.id}`);
            
            // Optionally show an unobtrusive toast/notification
            if (onRefresh) onRefresh();
            onClose(); // Auto close on save for better flow
        } catch (error) {
            alert("Xatolik yuz berdi: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    // --- Array Handlers ---
    const addColor = () => setColors([...colors, { name: '', tnved: '' }]);
    const updateColor = (idx, field, value) => {
        const newColors = [...colors];
        newColors[idx][field] = value;
        setColors(newColors);
    };
    const removeColor = (idx) => setColors(colors.filter((_, i) => i !== idx));

    const addStringItem = (setter, state) => setter([...state, '']);
    const updateStringItem = (setter, state, idx, value) => {
        const newState = [...state];
        newState[idx] = value;
        setter(newState);
    };
    const removeStringItem = (setter, state, idx) => setter(state.filter((_, i) => i !== idx));

    return (
        <div className="fixed inset-0 bg-[#1a1d27] z-[100] flex flex-col h-screen w-screen overflow-hidden">
            <div className="w-full h-full flex flex-col overflow-hidden relative">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#14161f] sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-colors text-white/70">
                            <X size={20} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-wide uppercase">{model?.name || 'Yangi Model'}</h2>
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Artikul: {model?.code || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50">
                            <Save size={18} />
                            {saving ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 py-4 bg-[#14161f] border-b border-white/5 flex flex-wrap gap-3 z-10 relative shadow-md">
                    {[
                        { id: 'kartasi', label: 'Model Kartasi', icon: Box, activeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20 scale-[1.02]' },
                        { id: 'xarajatlar', label: 'Xarajatlar Varaqasi', icon: CircleDollarSign, activeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20 scale-[1.02]' },
                        { id: 'ish_rejasi', label: 'Ish Rejasi (Jadval)', icon: Scissors, activeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/20 scale-[1.02]' },
                        { id: 'xronologiya', label: 'Xronologiya', icon: History, activeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/20 scale-[1.02]' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-6 py-3 text-xs uppercase tracking-widest font-black rounded-2xl transition-all duration-300 border ${
                                activeTab === tab.id
                                    ? tab.activeClass
                                    : 'bg-[#0f111a] text-white/40 border-white/5 hover:bg-white/5 hover:text-white/70'
                            }`}
                        >
                            <tab.icon size={16} className={activeTab === tab.id ? 'animate-pulse' : ''} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 p-6 bg-[#0f111a] overflow-y-auto">
                    {activeTab === 'kartasi' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            
                            {/* LEFT COLUMN: Main Info */}
                            <div className="lg:col-span-4 flex flex-col gap-6">
                                <div className="bg-[#1a1d27] rounded-2xl border border-white/5 p-5 flex flex-col gap-5">
                                    <h3 className="text-white/80 font-black text-xs uppercase tracking-widest border-b border-white/5 pb-3">Model Haqida Ma'lumot</h3>
                                    
                                    <div className="h-64 w-full p-4 rounded-xl bg-[#0f111a] border border-white/5 overflow-hidden flex items-center justify-center relative group">
                                        {model?.image_url ? (
                                            <img src={model.image_url} alt="Model" className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-white/20">
                                                <Box size={32} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Rasm Yo'q</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-md">Kattalashtirish</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1">
                                        <p className="text-lg font-bold text-white">{model?.name}</p>
                                        <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Yaratilgan: {new Date(model?.created_at).toLocaleDateString()}</p>
                                    </div>
                                    
                                    <button className="py-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-indigo-500/20 active:scale-95">
                                        Ishlab Chiqarishga Tasdiqlash
                                    </button>
                                    <button className="py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/20 active:scale-95">
                                        Shablonlardan O'chirish
                                    </button>
                                    
                                    <div className="mt-2">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Izoh (Eslatmalar)</label>
                                        <textarea 
                                            readOnly 
                                            value={model?.notes?.map(n => n.text).join('\\n') || 'Izoh yo\'q'} 
                                            className="w-full bg-[#0f111a] border border-white/5 rounded-xl p-4 text-xs text-white/60 min-h-[100px] resize-none focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* MIDDLE COLUMN: Colors */}
                            <div className="lg:col-span-4 flex flex-col gap-6">
                                <div className="bg-[#1a1d27] rounded-2xl border border-white/5 p-5 flex flex-col gap-5 h-full">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                        <h3 className="text-white/80 font-black text-xs uppercase tracking-widest">Ranglar Palitrasi</h3>
                                        <button onClick={addColor} className="flex items-center gap-1 text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors bg-blue-500/10 px-2 py-1 rounded-md">
                                            <Plus size={12} /> Qo'shish
                                        </button>
                                    </div>
                                    
                                    <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
                                        {colors.length === 0 ? (
                                            <div className="text-center py-10 text-white/20 text-xs font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-xl">Ranglar Kiritilmagan</div>
                                        ) : (
                                            colors.map((c, i) => (
                                                <div key={i} className="bg-[#0f111a] border border-white/5 rounded-xl p-4 flex flex-col gap-3 relative group transition-all hover:border-white/10">
                                                    <button onClick={() => removeColor(i)} className="absolute top-3 right-3 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0" style={{backgroundColor: c.name || '#333'}}></div>
                                                        <div className="flex-1">
                                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">Rang Nomi</label>
                                                            <input 
                                                                type="text" 
                                                                value={c.name} 
                                                                onChange={e => updateColor(i, 'name', e.target.value)} 
                                                                placeholder="Masalan: Qora, Oq, Qormelanj"
                                                                className="w-full bg-transparent border-none text-sm font-bold text-white placeholder-white/20 focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="border-t border-white/5 pt-3 mt-1">
                                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">TNVED Kodi</label>
                                                        <input 
                                                            type="text" 
                                                            value={c.tnved} 
                                                            onChange={e => updateColor(i, 'tnved', e.target.value)} 
                                                            placeholder="TNVED (Ixtiyoriy)"
                                                            className="w-full bg-[#1a1d27] border border-white/5 rounded-lg px-3 py-2 text-xs font-semibold text-white/80 placeholder-white/20 focus:outline-none focus:border-blue-500/30 transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Attributes (Sizes, Seasons, Components) */}
                            <div className="lg:col-span-4 flex flex-col gap-6">
                                <div className="bg-[#1a1d27] rounded-2xl border border-white/5 p-5 flex flex-col gap-6 h-full">
                                    
                                    {/* SIZES */}
                                    <div className="flex-1 bg-[#0f111a]/50 p-4 rounded-xl border border-white/5 flex flex-col">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                                            <h3 className="text-white/80 font-black text-xs uppercase tracking-widest">1. Razmer</h3>
                                            <button onClick={() => addStringItem(setSizes, sizes)} className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                                                <Plus size={12} /> Qo'shish
                                            </button>
                                        </div>
                                        <datalist id="size-suggestions">
                                            {suggestedSizes.map((s, idx) => <option key={idx} value={s} />)}
                                        </datalist>
                                        <div className="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar pr-1 max-h-[120px]">
                                            {sizes.length === 0 && <span className="text-[10px] text-white/20 font-bold tracking-widest uppercase">Kiritilmagan</span>}
                                            {sizes.map((s, i) => (
                                                <div key={i} className="flex items-center bg-[#1a1d27] border border-white/10 rounded-lg overflow-hidden group">
                                                    <input 
                                                        type="text" 
                                                        list="size-suggestions"
                                                        value={s} 
                                                        onChange={e => updateStringItem(setSizes, sizes, i, e.target.value)} 
                                                        placeholder="Tanlash / Yozish"
                                                        className="bg-transparent text-xs font-bold text-white px-3 py-2 w-32 focus:outline-none focus:bg-white/5 transition-colors"
                                                    />
                                                    <button onClick={() => removeStringItem(setSizes, sizes, i)} className="px-2 py-2 text-white/20 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* COMPONENTS */}
                                    <div className="flex-1 bg-[#0f111a]/50 p-4 rounded-xl border border-white/5 flex flex-col">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                                            <h3 className="text-white/80 font-black text-xs uppercase tracking-widest">2. Komplektatsiya</h3>
                                            <button onClick={() => addStringItem(setComponents, components)} className="text-[10px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest bg-purple-500/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                                                <Plus size={12} /> Qo'shish
                                            </button>
                                        </div>
                                        <datalist id="component-suggestions">
                                            {suggestedComponents.map((c, idx) => <option key={idx} value={c} />)}
                                        </datalist>
                                        <div className="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar pr-1 max-h-[120px]">
                                            {components.length === 0 && <span className="text-[10px] text-white/20 font-bold tracking-widest uppercase">Kiritilmagan</span>}
                                            {components.map((c, i) => (
                                                <div key={i} className="flex items-center bg-[#1a1d27] border border-white/10 rounded-lg overflow-hidden group">
                                                    <input 
                                                        type="text" 
                                                        list="component-suggestions"
                                                        value={c} 
                                                        onChange={e => updateStringItem(setComponents, components, i, e.target.value)} 
                                                        placeholder="Tanlash / Yozish"
                                                        className="bg-transparent text-xs font-bold text-white px-3 py-2 w-32 focus:outline-none focus:bg-white/5 transition-colors"
                                                    />
                                                    <button onClick={() => removeStringItem(setComponents, components, i)} className="px-2 py-2 text-white/20 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SEASONS */}
                                    <div className="flex-1 bg-[#0f111a]/50 p-4 rounded-xl border border-white/5 flex flex-col">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                                            <h3 className="text-white/80 font-black text-xs uppercase tracking-widest">3. Mavsum</h3>
                                            <button onClick={() => addStringItem(setSeasons, seasons)} className="text-[10px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                                                <Plus size={12} /> Qo'shish
                                            </button>
                                        </div>
                                        <datalist id="season-suggestions">
                                            {suggestedSeasons.map((s, idx) => <option key={idx} value={s} />)}
                                        </datalist>
                                        <div className="flex flex-wrap gap-2 overflow-y-auto custom-scrollbar pr-1 max-h-[120px]">
                                            {seasons.length === 0 && <span className="text-[10px] text-white/20 font-bold tracking-widest uppercase">Kiritilmagan</span>}
                                            {seasons.map((s, i) => (
                                                <div key={i} className="flex items-center bg-[#1a1d27] border border-white/10 rounded-lg overflow-hidden group">
                                                    <input 
                                                        type="text" 
                                                        list="season-suggestions"
                                                        value={s} 
                                                        onChange={e => updateStringItem(setSeasons, seasons, i, e.target.value)} 
                                                        placeholder="Tanlash / Yozish"
                                                        className="bg-transparent text-xs font-bold text-white px-3 py-2 w-32 focus:outline-none focus:bg-white/5 transition-colors"
                                                    />
                                                    <button onClick={() => removeStringItem(setSeasons, seasons, i)} className="px-2 py-2 text-white/20 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'xarajatlar' && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-20 border border-dashed border-white/5 rounded-2xl bg-[#1a1d27]/50">
                            <CircleDollarSign size={48} className="text-white/10 mb-4" />
                            <h3 className="text-lg font-black text-white/60 tracking-wider uppercase mb-2">Xarajatlar Varaqasi (BOM)</h3>
                            <p className="text-sm text-white/40 max-w-md">Tez orada ushbu bo'limda mato va detallar sarfi, shuningdek boshqa xarajatlarni hisoblash imkoniyati yaratiladi.</p>
                        </div>
                    )}

                    {activeTab === 'ish_rejasi' && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-20 border border-dashed border-white/5 rounded-2xl bg-[#1a1d27]/50">
                            <Scissors size={48} className="text-white/10 mb-4" />
                            <h3 className="text-lg font-black text-white/60 tracking-wider uppercase mb-2">Ish Rejasi va Operatsiyalar</h3>
                            <p className="text-sm text-white/40 max-w-md">Tikuv va bichuv operatsiyalari ketma-ketligi, SMV vaqtlarini saqlash oynasi.</p>
                        </div>
                    )}

                    {activeTab === 'xronologiya' && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-20 border border-dashed border-white/5 rounded-2xl bg-[#1a1d27]/50">
                            <History size={48} className="text-white/10 mb-4" />
                            <h3 className="text-lg font-black text-white/60 tracking-wider uppercase mb-2">Ish Xronologiyasi</h3>
                            <p className="text-sm text-white/40 max-w-md">Ushbu model bilan bog'liq barcha harakatlar (yaratish, o'zgartirish, tasdiqlash) tarixi shu yerda ko'rinadi.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ModelDetailsModal;
