import React, { useState, useEffect } from 'react';
import { Plus, Save, FileText, Trash2, Layers, Scissors, Ruler, Activity, ChevronRight, ChevronDown, Shirt, X, Calculator, RefreshCw, CircleAlert, Pencil, Search, Image, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ImageCropper from '../components/ImageCropper';

const Modelxona = () => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [expandedModel, setExpandedModel] = useState(null);
    const [references, setReferences] = useState([]);

    const ALLOWED_UNITS = ['kg', 'metr', 'dona', 'pachka'];

    // Form State
    const [editingId, setEditingId] = useState(null); // ID of the model being edited
    const [modelInfo, setModelInfo] = useState({ name: '', code: '', age_group: '', category: '', image_url: '', notes: [] });
    const [uploading, setUploading] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [bomItems, setBomItems] = useState([
        { part_name: 'Futbolka', material_type_id: '', item_name: '', thread_type: '', grammage: '', size_range: '', consumption: '', unit: 'kg' }
    ]);

    // --- PERSISTENCE & CALCULATOR STATES ---
    const [draftLoaded, setDraftLoaded] = useState(false);
    const [calcState, setCalcState] = useState({ open: false, rowIndex: null, grammage: 0, itemName: '' });
    const [calcValues, setCalcValues] = useState({ count: '', length: '' });

    // Auto-save Draft
    useEffect(() => {
        if (showForm && !draftLoaded) {
            const timer = setTimeout(() => {
                const draftData = { modelInfo, bomItems, timestamp: Date.now() };
                localStorage.setItem('ziyo_model_draft', JSON.stringify(draftData));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [modelInfo, bomItems, showForm, draftLoaded]);

    // Restore Draft
    useEffect(() => {
        const checkDraft = () => {
            const saved = localStorage.getItem('ziyo_model_draft');
            if (saved) {
                if (window.confirm("Ziyo: Sizda tugallanmagan model (qoralama) bor. Davom etamizmi?")) {
                    try {
                        const { modelInfo: m, bomItems: b } = JSON.parse(saved);
                        setModelInfo(m);
                        setBomItems(b);
                        setShowForm(true);
                        setDraftLoaded(true);
                        setTimeout(() => setDraftLoaded(false), 2000);
                    } catch (e) {
                        console.error("Draft error", e);
                    }
                } else {
                    localStorage.removeItem('ziyo_model_draft');
                }
            }
        };
        setTimeout(checkDraft, 800);
    }, []);
    // ---------------------------------------

    useEffect(() => {
        fetchModels();
        fetchReferences();
    }, []);

    const fetchReferences = async () => {
        const { data, error } = await supabase.from('material_types').select('*').order('name');
        if (!error) setReferences(data || []);
    };

    const fetchModels = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('models')
                .select(`
                    *,
                    bom_items (*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setModels(data || []);
        } catch (error) {
            console.error('Error fetching models:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const addBomRow = () => {
        setBomItems([...bomItems, { part_name: '', material_type_id: '', item_name: '', thread_type: '', grammage: '', size_range: '', consumption: '', unit: 'kg' }]);
    };

    const removeBomRow = (index) => {
        setBomItems(bomItems.filter((_, i) => i !== index));
    };

    const updateBomItem = (index, field, value) => {
        const updated = [...bomItems];
        updated[index][field] = value;
        setBomItems(updated);
    };

    // --- CALCULATOR FUNCTIONS ---
    const openCalculator = (index, grammage, itemName) => {
        // Allow opening even if grammage is missing (User can enter it manually)
        setCalcState({
            open: true,
            rowIndex: index,
            grammage: parseFloat(grammage) || 0, // Default to 0 if missing 
            itemName
        });
        setCalcValues({ count: '', length: '' });
    };

    const applyCalculation = () => {
        const count = parseFloat(calcValues.count) || 0;
        const lengthCm = parseFloat(calcValues.length) || 0;
        const gramPerMeter = calcState.grammage; // Now interpreted as Grams per 1 Meter

        if (!gramPerMeter || gramPerMeter <= 0) {
            alert("Iltimos, 1 metr arqon vaznini kiriting!");
            return;
        }

        // Formula: (Soni * (Uzunlik_SM / 100) * (Gr_Per_Metr / 1000)) * 1.08
        // 1. Convert CM to Meter: lengthCm / 100
        // 2. Convert Gr to KG: gramPerMeter / 1000

        const totalMeters = count * (lengthCm / 100);
        const weightKg = (totalMeters * (gramPerMeter / 1000)) * 1.08;

        updateBomItem(calcState.rowIndex, 'consumption', weightKg.toFixed(4));
        updateBomItem(calcState.rowIndex, 'grammage', gramPerMeter);

        setCalcState({ ...calcState, open: false });
    };
    // ----------------------------

    const [saving, setSaving] = useState(false);

    const handleSaveModel = async (e) => {
        e.preventDefault();

        // Validation
        for (const item of bomItems) {
            if (!item.material_type_id) {
                alert(`Iltimos, "${item.part_name || 'Hamma'}" qism uchun materialni Tanlang (Kodi bo'lishi shart).`);
                return;
            }
            if (!item.consumption || isNaN(parseFloat(item.consumption))) {
                alert(`Iltimos, "${item.part_name || 'Hamma'}" qism uchun sarf miqdorini (son ko'rinishida) kiriting.`);
                return;
            }
            if (!ALLOWED_UNITS.includes(item.unit)) {
                alert(`Iltimos, "${item.part_name || 'Hamma'}" qism uchun to'g'ri birlikni (kg, metr, dona, pachka) tanlang.`);
                return;
            }
        }

        try {
            setSaving(true);

            let modelId = editingId;

            // Filter out empty notes before saving
            const filteredNotes = (modelInfo.notes || []).filter(n => n.text?.trim() !== '');
            const modelToSave = { ...modelInfo, notes: filteredNotes };

            // 1. Create or Update Model
            if (editingId) {
                const { error: updateError } = await supabase
                    .from('models')
                    .update(modelToSave)
                    .eq('id', editingId);

                if (updateError) throw updateError;

                // Delete old BOM items for clean replacement
                await supabase.from('bom_items').delete().eq('model_id', editingId);
            } else {
                const { data: modelData, error: modelError } = await supabase
                    .from('models')
                    .insert([modelToSave])
                    .select()
                    .single();

                if (modelError) {
                    if (modelError.code === '23505') {
                        throw new Error(`"${modelInfo.code}" artikuli bazada allaqachon bor. Iltimos boshqa artikul kiritib ko'ring yoki mavjudini o'chirib qayta yarating.`);
                    }
                    throw modelError;
                }
                modelId = modelData.id;
            }

            // 2. Create BOM Items (excluding system fields and UI-only fields)
            const itemsToInsert = bomItems.map(({ id, created_at, model_id, selected_type, selected_name, ...item }) => ({
                ...item,
                model_id: modelId,
                size_range: modelInfo.age_group, // Always sync with model's age group
                consumption: parseFloat(item.consumption),
                grammage: item.grammage ? parseFloat(item.grammage) : null
            }));

            const { error: bomError } = await supabase
                .from('bom_items')
                .insert(itemsToInsert);

            if (bomError) {
                if (!editingId) await supabase.from('models').delete().eq('id', modelId);
                throw bomError;
            }

            if (editingId) {
                setShowForm(false);
                setEditingId(null);
                setModelInfo({ name: '', code: '', age_group: '', category: '', image_url: '', notes: [] });
                setBomItems([{ part_name: 'Futbolka', material_type_id: '', item_name: '', thread_type: '', grammage: '', size_range: '', consumption: '', unit: 'kg' }]);
            } else {
                // For new items, keep everything but clear the unique Artikul Code to prevent accidental duplicate submission
                setModelInfo(prev => ({ ...prev, code: '' }));
                localStorage.removeItem('ziyo_model_draft');
                alert('Model muvaffaqiyatli saqlandi! Keyingi variantni kiritishingiz mumkin.');
            }

            fetchModels();
            if (editingId) alert('Model yangilandi!');
        } catch (error) {
            alert('Xatolik: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEditModel = (model) => {
        setEditingId(model.id);
        setModelInfo({
            name: model.name || '',
            code: model.code || '',
            age_group: model.age_group || '',
            category: model.category || '',
            image_url: model.image_url || '',
            notes: model.notes || []
        });
        setBomItems(model.bom_items?.length > 0 ? model.bom_items : [
            { part_name: 'Futbolka', item_name: 'Asosiy mato', thread_type: 'Suprem', grammage: '160', size_range: '2-5 yosh', consumption: '', unit: 'kg' }
        ]);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteModel = async (id) => {
        if (!confirm('Ushbu modelni butunlay o\'chirib tashlamoqchimisiz?')) return;

        try {
            setLoading(true);

            // 1. Check for linked Production Orders
            const { data: linkedOrders, error: checkError } = await supabase
                .from('production_orders')
                .select('id, order_number')
                .eq('model_id', id);

            if (checkError) throw checkError;

            if (linkedOrders?.length > 0) {
                const confirmMessage = `DIQQAT: Ushbu modelga bog'liq ${linkedOrders.length} ta ishlab chiqarish rejasi mavjud (№${linkedOrders.map(o => o.order_number).join(', ')}).\n\nAgar davom etsangiz, ushbu rejalar ham o'chirib yuboriladi!\n\nRozimisiz?`;
                if (!confirm(confirmMessage)) {
                    setLoading(false);
                    return;
                }

                // Delete items of linked orders first
                const orderIds = linkedOrders.map(o => o.id);
                const { error: itemsDelError } = await supabase
                    .from('production_order_items')
                    .delete()
                    .in('order_id', orderIds);

                if (itemsDelError) throw itemsDelError;

                // Delete the orders themselves
                const { error: ordersDelError } = await supabase
                    .from('production_orders')
                    .delete()
                    .eq('model_id', id);

                if (ordersDelError) throw ordersDelError;
            }

            // 2. Delete BOM items
            const { error: bomError } = await supabase
                .from('bom_items')
                .delete()
                .eq('model_id', id);

            if (bomError) throw bomError;

            // 3. Finally Delete Model
            const { error } = await supabase
                .from('models')
                .delete()
                .eq('id', id);

            if (error) throw error;

            fetchModels();
            alert("Model va unga bog'liq barcha ma'lumotlar o'chirildi.");

        } catch (error) {
            alert('O\'chirishda xatolik: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Iltimos, faqat rasm fayllarini yuklang.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setTempImage(reader.result);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedImageUrl) => {
        setShowCropper(false);
        try {
            setUploading(true);
            const response = await fetch(croppedImageUrl);
            const blob = await response.blob();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.jpg`;
            const filePath = `models/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('model-images')
                .upload(filePath, blob, { contentType: 'image/jpeg' });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('model-images')
                .getPublicUrl(filePath);

            setModelInfo({ ...modelInfo, image_url: publicUrl });
            alert('Rasm muvaffaqiyatli qirqildi va yuklandi!');
        } catch (error) {
            alert('Rasm yuklashda xatolik: ' + error.message);
        } finally {
            setUploading(false);
            setTempImage(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Modelxona va BOM</h2>
                    <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] mt-1">Yangi modellar yaratish va mato sarfini hisoblash</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 font-semibold text-sm"
                    >
                        <Plus size={18} />
                        Yangi Model Yaratish
                    </button>
                )}
            </div>

            {/* Model Creation Form */}
            {showForm && (
                <div className="bg-[var(--bg-card)] rounded-[3rem] shadow-2xl border border-[var(--border-color)] overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <div className="px-10 py-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-body)]">
                        <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-widest">
                            {editingId ? 'Modelni Tahrirlash' : 'Yangi Model Ma\'lumotlari'}
                        </h3>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold uppercase tracking-widest text-[10px]">Bekor qilish</button>
                    </div>
                    <form onSubmit={handleSaveModel} className="p-8 space-y-8">
                        {/* Basic Info */}
                        {/* Model Media & Details Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-1 space-y-4">
                                <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Model Rasmi</label>
                                <div
                                    className={`aspect-square bg-[var(--input-bg)] rounded-3xl border-2 border-dashed ${uploading ? 'border-indigo-500/50' : 'border-[var(--border-color)]'} flex flex-col items-center justify-center overflow-hidden group relative shadow-inner cursor-pointer hover:border-indigo-500 transition-all`}
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const file = e.dataTransfer.files[0];
                                        handleFileSelect(file);
                                    }}
                                    onClick={() => document.getElementById('image-upload').click()}
                                >
                                    {uploading ? (
                                        <div className="flex flex-col items-center animate-pulse">
                                            <Activity className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Yuklanmoqda...</p>
                                        </div>
                                    ) : modelInfo.image_url ? (
                                        <>
                                            <img src={modelInfo.image_url} alt="Model" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setModelInfo({ ...modelInfo, image_url: '' });
                                                    }}
                                                    className="p-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                                <p className="text-[10px] text-white font-black uppercase tracking-widest">O'chirish</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-6">
                                            <div className="w-16 h-16 bg-[var(--bg-card)] rounded-2xl flex items-center justify-center text-[var(--text-secondary)] mx-auto mb-4 group-hover:text-indigo-500 group-hover:bg-indigo-500/10 transition-all">
                                                <Shirt size={32} />
                                            </div>
                                            <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest">Rasm yuklash</p>
                                            <p className="text-[8px] text-[var(--text-muted)] uppercase mt-1">Bosish yoki sudratib tashlash</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                />
                            </div>

                            <div className="md:col-span-3 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3 ml-1">Model Nomi</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Poloshort Set..."
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-bold placeholder:text-[var(--text-muted)]"
                                            value={modelInfo.name}
                                            onChange={e => setModelInfo({ ...modelInfo, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3 ml-1">Artikul (Kod)</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="KL-2024-01..."
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-indigo-400 outline-none focus:border-indigo-500 transition-all font-mono font-black placeholder:text-[var(--text-muted)]"
                                            value={modelInfo.code}
                                            onChange={e => setModelInfo({ ...modelInfo, code: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3 ml-1">Yosh Oralig'i</label>
                                        <input
                                            type="text"
                                            placeholder="2-5 yosh..."
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-bold placeholder:text-[var(--text-muted)]"
                                            value={modelInfo.age_group}
                                            onChange={e => setModelInfo({ ...modelInfo, age_group: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3 ml-1">Kategoriya</label>
                                        <input
                                            type="text"
                                            placeholder="Kostyum-shim..."
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-bold placeholder:text-[var(--text-muted)]"
                                            value={modelInfo.category}
                                            onChange={e => setModelInfo({ ...modelInfo, category: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Notes Section */}
                                <div className="bg-rose-500/5 rounded-[2rem] p-6 border border-rose-500/10">
                                    <div className="flex items-center justify-between mb-6">
                                        <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                            <Activity size={14} /> Bo'limlarga Muhim Eslatmalar (Red Alert)
                                        </h5>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const notes = [...(modelInfo.notes || [])];
                                                notes.push({ department: 'Kesim', text: '' });
                                                setModelInfo({ ...modelInfo, notes });
                                            }}
                                            className="text-[10px] font-black text-rose-500 flex items-center gap-2 hover:bg-rose-500/10 px-4 py-2 rounded-xl transition-all border border-rose-500/20"
                                        >
                                            <Plus size={14} /> Eslatma Qo'shish
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {modelInfo.notes?.length === 0 ? (
                                            <div className="text-center py-4 bg-white/50 rounded-xl border border-dashed border-rose-100">
                                                <p className="text-[10px] font-bold text-rose-300 uppercase">Hozircha eslatmalar yo'q</p>
                                            </div>
                                        ) : (
                                            modelInfo.notes.map((note, idx) => (
                                                <div key={idx} className="flex gap-2 items-start bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)] shadow-sm animate-in slide-in-from-right-2">
                                                    <select
                                                        className="px-3 py-2 bg-rose-50 text-rose-600 border-none rounded-lg text-[10px] font-black outline-none focus:ring-2 focus:ring-rose-200"
                                                        value={note.department}
                                                        onChange={e => {
                                                            const notes = [...modelInfo.notes];
                                                            notes[idx].department = e.target.value;
                                                            setModelInfo({ ...modelInfo, notes });
                                                        }}
                                                    >
                                                        {['Kesim', 'Tikuv', 'OTK', 'Dazmol', 'Qadoq', 'Ombor', 'Moliya'].map(d => (
                                                            <option key={d} value={d}>{d.toUpperCase()}</option>
                                                        ))}
                                                    </select>
                                                    <textarea
                                                        rows="1"
                                                        placeholder="Muhim ko'rsatmani yozing..."
                                                        className="flex-1 px-3 py-2 bg-[var(--bg-body)] border-none rounded-lg text-xs font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-rose-200 resize-none"
                                                        value={note.text}
                                                        onChange={e => {
                                                            const notes = [...modelInfo.notes];
                                                            notes[idx].text = e.target.value;
                                                            setModelInfo({ ...modelInfo, notes });
                                                        }}
                                                    ></textarea>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const notes = modelInfo.notes.filter((_, i) => i !== idx);
                                                            setModelInfo({ ...modelInfo, notes });
                                                        }}
                                                        className="p-2 text-rose-200 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed BOM (Resept) */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-3">
                                    <Layers size={18} className="text-indigo-500" />
                                    Mato va Detallar Sarfi (BOM)
                                </h4>
                                <button
                                    type="button"
                                    onClick={addBomRow}
                                    className="text-[10px] font-black text-indigo-400 flex items-center gap-2 hover:text-indigo-300 uppercase tracking-widest bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 transition-all"
                                >
                                    <Plus size={14} /> Qator qo'shish
                                </button>
                            </div>

                            <div className="border border-[var(--border-color)] rounded-[2.5rem] overflow-hidden bg-[var(--bg-card)]">
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-[var(--bg-body)] text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                                            <tr>
                                                <th className="px-8 py-5 text-[var(--text-primary)]">Qism (Detal)</th>
                                                <th className="px-8 py-5">Turi</th>
                                                <th className="px-8 py-5">Nomi</th>
                                                <th className="px-8 py-5">Kodi</th>
                                                <th className="px-8 py-5 text-right">Sarf</th>
                                                <th className="px-8 py-5 text-right">Birlik</th>
                                                <th className="px-6 py-5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)]">
                                            {bomItems.map((item, idx) => {
                                                const selectedRef = references.find(r => r.id === item.material_type_id);
                                                return (
                                                    <tr key={idx} className="hover:bg-[var(--bg-hover)] transition-colors">
                                                        <td className="px-5 py-3">
                                                            <input
                                                                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-bold text-xs"
                                                                value={item.part_name}
                                                                placeholder="Futbolka..."
                                                                onChange={e => updateBomItem(idx, 'part_name', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <select
                                                                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-black text-[10px] uppercase tracking-widest"
                                                                value={selectedRef?.type || item.selected_type || ''}
                                                                onChange={e => {
                                                                    const updated = [...bomItems];
                                                                    updated[idx] = {
                                                                        ...updated[idx],
                                                                        material_type_id: '',
                                                                        item_name: '',
                                                                        selected_type: e.target.value,
                                                                        selected_name: ''
                                                                    };
                                                                    setBomItems(updated);
                                                                }}
                                                            >
                                                                <option value="">Tanlang...</option>
                                                                <option value="Mato">Mato</option>
                                                                <option value="Aksessuar">Aksessuar</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <select
                                                                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-bold text-xs"
                                                                value={item.item_name || item.selected_name || ''}
                                                                onChange={e => {
                                                                    const updated = [...bomItems];
                                                                    updated[idx].selected_name = e.target.value;
                                                                    updated[idx].material_type_id = '';
                                                                    setBomItems(updated);
                                                                }}
                                                                disabled={!(item.selected_type || selectedRef?.type)}
                                                            >
                                                                <option value="">Tanlang...</option>
                                                                {[...new Set(references
                                                                    .filter(r => r.type === (item.selected_type || selectedRef?.type))
                                                                    .map(r => r.name))]
                                                                    .map(name => (
                                                                        <option key={name} value={name}>{name}</option>
                                                                    ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <select
                                                                required
                                                                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-indigo-400 outline-none focus:border-indigo-500 transition-all font-mono font-black text-[10px]"
                                                                value={item.material_type_id || ''}
                                                                onChange={e => {
                                                                    const ref = references.find(r => r.id === e.target.value);
                                                                    if (ref) {
                                                                        const updated = [...bomItems];
                                                                        updated[idx] = {
                                                                            ...updated[idx],
                                                                            material_type_id: ref.id,
                                                                            item_name: ref.name,
                                                                            unit: ref.unit,
                                                                            grammage: ref.grammage,
                                                                            selected_name: ref.name,
                                                                            selected_type: ref.type
                                                                        };
                                                                        setBomItems(updated);
                                                                    }
                                                                }}
                                                                disabled={!(item.item_name || item.selected_name)}
                                                            >
                                                                <option value="">Tanlang...</option>
                                                                {references
                                                                    .filter(r =>
                                                                        r.type === (item.selected_type || selectedRef?.type) &&
                                                                        r.name === (item.item_name || item.selected_name)
                                                                    )
                                                                    .map(r => (
                                                                        <option key={r.id} value={r.id}>{r.code || 'KODSIZ'}</option>
                                                                    ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <input
                                                                    type="number"
                                                                    step="0.001"
                                                                    className="w-24 px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl font-black text-indigo-400 focus:border-indigo-500 outline-none text-right text-xs"
                                                                    value={item.consumption}
                                                                    placeholder="0.250"
                                                                    onChange={e => updateBomItem(idx, 'consumption', e.target.value)}
                                                                />
                                                                {item.selected_type === 'Aksessuar' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openCalculator(idx, selectedRef?.grammage, item.item_name)}
                                                                        className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20 shadow-lg"
                                                                        title="SM dan KG ga hisoblash"
                                                                    >
                                                                        <Calculator size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {item.selected_type === 'Aksessuar' && item.grammage && item.consumption && !isNaN(parseFloat(item.consumption)) && (
                                                                <div
                                                                    className="text-[9px] text-gray-400 mt-1 cursor-pointer hover:text-indigo-600 hover:bg-indigo-50 rounded px-1 flex items-center justify-end gap-1 transition-colors"
                                                                    title="Bosish orqali KG ga o'tkazish (+8% zaxira bilan)"
                                                                    onClick={() => {
                                                                        const val = parseFloat(item.consumption);
                                                                        const grammage = parseFloat(item.grammage);
                                                                        // Formula: (Value * Grammage / 1000) * 1.08
                                                                        const kg = ((val * grammage) / 1000) * 1.08;
                                                                        updateBomItem(idx, 'consumption', kg.toFixed(4));
                                                                    }}
                                                                >
                                                                    <span>≈ {(((parseFloat(item.consumption) * parseFloat(item.grammage)) / 1000) * 1.08).toFixed(3)} kg</span>
                                                                    <RefreshCw size={10} className="text-indigo-400" />
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{item.unit}</span>
                                                        </td>
                                                        <td className="px-5 py-3 text-center">
                                                            <button type="button" onClick={() => removeBomRow(idx)} className="text-gray-600 hover:text-rose-500 transition-all p-3 hover:bg-rose-500/10 rounded-xl">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Item List */}
                                <div className="md:hidden divide-y divide-gray-100">
                                    {bomItems.map((item, idx) => {
                                        const selectedRef = references.find(r => r.id === item.material_type_id);
                                        return (
                                            <div key={idx} className="p-4 space-y-3 bg-white">
                                                <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg">
                                                    <span className="text-[10px] font-black text-[#1a1c2e] uppercase">#{idx + 1}-Qism</span>
                                                    <button type="button" onClick={() => removeBomRow(idx)} className="text-rose-500 p-1">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="col-span-2">
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Qism Nomi</label>
                                                        <input
                                                            className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm font-bold"
                                                            value={item.part_name}
                                                            onChange={e => updateBomItem(idx, 'part_name', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Turi</label>
                                                        <select
                                                            className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold"
                                                            value={selectedRef?.type || item.selected_type || ''}
                                                            onChange={e => {
                                                                const updated = [...bomItems];
                                                                updated[idx] = { ...updated[idx], material_type_id: '', item_name: '', selected_type: e.target.value };
                                                                setBomItems(updated);
                                                            }}
                                                        >
                                                            <option value="">Tanlang...</option>
                                                            <option value="Mato">Mato</option>
                                                            <option value="Aksessuar">Aksessuar</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Sarf Miqdori</label>
                                                        <div className="flex items-center gap-1">
                                                            <div className="flex-1 flex gap-2">
                                                                <input
                                                                    type="number"
                                                                    step="0.001"
                                                                    className="w-full px-3 py-2 bg-indigo-50/50 rounded-lg text-sm font-black text-indigo-600"
                                                                    value={item.consumption}
                                                                    onChange={e => updateBomItem(idx, 'consumption', e.target.value)}
                                                                />
                                                                {item.selected_type === 'Aksessuar' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openCalculator(idx, selectedRef?.grammage, item.item_name)}
                                                                        className="px-3 py-2 bg-indigo-100 text-indigo-600 rounded-lg"
                                                                    >
                                                                        <Calculator size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {item.selected_type === 'Aksessuar' && item.grammage && item.consumption && !isNaN(parseFloat(item.consumption)) && (
                                                                <div
                                                                    className="text-[10px] text-gray-400 mt-1 cursor-pointer hover:text-indigo-600 bg-gray-50 p-1.5 rounded-lg flex items-center justify-between gap-2 border border-gray-100"
                                                                    onClick={() => {
                                                                        const val = parseFloat(item.consumption);
                                                                        const grammage = parseFloat(item.grammage);
                                                                        const kg = ((val * grammage) / 1000) * 1.08;
                                                                        updateBomItem(idx, 'consumption', kg.toFixed(4));
                                                                    }}
                                                                >
                                                                    <span>Konvertatsiya (KG):</span>
                                                                    <span className="font-black text-indigo-600 flex items-center gap-1">
                                                                        {(((parseFloat(item.consumption) * parseFloat(item.grammage)) / 1000) * 1.08).toFixed(3)} kg
                                                                        <RefreshCw size={12} />
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <span className="text-[9px] text-gray-400 font-bold uppercase">{item.unit}</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Material va Kodi</label>
                                                        <div className="flex gap-2">
                                                            <select
                                                                className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-xs font-bold"
                                                                value={item.item_name || item.selected_name || ''}
                                                                onChange={e => {
                                                                    const updated = [...bomItems];
                                                                    updated[idx].selected_name = e.target.value;
                                                                    updated[idx].material_type_id = '';
                                                                    setBomItems(updated);
                                                                }}
                                                            >
                                                                <option value="">Material...</option>
                                                                {[...new Set(references.filter(r => r.type === (item.selected_type || selectedRef?.type)).map(r => r.name))].map(n => <option key={n} value={n}>{n}</option>)}
                                                            </select>
                                                            <select
                                                                required
                                                                className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold"
                                                                value={item.material_type_id || ''}
                                                                onChange={e => {
                                                                    const ref = references.find(r => r.id === e.target.value);
                                                                    if (ref) {
                                                                        const updated = [...bomItems];
                                                                        Object.assign(updated[idx], { material_type_id: ref.id, item_name: ref.name, unit: ref.unit, selected_name: ref.name, selected_type: ref.type });
                                                                        setBomItems(updated);
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">Kod...</option>
                                                                {references.filter(r => r.type === (item.selected_type || selectedRef?.type) && r.name === (item.item_name || item.selected_name)).map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-6 pt-10 border-t border-[var(--border-color)]">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setEditingId(null); }}
                                className="px-8 py-4 text-[var(--text-secondary)] font-black hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest text-[10px]"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className={`flex items-center gap-3 ${saving ? 'bg-gray-700' : 'bg-indigo-600 hover:bg-indigo-500'} text-white px-12 py-4 rounded-[1.5rem] font-black transition-all shadow-2xl shadow-indigo-600/20 uppercase tracking-[0.2em] text-[10px]`}
                            >
                                {saving ? (
                                    <>
                                        <Activity size={20} className="animate-spin" />
                                        Saqlanmoqda...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        {editingId ? 'O\'zgarishlarni Saqlash' : 'Modelni Saqlash'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Calculator Modal */}
                    {calcState.open && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3rem] p-10 w-full max-w-md shadow-4xl scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black flex items-center gap-3 text-[var(--text-primary)] tracking-tight uppercase">
                                        <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400 border border-indigo-600/20 shadow-lg shadow-indigo-600/10">
                                            <Calculator size={24} />
                                        </div>
                                        Aqlli Hisoblagich
                                    </h3>
                                    <button onClick={() => setCalcState({ ...calcState, open: false })} className="p-2 hover:bg-[var(--bg-body)] rounded-full transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="text-[10px] text-[var(--text-secondary)] mb-8 font-black uppercase tracking-widest bg-[var(--bg-body)] p-4 rounded-2xl border border-[var(--border-color)] shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <span className="block font-black text-[var(--text-primary)]">{calcState.itemName}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[var(--text-secondary)]">1 metr og'irligi:</span>
                                            <input
                                                type="number"
                                                className="w-20 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 font-mono text-indigo-400 font-black text-right outline-none focus:border-indigo-500 transition-all"
                                                value={calcState.grammage}
                                                onChange={(e) => setCalcState({ ...calcState, grammage: parseFloat(e.target.value) })}
                                                onClick={(e) => e.target.select()}
                                            />
                                            <span className="font-mono text-indigo-400">gr</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3 ml-1 block">Zarur Dona (Soni)</label>
                                        <input
                                            autoFocus
                                            type="number"
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 font-black text-2xl text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all shadow-inner placeholder:text-[var(--text-muted)]"
                                            value={calcValues.count}
                                            onChange={e => setCalcValues({ ...calcValues, count: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3 ml-1 block">Uzunlik (1 dona uchun - SM)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 font-black text-2xl text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all shadow-inner placeholder:text-[var(--text-muted)]"
                                            value={calcValues.length}
                                            onChange={e => setCalcValues({ ...calcValues, length: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="bg-indigo-600/5 p-6 rounded-[2rem] border border-indigo-500/10 text-center relative overflow-hidden group shadow-inner">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Calculator size={80} />
                                        </div>
                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-2">Umumiy Og'irlik (KG)</span>
                                        <div className="text-4xl font-black text-[var(--text-primary)] tracking-tight flex items-baseline justify-center gap-1">
                                            {(((parseFloat(calcValues.count) || 0) * ((parseFloat(calcValues.length) || 0) / 100) * (calcState.grammage / 1000)) * 1.08).toFixed(4)}
                                            <span className="text-lg font-black text-indigo-400 uppercase tracking-wider ml-1">kg</span>
                                        </div>
                                        <span className="text-[9px] text-gray-600 font-bold uppercase mt-3 block tracking-widest">+8% TEXNOLOGIK ZAXIRA BILAN</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <button onClick={() => setCalcState({ ...calcState, open: false })} className="py-4 bg-[var(--bg-body)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-2xl font-black text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all uppercase tracking-widest">Bekor Berish</button>
                                        <button onClick={applyCalculation} className="py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] shadow-xl shadow-indigo-600/20 transition-all active:scale-95 uppercase tracking-widest">Qo'llash</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Model List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-20 flex justify-center"><Activity className="animate-spin text-indigo-500" /></div>
                ) : models.length === 0 ? (
                    <div className="text-center p-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
                        <Shirt size={48} className="mx-auto mb-4 opacity-20" />
                        Hali modellar kiritilmagan
                    </div>
                ) : (
                    models.map((model) => (
                        <div key={model.id} className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden group hover:border-indigo-500/30 transition-all shadow-2xl">
                            <div
                                className="p-8 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                                onClick={() => setExpandedModel(expandedModel === model.id ? null : model.id)}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-[var(--bg-body)] text-indigo-400 rounded-3xl flex items-center justify-center overflow-hidden border border-[var(--border-color)] shadow-inner ring-1 ring-[var(--border-color)] group-hover:ring-indigo-500/30 transition-all">
                                        {model.image_url ? (
                                            <img src={model.image_url} alt={model.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <Shirt size={32} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-xl font-black text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{model.name}</h4>
                                            {model.notes?.length > 0 && (
                                                <span className="flex items-center gap-2 bg-rose-500 text-white text-[9px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg shadow-rose-500/20 uppercase tracking-widest">
                                                    <CircleAlert size={10} /> {model.notes.length} Muhim
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20 tracking-widest uppercase"># {model.code}</span>
                                            <span className="w-1 h-1 bg-[var(--border-color)] rounded-full"></span>
                                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{model.age_group}</span>
                                            <span className="w-1 h-1 bg-[var(--border-color)] rounded-full"></span>
                                            <span className="text-[9px] font-black text-indigo-300 bg-indigo-500/5 px-3 py-1 rounded-xl border border-[var(--border-color)] uppercase tracking-widest">{model.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">BOM Tarkibi</p>
                                        <p className="text-lg font-black text-[var(--text-primary)] flex items-center justify-end gap-1">{model.bom_items?.length || 0} <span className="text-[10px] text-[var(--text-secondary)] uppercase">Qism</span></p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditModel(model);
                                            }}
                                            className="p-4 bg-[var(--bg-body)] text-[var(--text-secondary)] rounded-2xl hover:bg-indigo-600 hover:text-white transition-all border border-[var(--border-color)] shadow-lg group-hover:border-indigo-500/30"
                                        >
                                            <Pencil size={20} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteModel(model.id);
                                            }}
                                            className="p-4 bg-[var(--bg-body)] text-[var(--text-secondary)] hover:bg-rose-600 hover:text-white transition-all border border-[var(--border-color)] rounded-2xl"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                    <div className={`p-4 rounded-full bg-[var(--bg-body)] text-[var(--text-secondary)] transition-all ${expandedModel === model.id ? 'rotate-180 text-white bg-indigo-600 border border-indigo-500' : ''}`}>
                                        <ChevronDown size={20} />
                                    </div>
                                </div>
                            </div>

                            {expandedModel === model.id && (
                                <div className="px-10 pb-10 border-t border-[var(--border-color)] animate-in slide-in-from-top-4 duration-300">
                                    {/* Department Notes Display (RED ALERT STYLE) */}
                                    {model.notes?.length > 0 && (
                                        <div className="mt-8 space-y-4">
                                            <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-3 ml-2">
                                                <div className="p-1.5 bg-rose-500/20 rounded-lg text-rose-500 animate-pulse border border-rose-500/20">
                                                    <Activity size={14} />
                                                </div>
                                                Bo'limlar uchun muhim ko'rsatmalar
                                            </h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {model.notes.map((note, idx) => (
                                                    <div key={idx} className="flex bg-[var(--bg-body)] border border-rose-500/10 rounded-[1.5rem] overflow-hidden shadow-2xl">
                                                        <div className="bg-rose-600/10 text-rose-500 font-black text-[10px] px-4 flex items-center justify-center min-w-[100px] uppercase tracking-widest border-r border-rose-500/10 text-center leading-tight">
                                                            {note.department}
                                                        </div>
                                                        <div className="p-5 text-[11px] text-[var(--text-secondary)] font-bold leading-relaxed italic">
                                                            "{note.text}"
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-10 overflow-hidden rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-body)] shadow-inner">
                                        <div className="bg-[var(--bg-card)] px-8 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Model Texnik Tarkibi (BOM)</span>
                                            <span className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-widest bg-indigo-600/5 px-4 py-1.5 rounded-xl border border-indigo-600/10 shadow-lg">Artikul: {model.code}</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-[var(--bg-card)] text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-color)]">
                                                    <tr>
                                                        <th className="px-8 py-5 text-[var(--text-primary)]">Bo'lak (Part)</th>
                                                        <th className="px-8 py-5">Material Nomi</th>
                                                        <th className="px-8 py-5">Kodi</th>
                                                        <th className="px-8 py-5 text-right font-black text-[var(--text-primary)]">Sarf (Me\'yor)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--border-color)]">
                                                    {model.bom_items?.map((item, i) => {
                                                        const selectedRef = references.find(r => r.id === item.material_type_id);
                                                        const artikulKodi = selectedRef?.code || '-';

                                                        return (
                                                            <tr key={i} className="hover:bg-[var(--bg-hover)] transition-colors group/row">
                                                                <td className="px-8 py-5 font-black text-[var(--text-primary)] uppercase text-[10px] tracking-widest">{item.part_name}</td>
                                                                <td className="px-8 py-5 text-[var(--text-secondary)] font-bold text-xs">{item.item_name}</td>
                                                                <td className="px-8 py-5">
                                                                    <span className="text-[10px] font-mono font-black text-indigo-400 bg-[var(--bg-card)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] shadow-inner">
                                                                        {artikulKodi}
                                                                    </span>
                                                                </td>
                                                                <td className="px-8 py-5 text-right">
                                                                    <div className="flex items-center justify-end gap-2 text-indigo-400 font-black">
                                                                        <span className="text-[15px] tabular-nums tracking-tighter">{item.consumption}</span>
                                                                        <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-widest">{item.unit}</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showCropper && (
                <ImageCropper
                    image={tempImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => { setShowCropper(false); setTempImage(null); }}
                />
            )}
        </div>
    );
};

export default Modelxona;
