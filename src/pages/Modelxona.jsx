 
import React, { useState, useEffect } from 'react';
import { Plus, Save, FileText, Trash2, Layers, Scissors, Ruler, Activity, ChevronRight, ChevronDown, Shirt, X, Calculator, RefreshCw, CircleAlert, Pencil, Search, Image, Package, Clock, Download, Archive, CheckSquare, Square, SlidersHorizontal, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import ImageCropper from '../components/ImageCropper';
import ModelDetailsModal from '../components/ModelDetailsModal';

const Modelxona = () => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('barcha');
    const [expandedModel, setExpandedModel] = useState(null);
    const [references, setReferences] = useState([]);

    // --- SEARCH, FILTER & SELECTION STATES ---
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedModelIds, setSelectedModelIds] = useState([]);

    // --- COLUMN RESIZING STATE & HANDLER (EXCEL-STYLE) ---
    const defaultWidths = {
        select: 44,
        name: 240,
        image: 70,
        code: 130,
        category: 150,
        segment: 130,
        actions: 130
    };

    const [columnWidths, setColumnWidths] = useState(() => {
        try {
            const saved = localStorage.getItem('ziyo_model_col_widths');
            return saved ? { ...defaultWidths, ...JSON.parse(saved) } : defaultWidths;
        } catch {
            return defaultWidths;
        }
    });

    const handleResizeStart = (e, colKey) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = columnWidths[colKey] || defaultWidths[colKey] || 100;

        const handleMouseMove = (moveEvent) => {
            const delta = moveEvent.clientX - startX;
            const newWidth = Math.max(colKey === 'select' ? 36 : 50, startWidth + delta);
            setColumnWidths(prev => {
                const next = { ...prev, [colKey]: newWidth };
                localStorage.setItem('ziyo_model_col_widths', JSON.stringify(next));
                return next;
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

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

    const seedDefaultModels = async () => {
        try {
            setLoading(true);
            const defaults = [
                {
                    name: 'Bolalar Futbolkasi (Klassik)',
                    code: 'KL-2024-01',
                    age_group: '2-5 yosh',
                    category: 'Futbolka',
                    notes: [{ department: 'Kesim', text: 'Mato bichishda 2 sm zaxira qoldirilsin.' }]
                },
                {
                    name: 'Polo Short Set (Yozgi)',
                    code: 'KL-2024-02',
                    age_group: '4-8 yosh',
                    category: 'Kostyum-shim',
                    notes: [{ department: 'Tikuv', text: 'Tugma qadashda 15mm oq tugma ishlatilsin.' }]
                },
                {
                    name: 'Sportivka Xudi (Kapyushonli)',
                    code: 'KL-2024-03',
                    age_group: '6-12 yosh',
                    category: 'Xudi',
                    notes: [{ department: 'Dazmol', text: 'Pechat qismiga issiq dazmol bosilmasin!' }]
                }
            ];

            const { data: insertedModels, error: insertError } = await supabase
                .from('models')
                .insert(defaults)
                .select('*');

            if (insertError) throw insertError;

            if (insertedModels && insertedModels.length > 0) {
                const sampleBom = [
                    { model_id: insertedModels[0].id, part_name: 'Futbolka asos', item_name: 'SUPREME 100% PAXTA', thread_type: '30/1', grammage: '160', size_range: '2-5 yosh', consumption: 0.18, unit: 'kg' },
                    { model_id: insertedModels[0].id, part_name: 'Yoqa kashkorsa', item_name: 'KASHKORSA 95/5', thread_type: '30/1', grammage: '220', size_range: '2-5 yosh', consumption: 0.03, unit: 'kg' },
                    { model_id: insertedModels[1].id, part_name: 'Polo ko\'ylak', item_name: '2IP PENYE', thread_type: '20/1', grammage: '240', size_range: '4-8 yosh', consumption: 0.25, unit: 'kg' },
                    { model_id: insertedModels[1].id, part_name: 'Shorti', item_name: '2IP PENYE', thread_type: '20/1', grammage: '240', size_range: '4-8 yosh', consumption: 0.20, unit: 'kg' },
                    { model_id: insertedModels[2].id, part_name: 'Xudi korpus', item_name: '3IP NATCHES', thread_type: '10/1', grammage: '320', size_range: '6-12 yosh', consumption: 0.45, unit: 'kg' }
                ];
                await supabase.from('bom_items').insert(sampleBom);
            }

            alert("Modellar va BOM tarkiblari muvaffaqiyatli tiklandi!");
            fetchModels();
        } catch (err) {
            alert("Xatolik: " + err.message);
        } finally {
            setLoading(false);
        }
    };
    // --- SELECTION & ARCHIVE HELPERS ---
    const toggleSelectModel = (id) => {
        setSelectedModelIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedModelIds.length === filteredModels.length && filteredModels.length > 0) {
            setSelectedModelIds([]);
        } else {
            setSelectedModelIds(filteredModels.map(m => m.id));
        }
    };

    const handleArchiveModel = async (id, currentStatus) => {
        const newStatus = currentStatus === 'arxiv' ? 'tasdiqlangan' : 'arxiv';
        try {
            const { error } = await supabase
                .from('models')
                .update({ status: newStatus })
                .eq('id', id);
            if (error) throw error;
            fetchModels();
        } catch (err) {
            alert("Arxivlashda xatolik: " + err.message);
        }
    };

    // --- EXCEL EXPORT HELPER ---
    const handleExportExcel = (targetModels) => {
        const list = Array.isArray(targetModels) ? targetModels : [targetModels];
        if (!list || list.length === 0) {
            alert("Yuklash uchun model tanlanmagan.");
            return;
        }

        const excelData = [];
        list.forEach(m => {
            if (m.bom_items && m.bom_items.length > 0) {
                m.bom_items.forEach(item => {
                    excelData.push({
                        'Artikul': m.code || '',
                        'Model Nomi': m.name || '',
                        'Kategoriya': m.category || '',
                        'Yosh oralig\'i': m.age_group || '',
                        'Holati': m.status || 'Jarayonda',
                        'BOM Qismlari': item.part_name || '',
                        'Material Nomi': item.item_name || '',
                        'Ip turi': item.thread_type || '',
                        'Grammaj (g/m2)': item.grammage || '',
                        'Sarf': item.consumption || '',
                        'Birlik': item.unit || '',
                        'Yaratilgan sana': m.created_at ? new Date(m.created_at).toLocaleString('uz-UZ') : ''
                    });
                });
            } else {
                excelData.push({
                    'Artikul': m.code || '',
                    'Model Nomi': m.name || '',
                    'Kategoriya': m.category || '',
                    'Yosh oralig\'i': m.age_group || '',
                    'Holati': m.status || 'Jarayonda',
                    'BOM Qismlari': '-',
                    'Material Nomi': '-',
                    'Ip turi': '-',
                    'Grammaj (g/m2)': '-',
                    'Sarf': '-',
                    'Birlik': '-',
                    'Yaratilgan sana': m.created_at ? new Date(m.created_at).toLocaleString('uz-UZ') : ''
                });
            }
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Modellar");
        
        const fileName = list.length === 1 
            ? `Model_${list[0].code || 'export'}.xlsx` 
            : `Modellar_${Date.now()}.xlsx`;

        XLSX.writeFile(workbook, fileName);
    };

    // Filter & Search Logic
    const categoriesList = [...new Set(models.map(m => m.category).filter(Boolean))];

    const filteredModels = models.filter(m => {
        if (activeTab === 'tasdiqlangan' && m.status !== 'tasdiqlangan') return false;
        if (activeTab === 'shablonlar' && m.status !== 'shablon') return false;
        if (activeTab === 'arxivlar' && m.status !== 'arxiv') return false;
        if (activeTab === 'barcha' && m.status === 'arxiv') return false;

        if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const nameMatch = m.name?.toLowerCase().includes(query);
            const codeMatch = m.code?.toLowerCase().includes(query);
            const categoryMatch = m.category?.toLowerCase().includes(query);
            const ageMatch = m.age_group?.toLowerCase().includes(query);
            return nameMatch || codeMatch || categoryMatch || ageMatch;
        }

        return true;
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const date = d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const time = d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        return `${date} | ${time}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Modellashtirish</h2>
                    <p className="text-[var(--text-secondary)] font-bold uppercase tracking-widest text-[10px] mt-1">Yangi modellar yaratish, BOM va jarayonlarni boshqarish</p>
                </div>
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

            {/* Sub Tabs (Image 2 style) */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color)] pb-3">
                {[
                    { id: 'barcha', label: 'Jarayondagi modellar' },
                    { id: 'tasdiqlangan', label: 'Tasdiqlangan modellar' },
                    { id: 'shablonlar', label: 'Shablonlar' },
                    { id: 'arxivlar', label: 'Arxivlar' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSelectedModelIds([]); }}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                            activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Top Bar Controls (Search, Category Filter, Actions, Add Button - Image 2 Style) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Qidiruv"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-blue-500 transition-all font-medium"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Ruknlar bo'yicha saralash Dropdown */}
                    <div className="relative w-full sm:w-60">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-4 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-blue-500 transition-all font-medium appearance-none cursor-pointer pr-8"
                        >
                            <option value="all">Ruknlar bo'yicha saralash</option>
                            {categoriesList.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>
                </div>

                <div className="flex items-center gap-3 justify-end">
                    {selectedModelIds.length > 0 && (
                        <button
                            onClick={() => handleExportExcel(models.filter(m => selectedModelIds.includes(m.id)))}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all font-bold text-xs shadow-md shadow-emerald-600/20"
                            title="Tanlangan modellarni Excelga yuklash"
                        >
                            <FileSpreadsheet size={16} />
                            <span>Excel ({selectedModelIds.length})</span>
                        </button>
                    )}

                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl transition-all shadow-md shadow-blue-600/30 font-bold text-xs"
                        >
                            <Plus size={16} />
                            <span>Element qo'shish</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Model List Table (Excel-like layout - Image 2) */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-20 flex justify-center"><Activity className="animate-spin text-blue-500" /></div>
                ) : filteredModels.length === 0 ? (
                    <div className="text-center p-16 border-2 border-dashed border-[var(--border-color)] text-[var(--text-secondary)] shadow-inner space-y-4">
                        <Shirt size={48} className="mx-auto text-blue-400 opacity-40 animate-pulse" />
                        <h4 className="text-lg font-black text-[var(--text-primary)]">Ushbu bo'limda modellar topilmadi</h4>
                        <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                            Hozircha bazada modellar kiritilmagan bo'lishi mumkin. Qayta tiklash va namuna modellarni avtomatik kiritish uchun quyidagi tugmani bosing:
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                            <button
                                onClick={seedDefaultModels}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl uppercase tracking-widest text-xs inline-flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
                            >
                                <Plus size={16} />
                                <span>Baza Modellarni Avtomatik Tiklash (Namuna)</span>
                            </button>
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-[var(--bg-body)] hover:bg-white/10 text-[var(--text-primary)] font-bold px-6 py-3 rounded-xl uppercase tracking-widest text-xs border border-[var(--border-color)] transition-all cursor-pointer"
                            >
                                Element qo'shish
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse table-fixed">
                            <thead className="bg-[var(--bg-body)] text-[var(--text-secondary)] font-bold uppercase tracking-wider border-b border-[var(--border-color)] select-none">
                                <tr>
                                    {/* Select Checkbox Column */}
                                    <th
                                        style={{ width: `${columnWidths.select}px` }}
                                        className="py-3 px-3 text-center relative group/col border-r border-[var(--border-color)]/30"
                                    >
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={filteredModels.length > 0 && selectedModelIds.length === filteredModels.length}
                                            onChange={toggleSelectAll}
                                        />
                                        <div
                                            onMouseDown={(e) => handleResizeStart(e, 'select')}
                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 z-10 group-hover/col:bg-blue-500/30 transition-colors"
                                            title="Surish orqali o'lchamni o'zgartiring"
                                        />
                                    </th>

                                    {/* 1. Nomi (Name) */}
                                    <th
                                        style={{ width: `${columnWidths.name}px` }}
                                        className="py-3 px-4 text-left relative group/col border-r border-[var(--border-color)]/30 truncate"
                                    >
                                        Nomi
                                        <div
                                            onMouseDown={(e) => handleResizeStart(e, 'name')}
                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 z-10 group-hover/col:bg-blue-500/30 transition-colors"
                                            title="Surish orqali o'lchamni o'zgartiring"
                                        />
                                    </th>

                                    {/* 2. Rasm (Thumbnail) */}
                                    <th
                                        style={{ width: `${columnWidths.image}px` }}
                                        className="py-3 px-4 text-center relative group/col border-r border-[var(--border-color)]/30 truncate"
                                    >
                                        Rasm
                                        <div
                                            onMouseDown={(e) => handleResizeStart(e, 'image')}
                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 z-10 group-hover/col:bg-blue-500/30 transition-colors"
                                            title="Surish orqali o'lchamni o'zgartiring"
                                        />
                                    </th>

                                    {/* 3. Artikul (Code) */}
                                    <th
                                        style={{ width: `${columnWidths.code}px` }}
                                        className="py-3 px-4 text-left font-mono relative group/col border-r border-[var(--border-color)]/30 truncate"
                                    >
                                        Artikul
                                        <div
                                            onMouseDown={(e) => handleResizeStart(e, 'code')}
                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 z-10 group-hover/col:bg-blue-500/30 transition-colors"
                                            title="Surish orqali o'lchamni o'zgartiring"
                                        />
                                    </th>

                                    {/* 4. Kategoriya nomi */}
                                    <th
                                        style={{ width: `${columnWidths.category}px` }}
                                        className="py-3 px-4 text-left relative group/col border-r border-[var(--border-color)]/30 truncate"
                                    >
                                        Kategoriya nomi
                                        <div
                                            onMouseDown={(e) => handleResizeStart(e, 'category')}
                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 z-10 group-hover/col:bg-blue-500/30 transition-colors"
                                            title="Surish orqali o'lchamni o'zgartiring"
                                        />
                                    </th>

                                    {/* 5. Segment */}
                                    <th
                                        style={{ width: `${columnWidths.segment}px` }}
                                        className="py-3 px-4 text-left relative group/col border-r border-[var(--border-color)]/30 truncate"
                                    >
                                        Segment
                                        <div
                                            onMouseDown={(e) => handleResizeStart(e, 'segment')}
                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 z-10 group-hover/col:bg-blue-500/30 transition-colors"
                                            title="Surish orqali o'lchamni o'zgartiring"
                                        />
                                    </th>

                                    {/* Amallar (Actions) */}
                                    <th
                                        style={{ width: `${columnWidths.actions}px` }}
                                        className="py-3 px-4 text-right relative group/col truncate"
                                    >
                                        Amallar
                                        <div
                                            onMouseDown={(e) => handleResizeStart(e, 'actions')}
                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 z-10 group-hover/col:bg-blue-500/30 transition-colors"
                                            title="Surish orqali o'lchamni o'zgartiring"
                                        />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)] font-medium">
                                {filteredModels.map((model) => {
                                    const isSelected = selectedModelIds.includes(model.id);
                                    return (
                                        <tr
                                            key={model.id}
                                            className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors ${
                                                isSelected ? 'bg-blue-50/80 dark:bg-blue-950/30' : ''
                                            }`}
                                        >
                                            {/* Select Checkbox */}
                                            <td style={{ width: `${columnWidths.select}px` }} className="py-2.5 px-3 text-center truncate">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectModel(model.id)}
                                                />
                                            </td>

                                            {/* 1. Nomi (Name) */}
                                            <td style={{ width: `${columnWidths.name}px` }} className="py-2.5 px-4 font-semibold text-sm truncate">
                                                <button
                                                    onClick={() => setExpandedModel(model.id)}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline text-left truncate max-w-full inline-block"
                                                >
                                                    {model.name}
                                                </button>
                                                {model.notes?.length > 0 && (
                                                    <span className="ml-2 inline-flex items-center gap-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                                        {model.notes.length}
                                                    </span>
                                                )}
                                            </td>

                                            {/* 2. Rasm (Thumbnail) */}
                                            <td style={{ width: `${columnWidths.image}px` }} className="py-2.5 px-4 text-center truncate">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden mx-auto shadow-sm shrink-0">
                                                    {model.image_url ? (
                                                        <img src={model.image_url} alt={model.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Shirt size={16} className="text-gray-400" />
                                                    )}
                                                </div>
                                            </td>

                                            {/* 3. Artikul (Code) */}
                                            <td style={{ width: `${columnWidths.code}px` }} className="py-2.5 px-4 font-mono text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                                {model.code || 'N/A'}
                                            </td>

                                            {/* 4. Kategoriya nomi */}
                                            <td style={{ width: `${columnWidths.category}px` }} className="py-2.5 px-4 text-gray-600 dark:text-gray-400 text-xs truncate">
                                                {model.category || 'Standart'}
                                            </td>

                                            {/* 5. Segment */}
                                            <td style={{ width: `${columnWidths.segment}px` }} className="py-2.5 px-4 text-gray-600 dark:text-gray-400 text-xs truncate">
                                                {model.age_group || '-'}
                                            </td>

                                            {/* Amallar (Excel, Edit, Archive, Delete) */}
                                            <td style={{ width: `${columnWidths.actions}px` }} className="py-2.5 px-4 text-right truncate">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Excel export */}
                                                    <button
                                                        onClick={() => handleExportExcel(model)}
                                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                                                        title="Excelga yuklash"
                                                    >
                                                        <FileSpreadsheet size={16} />
                                                    </button>

                                                    {/* Edit */}
                                                    <button
                                                        onClick={() => handleEditModel(model)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                                                        title="Tahrirlash"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>

                                                    {/* Archive */}
                                                    <button
                                                        onClick={() => handleArchiveModel(model.id, model.status)}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            model.status === 'arxiv'
                                                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
                                                                : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                                        }`}
                                                        title={model.status === 'arxiv' ? 'Arxivdan chiqarish' : 'Arxivlash'}
                                                    >
                                                        <Archive size={16} />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDeleteModel(model.id)}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                                        title="O'chirish"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Model Details Modal */}
            {expandedModel && (
                <ModelDetailsModal
                    model={models.find(m => m.id === expandedModel)}
                    onClose={() => setExpandedModel(null)}
                    onRefresh={fetchModels}
                    suggestedSizes={[...new Set(models.flatMap(m => m.sizes || []))].filter(Boolean)}
                    suggestedSeasons={[...new Set(models.flatMap(m => m.seasons || []))].filter(Boolean)}
                    suggestedComponents={[...new Set(models.flatMap(m => m.components || []))].filter(Boolean)}
                />
            )}

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
