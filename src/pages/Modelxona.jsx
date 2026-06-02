/* eslint-disable react-hooks/immutability */
import React, { useState, useEffect } from 'react';
import { Plus, Save, FileText, Trash2, Layers, Scissors, Ruler, Activity, ChevronRight, ChevronDown, Shirt, X, Calculator, RefreshCw, CircleAlert, Pencil, Search, Image, Package, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ImageCropper from '../components/ImageCropper';

const Modelxona = () => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('barcha');
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

    // --- OPERATIONS / SMV STATE ---
    const [opModal, setOpModal] = useState({ open: false, model: null });
    const [operations, setOperations] = useState([]);
    const [opLoading, setOpLoading] = useState(false);
    const [opSaving, setOpSaving] = useState(false);

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

    async function fetchReferences() {
        const { data, error } = await supabase.from('material_types').select('*').order('name');
        if (!error) setReferences(data || []);
    };

    async function fetchModels() {
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

    // --- OPERATIONS HELPERS ---
    const openOperationsModal = async (model) => {
        setOpModal({ open: true, model });
        setOperations([]);
        setOpLoading(true);
        try {
            const { data, error } = await supabase
                .from('operations')
                .select('*')
                .eq('model_id', model.id)
                .order('seq', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                setOperations(
                    data.map(op => ({
                        id: op.id,
                        section: op.section || 'Tikuv',
                        name: op.name || '',
                        machine_type: op.machine_type || '',
                        smv: op.smv ? Number(op.smv) : ''
                    }))
                );
            } else {
                setOperations([
                    { id: null, section: 'Tikuv', name: '', machine_type: '', smv: '' }
                ]);
            }
        } catch (error) {
            alert("Operatsiyalarni yuklashda xatolik: " + error.message);
        } finally {
            setOpLoading(false);
        }
    };

    const closeOperationsModal = () => {
        setOpModal({ open: false, model: null });
        setOperations([]);
        setOpLoading(false);
        setOpSaving(false);
    };

    const addOperationRow = () => {
        setOperations(prev => [
            ...prev,
            { id: null, section: 'Tikuv', name: '', machine_type: '', smv: '' }
        ]);
    };

    const removeOperationRow = (index) => {
        setOperations(prev => prev.filter((_, i) => i !== index));
    };

    const updateOperationField = (index, field, value) => {
        setOperations(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const saveOperations = async (e) => {
        e.preventDefault();
        if (!opModal.model) return;

        // Basic validation
        for (const op of operations) {
            if (!op.name?.trim()) {
                alert("Har bir operatsiya uchun nom kiritilishi shart.");
                return;
            }
            if (!op.section?.trim()) {
                alert("Har bir operatsiya uchun bo'lim (section) tanlang.");
                return;
            }
            if (op.smv === '' || isNaN(Number(op.smv)) || Number(op.smv) <= 0) {
                alert(`"${op.name}" operatsiyasi uchun SMV (daqiqada) to'g'ri kiriting.`);
                return;
            }
        }

        try {
            setOpSaving(true);

            // 1. Eski operatsiyalarni o'chirish
            const { error: delError } = await supabase
                .from('operations')
                .delete()
                .eq('model_id', opModal.model.id);

            if (delError) throw delError;

            // 2. Yangi operatsiyalarni kiritish
            const toInsert = operations.map((op, idx) => ({
                model_id: opModal.model.id,
                seq: idx + 1,
                section: op.section || 'Tikuv',
                name: op.name,
                machine_type: op.machine_type || null,
                smv: Number(op.smv)
            }));

            if (toInsert.length > 0) {
                const { error: insError } = await supabase
                    .from('operations')
                    .insert(toInsert);

                if (insError) throw insError;
            }

            // 3. Umumiy SMV ni hisoblab, models jadvaliga yozish
            const totalSmv = toInsert.reduce((sum, op) => sum + Number(op.smv || 0), 0);

            const { error: updError } = await supabase
                .from('models')
                .update({ total_smv: totalSmv })
                .eq('id', opModal.model.id);

            if (updError) throw updError;

            await fetchModels();
            alert("Operatsiyalar va umumiy SMV muvaffaqiyatli saqlandi.");
            closeOperationsModal();
        } catch (error) {
            alert("Operatsiyalarni saqlashda xatolik: " + error.message);
        } finally {
            setOpSaving(false);
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

        try {
            setSaving(true);

            // Filter out empty notes before saving
            const filteredNotes = (modelInfo.notes || []).filter(n => n.text?.trim() !== '');
            
            // Faqat kerakli maydonlarni ajratib olamiz (localStorage dagi eski qoldiqlar bazaga ketmasligi uchun)
            const modelToSave = {
                name: modelInfo.name,
                code: modelInfo.code,
                age_group: modelInfo.age_group,
                category: modelInfo.category,
                image_url: modelInfo.image_url,
                notes: filteredNotes
            };

            // 1. Create or Update Model
            if (editingId) {
                const { error: updateError } = await supabase
                    .from('models')
                    .update(modelToSave)
                    .eq('id', editingId);

                if (updateError) throw updateError;
                alert('Model yangilandi!');
            } else {
                const { error: modelError } = await supabase
                    .from('models')
                    .insert([modelToSave]);

                if (modelError) {
                    if (modelError.code === '23505') {
                        throw new Error(`"${modelInfo.code}" artikuli bazada allaqachon bor. Iltimos boshqa artikul kiritib ko'ring yoki mavjudini o'chirib qayta yarating.`);
                    }
                    throw modelError;
                }
                alert('Model muvaffaqiyatli saqlandi!');
            }

            // Muvaffaqiyatli saqlangandan so'ng, ro'yxatga qaytamiz
            setShowForm(false);
            setEditingId(null);
            setModelInfo({ name: '', code: '', age_group: '', category: '', image_url: '', notes: [] });
            localStorage.removeItem('ziyo_model_draft');
            fetchModels();
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

    const filteredModels = models.filter(m => {
        if (activeTab === 'barcha') return true;
        if (activeTab === 'tasdiqlangan') return m.status === 'tasdiqlangan';
        if (activeTab === 'shablonlar') return m.status === 'shablon';
        if (activeTab === 'arxivlar') return m.status === 'arxiv';
        return true;
    });

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
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-6 bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border-color)]">
                {[
                    { id: 'barcha', label: 'Barcha Modellar' },
                    { id: 'tasdiqlangan', label: 'Tasdiqlangan Model' },
                    { id: 'shablonlar', label: 'Shablonlar' },
                    { id: 'arxivlar', label: 'Arxivlar' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                            activeTab === tab.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Model List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-20 flex justify-center"><Activity className="animate-spin text-indigo-500" /></div>
                ) : filteredModels.length === 0 ? (
                    <div className="text-center p-20 bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] text-[var(--text-secondary)] shadow-inner">
                        <Shirt size={48} className="mx-auto mb-4 opacity-20" />
                        Ushbu bo'limda modellar topilmadi
                    </div>
                ) : (
                    filteredModels.map((model) => (
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
                                        <p className="text-lg font-black text-[var(--text-primary)] flex items-center justify-end gap-1">
                                            {model.bom_items?.length || 0}
                                            <span className="text-[10px] text-[var(--text-secondary)] uppercase">Qism</span>
                                        </p>
                                        {typeof model.total_smv === 'number' && model.total_smv > 0 && (
                                            <p className="mt-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                                SMV: {Number(model.total_smv).toFixed(2)} min
                                            </p>
                                        )}
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
                                                openOperationsModal(model);
                                            }}
                                            className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/40 shadow-lg"
                                            title="Operatsiyalar va SMV"
                                        >
                                            <Activity size={20} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openOperationsModal(model);
                                            }}
                                            className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/40 shadow-lg"
                                            title="Operatsiyalar va SMV"
                                        >
                                            <Activity size={20} />
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

            {/* OPERATIONS / SMV MODAL */}
            {opModal.open && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[3rem] p-8 w-full max-w-4xl shadow-4xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] tracking-tight uppercase flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                                        <Scissors size={20} />
                                    </div>
                                    {opModal.model?.name} – Operatsiyalar &amp; SMV
                                </h3>
                                <p className="text-[10px] md:text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">
                                    Har bir qadam uchun texkartani kiriting (SMV daqiqada)
                                </p>
                            </div>
                            <button
                                onClick={closeOperationsModal}
                                className="p-2 rounded-full hover:bg-[var(--bg-body)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {opLoading ? (
                            <div className="py-16 flex flex-col items-center justify-center gap-3">
                                <Activity className="animate-spin text-emerald-500" size={28} />
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Operatsiyalar yuklanmoqda...</p>
                            </div>
                        ) : (
                            <form onSubmit={saveOperations} className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em]">
                                        Umumiy operatsiyalar: {operations.length}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={addOperationRow}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all"
                                    >
                                        <Plus size={14} /> Qator Qo'shish
                                    </button>
                                </div>

                                <div className="border border-[var(--border-color)] rounded-[2rem] overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-[var(--bg-body)] text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                                                <tr>
                                                    <th className="px-4 md:px-6 py-3">#</th>
                                                    <th className="px-4 md:px-6 py-3">Bo'lim</th>
                                                    <th className="px-4 md:px-6 py-3">Operatsiya Nomi</th>
                                                    <th className="px-4 md:px-6 py-3">Mashina Turi</th>
                                                    <th className="px-4 md:px-6 py-3 text-right">SMV (daq)</th>
                                                    <th className="px-4 md:px-6 py-3 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                                                {operations.map((op, idx) => (
                                                    <tr key={idx} className="hover:bg-[var(--bg-hover)] transition-colors">
                                                        <td className="px-4 md:px-6 py-3 text-[11px] font-mono text-[var(--text-secondary)]">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-4 md:px-6 py-3">
                                                            <select
                                                                className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest outline-none focus:border-emerald-500 transition-all"
                                                                value={op.section}
                                                                onChange={e => updateOperationField(idx, 'section', e.target.value)}
                                                            >
                                                                <option value="Kesim">Kesim</option>
                                                                <option value="Tikuv">Tikuv</option>
                                                                <option value="OTK">OTK</option>
                                                                <option value="Dazmol">Dazmol</option>
                                                                <option value="Qadoq">Qadoq</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 md:px-6 py-3">
                                                            <input
                                                                className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500 transition-all"
                                                                placeholder="Yelkani tikish..."
                                                                value={op.name}
                                                                onChange={e => updateOperationField(idx, 'name', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-4 md:px-6 py-3">
                                                            <input
                                                                className="w-full px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500 transition-all"
                                                                placeholder="Juki Lockstitch..."
                                                                value={op.machine_type}
                                                                onChange={e => updateOperationField(idx, 'machine_type', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-4 md:px-6 py-3 text-right">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                className="w-24 md:w-28 px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-xs font-mono font-black text-emerald-500 text-right outline-none focus:border-emerald-500 transition-all"
                                                                value={op.smv}
                                                                onChange={e => updateOperationField(idx, 'smv', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-4 md:px-6 py-3 text-center">
                                                            {operations.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeOperationRow(idx)}
                                                                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                                    <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={14} className="text-emerald-500" />
                                        <span>
                                            Umumiy SMV (taxminiy):{" "}
                                            {operations.reduce((sum, op) => sum + (parseFloat(op.smv) || 0), 0).toFixed(2)} daqiqa
                                        </span>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={closeOperationsModal}
                                            className="px-5 py-3 rounded-2xl bg-[var(--bg-body)] border border-[var(--border-color)] text-[10px] font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] uppercase tracking-widest transition-all"
                                        >
                                            Bekor qilish
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={opSaving}
                                            className={`px-7 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2 shadow-xl ${opSaving
                                                    ? 'bg-gray-700 text-white'
                                                    : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                                                } transition-all`}
                                        >
                                            {opSaving ? (
                                                <>
                                                    <Activity size={16} className="animate-spin" />
                                                    Saqlanmoqda...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={16} />
                                                    Saqlash
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Modelxona;
