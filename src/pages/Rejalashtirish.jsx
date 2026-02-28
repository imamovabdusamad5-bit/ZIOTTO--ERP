import React, { useState, useEffect } from 'react';
import {
    ClipboardList, Calculator, Plus, Trash2, Save,
    Layers, ShoppingBag, Package, Palette, Ruler,
    Activity, ChevronDown, ChevronRight, FileText,
    History, Shirt, RefreshCw, X, Settings2, Pencil, Clock, Download, CircleCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportComplexTable } from '../utils/ExcelExport';
import { useTheme } from '../context/ThemeContext';

const Rejalashtirish = () => {
    const { theme } = useTheme();

    // --- BASIC DATA & UI STATE ---
    const [models, setModels] = useState([]);
    const [orders, setOrders] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [factData, setFactData] = useState({}); // { order_id: [factItems] }

    // --- FORM SELECTION STATE ---
    const [selectedModel, setSelectedModel] = useState(null);
    const [orderInfo, setOrderInfo] = useState({
        order_number: '',
        deadline: '',
    });

    // --- PROCUREMENT SUMMARY STATE & LOGIC ---
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [grandTotal, setGrandTotal] = useState({});

    // Toggle Order Selection
    const toggleOrderSelection = (orderId) => {
        setSelectedOrders(prev =>
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    // Calculate Grand Total for Selected Orders
    const calculateGrandTotal = async () => {
        setLoading(true);
        try {
            const totals = {}; // Key: "ItemName|Color|Unit"

            // Fetch details for selected orders
            const { data: fullOrders, error } = await supabase
                .from('production_orders')
                .select(`
                    *,
                    models (*, bom_items (*)),
                    production_order_items (*)
                `)
                .in('id', selectedOrders);

            if (error) throw error;

            fullOrders.forEach(order => {
                const model = order.models;
                if (!model) return;

                // Process each row in the order
                order.production_order_items.forEach(item => {
                    const qty = item.quantity || 0;
                    const mainColor = item.color || 'Aniqlanmagan';
                    const colors = item.color_details || {};

                    // A. Calculate Fabrics (Matrix)
                    // We need to know which parts are fabrics. We assume BOM "selected_type" === 'Mato'
                    // Since we don't have uniqueParts stored, we derive from BOM again.

                    // A. Calculate Matrix Parts (Fabrics & Detailed Accessories)
                    // Any item with a 'part_name' is considered a Matrix Part that can have specific colors/weights
                    const matrixParts = model.bom_items.filter(b => (b.part_name || '').trim().length > 0);

                    matrixParts.forEach(bom => {
                        const partName = (bom.part_name || '').trim();
                        // Determine Used Color: was it overridden in 'colors' map? or use 'mainColor'?
                        // The 'colors' map in DB is { "Collar": "White", ... }
                        const usedColor = colors[partName] || mainColor;

                        // Determine Qty
                        // Weight logic is tricky without stored settings. 
                        // We will use BOM default consumption * Qty.
                        // If user overrides weight in UI, it's not saved in DB items currently (only final Qty per row).
                        // BUT, we need a rough estimate. 
                        // Let's use BOM consumption.

                        const waste = 5;
                        const required = qty * parseFloat(bom.consumption) * (1 + waste / 100);

                        const unit = bom.unit; // or 'kg' if weight based. Assume BOM unit is correct for now.

                        const key = `${bom.item_name}|${usedColor}|${unit}`;
                        if (!totals[key]) totals[key] = { name: bom.item_name, color: usedColor, unit: unit, val: 0, type: 'Mato' };
                        totals[key].val += required;
                    });

                    // B. Calculate Non-Matrix Accessories (Generic)
                    const accessParts = model.bom_items.filter(b => (b.part_name || '').trim().length === 0);
                    accessParts.forEach(bom => {
                        // Always Main Color
                        const accWaste = 2;
                        const required = qty * parseFloat(bom.consumption) * (1 + accWaste / 100);
                        const key = `${bom.item_name}|${mainColor}|${bom.unit}`;
                        if (!totals[key]) totals[key] = { name: bom.item_name, color: mainColor, unit: bom.unit, val: 0, type: bom.selected_type };
                        totals[key].val += required;
                    });
                });
            });

            setGrandTotal(totals);
            setShowSummaryModal(true);
        } catch (e) {
            alert('Hisoblashda xatolik: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    // --- CORE STATES ---
    // Breakdown Rows: [{ id, size_range, quantity, main_color, colors: { 'Body': 'RED' } }]
    const [breakdown, setBreakdown] = useState([
        { id: Date.now(), size_range: '', quantity: '', main_color: '', colors: {} }
    ]);

    const [partSettings, setPartSettings] = useState({});
    const [uniqueParts, setUniqueParts] = useState([]);

    // Persistence
    const [draftLoaded, setDraftLoaded] = useState(false);
    const [summary, setSummary] = useState({}); // Grouped by Color

    // --- DATA FETCHING ---
    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Fetch Orders separate so we can re-call it
            const { data: oRes, error } = await supabase.from('production_orders').select(`*, models(name, code)`).order('created_at', { ascending: false });
            if (error) throw error;
            if (oRes) setOrders(oRes);

            // Fetch Fact Data
            const { data: facts, error: fError } = await supabase.from('order_material_fact').select('*');
            if (facts && !fError) {
                const factMap = {};
                facts.forEach(f => {
                    if (!factMap[f.order_id]) factMap[f.order_id] = [];
                    factMap[f.order_id].push(f);
                });
                setFactData(factMap);
            }
        } catch (error) {
            console.error("Order Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            try {
                const [mRes, iRes] = await Promise.all([
                    supabase.from('models').select(`*, bom_items (*)`),
                    supabase.from('inventory').select('*')
                ]);

                if (mRes.error) throw uniqueError(mRes.error);
                if (iRes.error) throw uniqueError(iRes.error);

                if (mRes.data) setModels(mRes.data);
                if (iRes.data) setInventory(iRes.data);

                // Fetch Orders
                fetchOrders();

            } catch (error) {
                console.error("Data Load Error:", error);
                setLoading(false); // Ensure loading stops on error
            }
        };

        const uniqueError = (err) => new Error(`Supabase Error: ${err.message}`);
        initData();
    }, []);

    // --- PERSISTENCE: SAVE DRAFT ---
    useEffect(() => {
        if (selectedModel && !draftLoaded) {
            const timer = setTimeout(() => {
                const draft = {
                    modelId: selectedModel.id,
                    orderInfo,
                    breakdown,
                    partSettings,
                    timestamp: Date.now()
                };
                localStorage.setItem('ziyo_excel_plan_draft_v2', JSON.stringify(draft));
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [selectedModel, orderInfo, breakdown, partSettings, draftLoaded]);

    // --- PERSISTENCE: RESTORE DRAFT ---
    useEffect(() => {
        if (models.length > 0 && !selectedModel && !draftLoaded) {
            const saved = localStorage.getItem('ziyo_excel_plan_draft_v2');
            if (saved) {
                try {
                    const draft = JSON.parse(saved);
                    const model = models.find(m => m.id === draft.modelId);
                    if (model && window.confirm('Tugallanmagan rejaningizni tiklaymizmi?')) {
                        setSelectedModel(model);
                        setOrderInfo(draft.orderInfo);
                        if (draft.breakdown) setBreakdown(draft.breakdown);
                        if (draft.partSettings) setPartSettings(draft.partSettings);

                        const parts = extractUniqueParts(model);
                        setUniqueParts(parts);

                        setDraftLoaded(true);
                        setShowForm(true);
                    } else {
                        localStorage.removeItem('ziyo_excel_plan_draft_v2');
                        setDraftLoaded(true);
                    }
                } catch (e) {
                    console.error("Draft Error", e);
                }
            }
        }
    }, [models]);

    // --- HELPER: Extract Unique Parts from BOM (Trimmed) ---
    const extractUniqueParts = (model) => {
        if (!model || !model.bom_items) return [];
        // Show columns for ANY part that has a name (Fabrics, Jakards, etc.)
        const parts = [...new Set(
            model.bom_items
                .map(b => (b.part_name || '').trim())
                .filter(Boolean)
        )];
        return parts.sort();
    };

    // --- MODEL CHANGE HANDLER ---
    const handleModelChange = (modelId) => {
        const model = models.find(m => m.id === modelId);
        setSelectedModel(model);

        const parts = extractUniqueParts(model);
        setUniqueParts(parts);

        // Initialize Part Settings
        const initialSettings = {};
        parts.forEach(part => {
            // Find BOM items for this part (fuzzy match due to trim)
            const bomItem = model.bom_items.find(b => (b.part_name || '').trim() === part);

            let weight = 0;
            // Try to detect Weight
            if (bomItem) {
                // If specific Part Name exists, we treat it as matrix item.
                // Use 'kg' unit as hint for fabric-like waste, otherwise accessory waste
                weight = parseFloat(bomItem.consumption) || 0;
            }

            initialSettings[part] = {
                weight: weight,
                waste: bomItem?.unit === 'kg' ? 5 : 2
            };
        });

        setPartSettings(initialSettings);
        setBreakdown([{ id: Date.now(), size_range: model.age_group || '', quantity: '', main_color: '', colors: {} }]);
    };

    // --- BREAKDOWN MATRIX HANDLERS ---
    // Generic update for root level properties (size, qty, main_color)
    const updateBreakdown = (idx, field, value) => {
        const newBreakdown = [...breakdown];
        newBreakdown[idx][field] = value;
        setBreakdown(newBreakdown);
    };

    // Specific update for Part Details (Color, Weight, Waste)
    const updateRowDetail = (idx, part, field, value) => {
        const newBreakdown = [...breakdown];
        // Ensure part objects exist
        if (!newBreakdown[idx].colors) newBreakdown[idx].colors = {};
        if (!newBreakdown[idx].weights) newBreakdown[idx].weights = {};
        if (!newBreakdown[idx].wastes) newBreakdown[idx].wastes = {};

        // Update the specific field map
        if (field === 'color') newBreakdown[idx].colors[part] = value;
        if (field === 'weight') newBreakdown[idx].weights[part] = value;
        if (field === 'waste') newBreakdown[idx].wastes[part] = value;

        setBreakdown(newBreakdown);
    };

    // Helper to Get Weight (Gramaj) with Fallback
    const getPartWeight = (idx, part) => {
        const row = breakdown[idx];
        // Priority: Row Specific > Global Setting > Default 0
        return row.weights?.[part] || partSettings[part]?.weight || 0;
    };

    const addRow = () => {
        const lastRow = breakdown[breakdown.length - 1];
        setBreakdown([...breakdown, {
            id: Date.now(),
            size_range: selectedModel?.age_group || '',
            quantity: '',
            main_color: lastRow.main_color,
            colors: { ...lastRow.colors }
        }]);
    };

    const updatePartSetting = (part, field, value) => {
        setPartSettings(prev => ({
            ...prev,
            [part]: {
                ...prev[part],
                [field]: parseFloat(value) || 0
            }
        }));
    };

    // --- CORE CALCULATION ENGINE ---
    useEffect(() => {
        if (!selectedModel || !partSettings) return;

        const summaryData = {}; // Key: ColorName, Value: Array of items

        breakdown.forEach(row => {
            const qty = parseFloat(row.quantity) || 0;
            if (qty <= 0) return;

            const mainColor = row.main_color || 'Aniqlanmagan';

            // Iterate ALL unique parts
            uniqueParts.forEach(part => {
                // Determine Color: Specific Part Color OR Main Color
                const partColor = row.colors[part] || mainColor;
                if (!partColor) return; // Skip if no color defined

                const settings = partSettings[part] || { weight: 0, waste: 0 };
                const bomItem = selectedModel.bom_items.find(b => (b.part_name || '').trim() === part);

                if (!bomItem) return;

                const itemName = bomItem.item_name;
                const itemType = bomItem.selected_type;

                // Calculation Logic
                // 1. By Weight (if Gramaj defined)
                // 2. By Count/Length (if Gramaj is 0)

                let finalQty = 0;
                let finalUnit = bomItem.unit;

                if (settings.weight > 0) {
                    // Weight based calc: (Qty * Gramaj) + Waste
                    finalQty = qty * settings.weight * (1 + settings.waste / 100);
                    finalUnit = 'kg';
                } else {
                    // Consumption based calc: (Qty * Consumption) + Waste
                    // E.g. 200 ta * 5 dona/ta = 1000 dona
                    finalQty = qty * parseFloat(bomItem.consumption) * (1 + settings.waste / 100);
                }

                // Group Key: Color -> Items
                if (!summaryData[partColor]) summaryData[partColor] = [];

                const existingItem = summaryData[partColor].find(i => i.name === itemName && i.unit === finalUnit);

                if (existingItem) {
                    existingItem.val += finalQty;
                } else {
                    summaryData[partColor].push({
                        name: itemName,
                        type: itemType,
                        val: finalQty,
                        unit: finalUnit,
                        waste: settings.waste
                    });
                }
            });

            // --- NEW: Calculate Hidden Accessories (Items NOT in Matrix) ---
            selectedModel.bom_items.forEach(bom => {
                const partName = (bom.part_name || '').trim();
                // If this part is already in the Matrix table, skip it (calculated above)
                if (uniqueParts.includes(partName)) return;

                // This is a "Hidden" accessory (e.g. Thread, Label, Bag)
                // Assign to row's Main Color
                if (!row.main_color && row.main_color !== 0) return; // Skip if no color defined

                const color = row.main_color || 'Aniqlanmagan';
                const itemName = bom.item_name;
                const itemType = bom.selected_type;

                // Default Waste for accessories: 2% (or could be configurable globally later)
                const accWaste = 2;

                // Calc: Qty * Consumption
                let finalQty = qty * parseFloat(bom.consumption) * (1 + accWaste / 100);

                // Add to Summary
                if (!summaryData[color]) summaryData[color] = [];
                const existingItem = summaryData[color].find(i => i.name === itemName && i.unit === bom.unit);

                if (existingItem) {
                    existingItem.val += finalQty;
                } else {
                    summaryData[color].push({
                        name: itemName,
                        type: itemType,
                        val: finalQty,
                        unit: bom.unit,
                        waste: accWaste
                    });
                }
            });
        });

        // Filter out items with 0 val? No, maybe small values matter.
        setSummary(summaryData);

    }, [breakdown, partSettings, selectedModel, uniqueParts]);


    // --- EDIT LOGIC ---
    const [editingOrderId, setEditingOrderId] = useState(null);

    const handleConfirm = async (id) => {
        if (!window.confirm('Rejani tasdiqlaysizmi? Tasdiqlangandan so\'ng bu reja boshqa bo\'limlarga yuboriladi.')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('production_orders')
                .update({ status: 'Confirmed' })
                .eq('id', id);

            if (error) throw error;
            fetchOrders();
        } catch (error) {
            alert('Xatolik: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (orderId) => {
        setLoading(true);
        try {
            // 1. Fetch full order + items
            const { data: order, error } = await supabase
                .from('production_orders')
                .select(`*, models(*, bom_items(*)), production_order_items(*)`)
                .eq('id', orderId)
                .single();

            if (error) throw error;

            // 2. Set Basic Info
            setSelectedModel(order.models);
            setOrderInfo({ order_number: order.order_number, deadline: order.deadline });
            setEditingOrderId(order.id);

            // 3. Init Settings (Simply set defaults based on BOM, as we don't store custom settings yet)
            const model = order.models;
            // FIXED: Do not rely on 'selected_type' as it is not saved in DB. Use part_name existence.
            const parts = [...new Set(model.bom_items.map(b => (b.part_name || '').trim()).filter(Boolean))].sort();
            setUniqueParts(parts);

            const initialSettings = {};
            parts.forEach(part => {
                const bomItem = model.bom_items.find(b => (b.part_name || '').trim() === part);

                let weight = 0;
                if (bomItem) {
                    weight = parseFloat(bomItem.consumption) || 0;
                }

                initialSettings[part] = {
                    weight: weight,
                    waste: bomItem?.unit === 'kg' ? 5 : 2
                };
            });
            setPartSettings(initialSettings);

            // 4. Reconstruct Breakdown Matrix
            const newBreakdown = order.production_order_items.map(item => ({
                id: Date.now() + Math.random(),
                size_range: item.size_range,
                quantity: item.quantity,
                main_color: item.color,
                colors: item.color_details || {}
            }));

            setBreakdown(newBreakdown.length > 0 ? newBreakdown : [{ id: Date.now(), size_range: '', quantity: '', main_color: '', colors: {} }]);
            setShowForm(true);

        } catch (e) {
            alert('Tahrirlashda xatolik: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedModel) return;

        setLoading(true);
        try {
            const totalQty = breakdown.reduce((sum, r) => sum + (parseInt(r.quantity) || 0), 0);
            let orderId = editingOrderId;

            if (editingOrderId) {
                // --- UPDATE ---
                const { error: updateErr } = await supabase
                    .from('production_orders')
                    .update({
                        order_number: orderInfo.order_number,
                        deadline: orderInfo.deadline,
                        total_quantity: totalQty,
                        status: 'Planning', // Reset status to Planning on edit
                        material_summary: summary // Save material calculations
                    })
                    .eq('id', editingOrderId);

                if (updateErr) throw updateErr;

                // Delete old items and re-insert
                await supabase.from('production_order_items').delete().eq('order_id', editingOrderId);

            } else {
                // --- CREATE ---
                const { data: order, error: orderErr } = await supabase.from('production_orders')
                    .insert([{
                        model_id: selectedModel.id,
                        order_number: orderInfo.order_number,
                        deadline: orderInfo.deadline,
                        total_quantity: totalQty,
                        status: 'Planning',
                        material_summary: summary // Save material calculations
                    }]).select().single();

                if (orderErr) {
                    if (orderErr.code === '23505') throw new Error(`"${orderInfo.order_number}" raqamli buyurtma mavjud!`);
                    throw orderErr;
                }
                orderId = order.id;
            }

            // Insert Items
            const items = breakdown.map(r => ({
                order_id: orderId,
                quantity: r.quantity,
                size_range: r.size_range,
                color: r.main_color,
                color_details: r.colors
            }));

            const { error: itemsErr } = await supabase.from('production_order_items').insert(items);
            if (itemsErr) throw itemsErr;

            alert(editingOrderId ? 'Reja yangilandi!' : 'Reja saqlandi!');
            localStorage.removeItem('ziyo_excel_plan_draft_v2');
            setShowForm(false);
            setEditingOrderId(null);
            setBreakdown([{ id: Date.now(), size_range: '', assort: '', quantity: '', main_color: '', colors: {} }]);
            setSelectedModel(null);
            setOrderInfo({ order_number: '', deadline: '' });
            fetchOrders();

        } catch (err) {
            alert('Xatolik: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-600/20 rotate-3 transition-transform hover:rotate-0">
                        <ClipboardList size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Rejalashtirish (Excel)</h2>
                        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Model detallari, ranglar va gramaj bo'yicha aniq hisob-kitob</p>
                    </div>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-2 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        Yangi Reja
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-[var(--bg-card)] rounded-[3rem] shadow-4xl border border-[var(--border-color)] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                    <div className="p-10 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-body)]/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                <Calculator size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[var(--text-primary)]">Yangi Reja Formasi</h3>
                                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Barcha detallarni aniqlik bilan kiriting</p>
                            </div>
                        </div>
                        <button onClick={() => setShowForm(false)} className="p-4 bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-2xl transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="p-10 space-y-10">
                        {/* 1. Model Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Model Tanlash</label>
                                <select
                                    required
                                    className="w-full px-6 py-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500 transition-all appearance-none"
                                    value={selectedModel?.id || ''}
                                    onChange={e => handleModelChange(e.target.value)}
                                >
                                    <option value="">Tanlang...</option>
                                    {models.map(m => <option key={m.id} value={m.id} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{m.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Artikul (Kod)</label>
                                <div className="w-full px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 font-black font-mono shadow-inner">
                                    {selectedModel?.code || '---'}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Buyurtma №</label>
                                <input
                                    className="w-full px-6 py-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500 transition-all placeholder:text-[var(--text-secondary)]"
                                    placeholder="ORD-001"
                                    value={orderInfo.order_number}
                                    onChange={(e) => setOrderInfo({ ...orderInfo, order_number: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Topshirish Muddat</label>
                                <input
                                    className="w-full px-6 py-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500 transition-all"
                                    type="date"
                                    value={orderInfo.deadline}
                                    onChange={e => setOrderInfo({ ...orderInfo, deadline: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {selectedModel && (
                            <>
                                {/* Part Settings Removed - Integrated into Matrix Table */}

                                {/* 3. Breakdown Matrix Table */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
                                            <Layers className="text-emerald-500" size={24} />
                                            Razmer & Rang Matritsasi
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => exportComplexTable('planning-table', orderInfo.order_number || 'Reja')}
                                            className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                                        >
                                            <Download size={16} />
                                            Excelga Yuklash
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto border border-[var(--border-color)] rounded-[2rem] shadow-4xl bg-[var(--bg-body)]/20 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                                        <table id="planning-table" className="w-full min-w-max text-left border-separate border-spacing-0">
                                            <thead>
                                                {/* TOP LEVEL GROUP HEADERS */}
                                                <tr className="text-[var(--text-primary)] text-[11px] uppercase font-black tracking-widest text-center shadow-lg">
                                                    {/* Fixed Left Groups */}
                                                    <th colSpan={3} className="py-4 sticky left-0 z-30 bg-[#1e2329] border-b border-indigo-500/30 text-indigo-100 ring-1 ring-white/5">
                                                        ASOSIY
                                                    </th>

                                                    {/* 1. DETAL VA RANGLAR (Pink/Purple) */}
                                                    <th colSpan={uniqueParts.length + 1} className="py-4 bg-pink-900/40 text-pink-100 border-b border-pink-500/30 backdrop-blur-sm">
                                                        DETAL VA RANGLAR
                                                    </th>

                                                    {/* 2. GRAMAJ (Blue/Gray) */}
                                                    <th colSpan={uniqueParts.length} className="py-4 bg-slate-800/60 text-slate-100 border-b border-slate-500/30 backdrop-blur-sm">
                                                        GRAMAJ
                                                    </th>

                                                    {/* 3. UMUMIY KG (Amber/Yellow) */}
                                                    <th colSpan={uniqueParts.length} className="py-4 bg-amber-900/40 text-amber-100 border-b border-amber-500/30 backdrop-blur-sm">
                                                        UMUMIY KG
                                                    </th>

                                                    <th className="py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]"></th>
                                                </tr>

                                                {/* COLUMN HEADERS */}
                                                <tr className="bg-[var(--bg-body)] text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-wider text-center">
                                                    {/* Fixed Left Columns */}
                                                    <th className="sticky left-0 bg-[var(--bg-body)] px-2 py-4 border-b border-r border-[var(--border-color)] w-20 z-20 text-[var(--text-primary)] shadow-[2px_0_5px_rgba(0,0,0,0.5)]">YOSHI/ RAZMER</th>
                                                    <th className="sticky left-[80px] bg-[var(--bg-body)] px-2 py-4 border-b border-r border-[var(--border-color)] w-16 z-20 text-[var(--text-primary)] shadow-[2px_0_5px_rgba(0,0,0,0.5)]">ASSORT</th>
                                                    <th className="sticky left-[144px] bg-[var(--bg-body)] px-2 py-4 border-b border-r border-[var(--border-color)] w-20 z-20 text-[var(--text-primary)] shadow-[2px_0_5px_rgba(0,0,0,0.5)]">SONI</th>

                                                    {/* 1. Colors Group */}
                                                    {/* Main Color is always first */}
                                                    <th className="px-2 py-4 border-b border-r border-[var(--border-color)] text-pink-200 min-w-[120px] bg-pink-900/20">ASOSIY RANG</th>
                                                    {uniqueParts.map(part => (
                                                        <th key={`col-${part}`} className="px-2 py-4 border-b border-r border-[var(--border-color)] text-pink-200 bg-pink-900/20 min-w-[120px]">{part.toUpperCase()} RANGI</th>
                                                    ))}

                                                    {/* 2. Gramaj Group */}
                                                    {uniqueParts.map(part => (
                                                        <th key={`gram-${part}`} className="px-2 py-4 border-b border-r border-[var(--border-color)] text-slate-200 bg-slate-800/40 w-28">GRAMAJ {part.toUpperCase()}</th>
                                                    ))}

                                                    {/* 3. Total Group */}
                                                    {uniqueParts.map(part => (
                                                        <th key={`tot-${part}`} className="px-2 py-4 border-b border-r border-[var(--border-color)] text-amber-200 bg-amber-900/20 w-28">KG {part.toUpperCase()}</th>
                                                    ))}

                                                    <th className="px-2 py-4 border-b border-[var(--border-color)] w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-color)]">
                                                {breakdown.map((row, idx) => {
                                                    // Determine visual grouping for "Size"
                                                    const isSameSizeAsPrev = idx > 0 && breakdown[idx - 1].size_range === row.size_range;

                                                    return (
                                                        <tr key={row.id} className="hover:bg-[var(--bg-hover)] transition-colors group">
                                                            {/* 1. SIZE (Visual Row Span) */}
                                                            <td className={`sticky left-0 bg-[var(--bg-body)] border-r border-[var(--border-color)] group-hover:bg-[var(--bg-card)] px-2 py-1 z-10 align-top`}>
                                                                <input
                                                                    className={`w-full px-1 py-2 bg-transparent border-none rounded-lg text-xs font-black text-center outline-none transition-all ${isSameSizeAsPrev ? 'text-[var(--text-secondary)] focus:text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}
                                                                    value={row.size_range}
                                                                    onChange={e => updateBreakdown(idx, 'size_range', e.target.value)}
                                                                    placeholder={isSameSizeAsPrev ? '"' : '2/5'}
                                                                />
                                                            </td>

                                                            {/* 2. ASSORT */}
                                                            <td className="sticky left-[80px] bg-[var(--bg-body)] group-hover:bg-[var(--bg-card)] px-2 py-1 border-r border-[var(--border-color)] z-10">
                                                                <input
                                                                    type="number"
                                                                    className="w-full px-1 py-2 bg-transparent text-[var(--text-primary)] rounded-lg text-xs font-bold text-center outline-none focus:bg-[var(--bg-input)] placeholder:text-[var(--text-secondary)]"
                                                                    value={row.assort || ''}
                                                                    onChange={e => updateBreakdown(idx, 'assort', e.target.value)}
                                                                    placeholder="-"
                                                                />
                                                            </td>

                                                            {/* 3. SONI */}
                                                            <td className="sticky left-[144px] bg-[var(--bg-body)] group-hover:bg-[var(--bg-card)] px-2 py-1 border-r border-[var(--border-color)] z-10">
                                                                <input
                                                                    type="number"
                                                                    className="w-full px-1 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-black text-center outline-none border border-emerald-500/30"
                                                                    value={row.quantity}
                                                                    onChange={e => updateBreakdown(idx, 'quantity', e.target.value)}
                                                                    placeholder="0"
                                                                />
                                                            </td>

                                                            {/* --- GROUP 1: COLORS --- */}
                                                            {/* Main Color */}
                                                            <td className="px-2 py-1 border-r border-[var(--border-color)] bg-pink-900/10">
                                                                <input
                                                                    className="w-full px-2 py-2 bg-pink-500/20 text-pink-100 rounded-lg text-[11px] font-bold text-center outline-none border border-pink-500/30 placeholder:text-pink-500/40"
                                                                    value={row.main_color}
                                                                    onChange={e => updateBreakdown(idx, 'main_color', e.target.value.toUpperCase())}
                                                                    placeholder="ASOSIY..."
                                                                />
                                                            </td>
                                                            {/* Dynamic Parts Colors */}
                                                            {uniqueParts.map(part => (
                                                                <td key={`c-${part}`} className="px-2 py-1 border-r border-[var(--border-color)] bg-pink-900/10">
                                                                    <input
                                                                        className={`w-full px-2 py-2 rounded-lg text-[11px] font-bold outline-none transition-all ${row.colors && row.colors[part] ? 'bg-white/10 text-white border border-white/20' : 'bg-transparent text-gray-400 hover:bg-white/5 placeholder:text-gray-700'}`}
                                                                        value={(row.colors && row.colors[part]) || ''}
                                                                        onChange={e => updateRowDetail(idx, part, 'color', e.target.value.toUpperCase())}
                                                                        placeholder={row.main_color || '-'}
                                                                    />
                                                                </td>
                                                            ))}

                                                            {/* --- GROUP 2: GRAMAJ --- */}
                                                            {uniqueParts.map(part => (
                                                                <td key={`g-${part}`} className="px-2 py-1 border-r border-[var(--border-color)] bg-slate-800/20">
                                                                    <input
                                                                        type="number"
                                                                        step="0.001"
                                                                        className="w-full px-1 py-2 bg-transparent text-slate-200 text-center font-mono text-[11px] outline-none hover:bg-white/5 rounded-lg focus:bg-slate-500/30 transition-all placeholder:text-[var(--text-secondary)] border border-transparent focus:border-slate-500/30"
                                                                        value={row.weights?.[part] || ''}
                                                                        onChange={e => updateRowDetail(idx, part, 'weight', e.target.value)}
                                                                        placeholder={partSettings[part]?.weight || '0'}
                                                                    />
                                                                </td>
                                                            ))}

                                                            {/* --- GROUP 3: TOTALS --- */}
                                                            {uniqueParts.map(part => {
                                                                const qty = parseFloat(row.quantity) || 0;
                                                                const weight = getPartWeight(idx, part);
                                                                const waste = 5;
                                                                const total = (qty * weight * (1 + waste / 100)).toFixed(2);
                                                                return (
                                                                    <td key={`t-${part}`} className="px-2 py-1 border-r border-[var(--border-color)] bg-amber-900/10 text-center">
                                                                        <span className={`font-mono text-[11px] font-black ${parseFloat(total) > 0 ? 'text-amber-200' : 'text-[var(--text-secondary)]'}`}>
                                                                            {parseFloat(total) > 0 ? total : '-'}
                                                                        </span>
                                                                    </td>
                                                                );
                                                            })}

                                                            {/* Actions */}
                                                            <td className="px-2 text-center">
                                                                <button
                                                                    onClick={() => setBreakdown(breakdown.filter((_, i) => i !== idx))}
                                                                    type="button"
                                                                    className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addRow}
                                        className="w-full py-4 border border-dashed border-[var(--border-color)] rounded-[2rem] text-[var(--text-secondary)] font-black text-xs uppercase tracking-widest hover:bg-[var(--bg-hover)] hover:border-emerald-500/30 hover:text-emerald-500 transition-all flex items-center justify-center gap-3 group"
                                    >
                                        <Plus size={18} className="group-hover:scale-125 transition-transform" />
                                        Yangi Razmer Qo'shish
                                    </button>
                                </div>

                                {/* 4. Calculated Summary */}
                                <div className="space-y-6 pt-10 border-t border-[var(--border-color)]">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                                            <Palette size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Ranglar bo'yicha Ehtiyoj</h4>
                                            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5">Xom-ashyo sarfi hisob-kitobi</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {Object.entries(summary).map(([color, items]) => (
                                            <div key={color} className="bg-[var(--bg-card)] rounded-[2.5rem] p-8 border border-[var(--border-color)] hover:border-indigo-500/30 transition-all flex flex-col gap-6 group">
                                                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-4 h-4 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] group-hover:scale-125 transition-transform"></div>
                                                        <span className="font-black text-[var(--text-primary)] uppercase tracking-tighter text-lg">{color}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    {items.map((item, i) => (
                                                        <div key={i} className="flex flex-col gap-1.5 p-3 rounded-2xl hover:bg-[var(--bg-hover)] transition-all">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-bold text-[var(--text-secondary)]">{item.name}</span>
                                                                <span className="text-xs font-black text-[var(--text-primary)]">
                                                                    {item.unit === 'dona' || item.unit === 'pcs' ? Math.ceil(item.val) : item.val.toFixed(2)}
                                                                    <span className="text-indigo-400 ml-1">{item.unit}</span>
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest">
                                                                <span className={item.type === 'Mato' ? 'text-emerald-500' : 'text-amber-500'}>{item.type}</span>
                                                                <span className="text-[var(--text-muted)]">Zaxira: {item.waste}%</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-10 border-t border-[var(--border-color)] gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-10 py-5 bg-[var(--bg-hover)] text-[var(--text-muted)] rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-all border border-[var(--border-color)]"
                                    >
                                        Bekor Qilish
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center gap-4 bg-emerald-600 text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 active:scale-95 transition-all shadow-2xl shadow-emerald-600/20 disabled:opacity-50"
                                    >
                                        {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                        {editingOrderId ? 'Rejani Yangilash' : 'Rejani Saqlash'}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            )}

            {/* Modal for Grand Total */}
            {showSummaryModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div id="printable-area" className="bg-[var(--bg-card)] rounded-[3.5rem] shadow-4xl border border-[var(--border-color)] w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-[var(--border-color)] flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-emerald-600/20 rounded-[1.5rem] flex items-center justify-center text-emerald-500">
                                    <ShoppingBag size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Umumiy Sotib Olish (Plan)</h3>
                                    <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">{selectedOrders.length} ta model bo'yicha yig'indi</p>
                                </div>
                            </div>
                            <button onClick={() => setShowSummaryModal(false)} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all no-print">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-10 overflow-y-auto custom-scrollbar space-y-10">
                            {Object.keys(grandTotal).length === 0 ? (
                                <div className="text-center py-20 text-[var(--text-muted)] font-bold">Ma'lumot topilmadi</div>
                            ) : (
                                <>
                                    {/* MATOLAR Section */}
                                    <div className="space-y-6">
                                        <h4 className="flex items-center gap-3 text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] border-l-4 border-emerald-500 pl-4">
                                            MATOLAR (Fabrics)
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {Object.values(grandTotal).filter(i => i.type === 'Mato').map((item, idx) => (
                                                <div key={idx} className="bg-[var(--bg-body)]/[0.03] border border-[var(--border-color)] p-6 rounded-[2rem] flex justify-between items-center group hover:border-emerald-500/30 transition-all">
                                                    <div>
                                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{item.color}</p>
                                                        <h5 className="font-black text-[var(--text-primary)] text-lg leading-tight uppercase">{item.name}</h5>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-[var(--text-primary)]">{item.val.toFixed(2)}</p>
                                                        <p className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-widest">{item.unit}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* AKSESSUARLAR Section */}
                                    <div className="space-y-6">
                                        <h4 className="flex items-center gap-3 text-sm font-black text-[var(--text-primary)] uppercase tracking-[0.2em] border-l-4 border-amber-500 pl-4">
                                            AKSESSUARLAR (Accessories)
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {Object.values(grandTotal).filter(i => i.type !== 'Mato').map((item, idx) => (
                                                <div key={idx} className="bg-[var(--bg-body)]/[0.03] border border-[var(--border-color)] p-5 rounded-3xl flex justify-between items-center group hover:border-amber-500/30 transition-all">
                                                    <div>
                                                        <h5 className="font-bold text-[var(--text-secondary)] text-xs leading-tight mb-1">{item.name}</h5>
                                                        <p className="text-[8px] font-bold text-amber-500/70 uppercase tracking-widest">{item.color}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-[var(--text-primary)]">
                                                            {item.unit === 'dona' || item.unit === 'pcs' ? Math.ceil(item.val) : item.val.toFixed(2)}
                                                        </p>
                                                        <p className="text-[8px] text-[var(--text-secondary)] font-black uppercase">{item.unit}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-10 border-t border-[var(--border-color)] bg-[var(--bg-body)]/[0.02] flex justify-end gap-4 no-print">
                            <button onClick={() => window.print()} className="px-10 py-5 bg-[var(--bg-hover)] text-[var(--text-primary)] font-black text-xs uppercase tracking-widest rounded-2xl border border-[var(--border-color)] hover:bg-[var(--hover-bg)] flex items-center gap-3 transition-all">
                                <FileText size={20} />
                                Chop etish / PDF
                            </button>
                            <button onClick={() => setShowSummaryModal(false)} className="px-10 py-5 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 transition-all">
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Plans List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
                            <History size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight uppercase">Faol Rejalar</h3>
                            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5">Hozirda jarayonda bo'lgan buyurtmalar</p>
                        </div>
                    </div>
                    {selectedOrders.length > 0 && (
                        <button
                            onClick={calculateGrandTotal}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-3 animate-in fade-in slide-in-from-right-4"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <ShoppingBag size={18} />}
                            Sotib olish Plan ({selectedOrders.length})
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {orders.map(order => (
                        <div key={order.id} className={`bg-[var(--bg-card)] border rounded-[2.5rem] p-8 shadow-2xl transition-all relative overflow-hidden group ${selectedOrders.includes(order.id) ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-[var(--border-color)] hover:border-emerald-500/30'}`}>
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                                <ClipboardList size={80} className="text-[var(--text-primary)]" />
                            </div>

                            <div className="flex items-start justify-between mb-8">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.2em] mb-1">Buyurtma №</span>
                                    <h4 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{order.order_number}</h4>
                                </div>
                                <div className="flex gap-2">
                                    {order.status === 'Planning' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleConfirm(order.id); }}
                                            className="p-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                                            title="Tasdiqlash"
                                        >
                                            <CircleCheck size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEdit(order.id); }}
                                        className="p-3 bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-white hover:bg-blue-600 rounded-xl transition-all"
                                        title="Tahrirlash"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <input
                                        type="checkbox"
                                        className="w-8 h-8 rounded-xl border-[var(--border-color)] bg-[var(--bg-body)] text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        checked={selectedOrders.includes(order.id)}
                                        onChange={() => toggleOrderSelection(order.id)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-8 pt-6 border-t border-[var(--border-color)]">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Model</p>
                                    <p className="text-sm font-black text-[var(--text-primary)] truncate">{order.models?.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Jami Soni</p>
                                    <p className="text-sm font-black text-[var(--text-primary)]">{order.total_quantity} <span className="text-emerald-500/50 text-[10px] tracking-widest font-bold">DONA</span></p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Muddat</p>
                                    <p className="text-sm font-black text-rose-500 flex items-center gap-2">
                                        <Clock size={14} />
                                        {new Date(order.deadline).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Holat</p>
                                    <span className="inline-flex px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* Plan vs Fact Section */}
                            <div className="pt-6 mt-6 border-t border-[var(--border-color)]">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                        <Activity size={14} className="text-indigo-500" />
                                    </div>
                                    <h5 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">
                                        Plan vs Fakt (Haqiqiy Ishlatish)
                                    </h5>
                                </div>

                                <div className="bg-black/20 rounded-2xl overflow-hidden border border-white/5">
                                    <table className="w-full text-left text-[10px]">
                                        <thead className="bg-white/5 text-gray-500 font-bold uppercase tracking-widest">
                                            <tr>
                                                <th className="px-4 py-2">Material</th>
                                                <th className="px-4 py-2 text-right">Plan</th>
                                                <th className="px-4 py-2 text-right">Fakt</th>
                                                <th className="px-4 py-2 text-right">Farq</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {/* Flatten summary items to compare with facts */}
                                            {(() => {
                                                const planItems = [];
                                                if (order.material_summary) {
                                                    Object.values(order.material_summary).flat().forEach(p => {
                                                        const existing = planItems.find(x => x.name === p.name);
                                                        if (existing) existing.val += p.val;
                                                        else planItems.push({ ...p });
                                                    });
                                                }

                                                const orderFacts = factData[order.id] || [];

                                                return planItems.map((p, idx) => {
                                                    const f = orderFacts.find(fact => fact.material_name === p.name);
                                                    const factQty = f ? parseFloat(f.consumed_qty) : 0;
                                                    const delta = factQty - p.val;
                                                    const perc = p.val > 0 ? (delta / p.val) * 100 : 0;

                                                    return (
                                                        <tr key={idx} className="hover:bg-white/5">
                                                            <td className="px-4 py-2 font-bold text-gray-400">{p.name}</td>
                                                            <td className="px-4 py-2 text-right font-mono">{p.val.toFixed(1)}</td>
                                                            <td className="px-4 py-2 text-right font-mono text-indigo-400">{factQty.toFixed(1)}</td>
                                                            <td className={`px-4 py-2 text-right font-mono font-black ${delta > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                                {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                                                                <div className="text-[8px] opacity-70">
                                                                    ({perc > 0 ? '+' : ''}{perc.toFixed(0)}%)
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                    {(!order.material_summary || Object.keys(order.material_summary).length === 0) && (
                                        <div className="p-4 text-center text-gray-600 italic uppercase text-[8px]">Plan ma'lumotlari yo'q</div>
                                    )}
                                </div>
                            </div>

                            {/* Old Kerakli Materiallar Section (kept as detail) */}
                            {order.material_summary && Object.keys(order.material_summary).length > 0 && (
                                <details className="mt-4">
                                    <summary className="text-[9px] font-bold text-gray-500 cursor-pointer hover:text-gray-300 uppercase tracking-widest outline-none">
                                        Batafsil Plan (Ranglar bo'yicha)
                                    </summary>
                                    <div className="pt-4 space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                                        {Object.entries(order.material_summary).map(([color, items]) => (
                                            <div key={color} className="bg-[var(--bg-body)]/[0.03] border border-[var(--border-color)] p-4 rounded-2xl hover:border-amber-500/30 transition-all">
                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">{color}</p>
                                                <div className="space-y-2">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-[10px]">
                                                            <span className="text-[var(--text-muted)] font-bold">{item.name}</span>
                                                            <span className="text-[var(--text-primary)] font-black">
                                                                {item.unit === 'dona' ? Math.ceil(item.val) : item.val.toFixed(2)} {item.unit}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Rejalashtirish;
