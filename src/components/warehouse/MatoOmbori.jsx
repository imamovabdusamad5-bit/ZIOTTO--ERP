import React, { useState, useEffect } from 'react';
import {
    Warehouse, Search, Plus, History, CircleArrowDown,
    ArrowUpRight, ArrowDownLeft, ScrollText, QrCode, Printer, Trash2, CircleCheck, RotateCcw, ChevronDown, ChevronUp, Edit, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MatoOmbori = ({ inventory, references, orders, onRefresh, viewMode }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showInboundModal, setShowInboundModal] = useState(false);
    const [showOutboundModal, setShowOutboundModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemRolls, setItemRolls] = useState([]);
    const [expandedRowId, setExpandedRowId] = useState(null);

    // Selection State
    const [selectedIds, setSelectedIds] = useState([]);

    // Filter
    const filteredInventory = inventory.filter(item => {
        const query = searchTerm.toLowerCase();
        return (
            !searchTerm ||
            (item.item_name || '').toLowerCase().includes(query) ||
            (item.color || '').toLowerCase().includes(query) ||
            (item.color_code || '').toLowerCase().includes(query) ||
            (item.material_types?.thread_type || '').toLowerCase().includes(query) ||
            (item.material_types?.grammage || '').toString().includes(query) ||
            (item.batch_number || '').toLowerCase().includes(query)
        );
    });

    // Inbound State
    const [inboundData, setInboundData] = useState({
        date: new Date().toISOString().split('T')[0],
        selected_material_name: '',
        reference_id: '',
        color: '',
        color_code: '', // Pantone
        batch_number: '',
        quantity: '',
        type_specs: '',
        grammage: '',
        width: '',
        note: '',
        rolls: []
    });

    // Auto-fill specs when reference is selected
    useEffect(() => {
        if (inboundData.reference_id && references) {
            const ref = references.find(r => r.id === inboundData.reference_id);
            if (ref) {
                setInboundData(prev => ({
                    ...prev,
                    type_specs: ref.thread_type || prev.type_specs,
                    grammage: ref.grammage || prev.grammage,
                    width: ref.width || prev.width
                }));
            }
        }
    }, [inboundData.reference_id, references]);

    // Outbound State
    const [outboundData, setOutboundData] = useState({
        inventory_id: '',
        quantity: '',
        order_id: '',
        reason: 'Kesimga (Ishlab chiqarishga)',
        selected_rolls: []
    });

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [itemHistory, setItemHistory] = useState([]);

    // Edit State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        item_name: '',
        color: '',
        color_code: '',
        batch_number: '',
        quantity: ''
    });

    // --- LOGIC: Select & Bulk Delete ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredInventory.map(i => i.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`${selectedIds.length} ta elementni o'chirmoqchimisiz?`)) return;

        setLoading(true);
        try {
            // Delete related material_requests FIRST (foreign key constraint)
            await supabase.from('material_requests').delete().in('inventory_id', selectedIds);

            // Delete related logs and rolls
            await supabase.from('inventory_logs').delete().in('inventory_id', selectedIds);
            await supabase.from('inventory_rolls').delete().in('inventory_id', selectedIds);

            const { error } = await supabase.from('inventory').delete().in('id', selectedIds);

            if (error) throw error;

            setSelectedIds([]);
            onRefresh();
        } catch (error) {
            console.error(error);
            alert("Xatolik: " + error.message);
        } finally {
            setLoading(false);
        }
    };


    // --- LOGIC: Fetch Rolls and Toggle Expansion ---
    const fetchRolls = async (inventoryId) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('inventory_rolls')
            .select('*')
            .eq('inventory_id', inventoryId)
            .order('id', { ascending: true });

        setLoading(false);
        if (error) {
            console.error("Error fetching rolls:", error);
            setItemRolls([]);
        } else {
            // Sort by roll number numerically if possible
            const sorted = (data || []).sort((a, b) => {
                const aNum = parseInt(a.roll_number.split('-').pop());
                const bNum = parseInt(b.roll_number.split('-').pop());
                return (aNum && bNum) ? aNum - bNum : a.roll_number.localeCompare(b.roll_number);
            });
            setItemRolls(sorted);
        }
    };

    const toggleRow = async (item) => {
        if (expandedRowId === item.id) {
            setExpandedRowId(null);
            setItemRolls([]);
        } else {
            setExpandedRowId(item.id);
            setSelectedItem(item);
            await fetchRolls(item.id);
        }
    };

    // --- HELPERS ---
    const generateQRUrl = (data) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
    };

    const handlePrintQR = (roll, item) => {
        const printWindow = window.open('', '_blank');
        const qrData = JSON.stringify({
            id: roll.id,
            name: item.item_name,
            color: item.color,
            weight: roll.weight,
            batch: item.batch_number
        });

        printWindow.document.write(`
         <html>
           <head>
             <title>Print QR - ${roll.roll_number}</title>
             <style>
               body { font-family: sans-serif; text-align: center; padding: 20px; }
               .ticket { border: 2px dashed #000; padding: 20px; display: inline-block; margin: 10px; border-radius: 10px; }
               .label { font-size: 12px; font-weight: bold; margin-bottom: 5px; }
               .value { font-size: 16px; margin-bottom: 10px; }
             </style>
           </head>
           <body>
             <div class="ticket">
               <h2>${item.item_name}</h2>
               <img src="${generateQRUrl(qrData)}" width="150" height="150" />
               <div style="margin-top: 10px;">
                  <div class="label">Partiya / Rang</div>
                  <div class="value">${item.batch_number || '-'} / ${item.color}</div>
                  <div class="label">Poy Raqami</div>
                  <div class="value">${roll.roll_number}</div>
                  <div class="label">Og'irlik</div>
                  <div class="value" style="font-size: 24px; font-weight: bold;">${roll.weight} kg</div>
               </div>
             </div>
             <script>window.print();</script>
           </body>
         </html>
       `);
        printWindow.document.close();
    };

    const handlePrintAllRolls = (item, rolls) => {
        const printWindow = window.open('', '_blank');
        const content = rolls.map(roll => {
            const qrData = JSON.stringify({
                id: roll.id,
                name: item.item_name,
                color: item.color,
                weight: roll.weight,
                batch: item.batch_number
            });

            return `
             <div class="ticket">
               <h2>${item.item_name}</h2>
               <img src="${generateQRUrl(qrData)}" width="150" height="150" />
               <div style="margin-top: 10px;">
                  <div class="label">Partiya / Rang</div>
                  <div class="value">${item.batch_number || '-'} / ${item.color}</div>
                  <div class="label">Poy Raqami</div>
                  <div class="value">${roll.roll_number}</div>
                  <div class="label">Og'irlik</div>
                  <div class="value" style="font-size: 24px; font-weight: bold;">${roll.weight} kg</div>
               </div>
             </div>
            `;
        }).join('');

        printWindow.document.write(`
         <html>
           <head>
             <title>Print All Rolls - ${item.batch_number}</title>
             <style>
               body { font-family: sans-serif; text-align: center; padding: 20px; }
               .ticket { border: 2px dashed #000; padding: 20px; display: inline-block; margin: 10px; border-radius: 10px; page-break-inside: avoid; }
               .label { font-size: 12px; font-weight: bold; margin-bottom: 5px; color: #333; }
               .value { font-size: 16px; margin-bottom: 10px; }
               h2 { font-size: 18px; margin: 0 0 10px 0; }
             </style>
           </head>
           <body>
             ${content}
             <script>window.print();</script>
           </body>
         </html>
       `);
        printWindow.document.close();
    }

    const fetchHistory = async (itemId) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('inventory_logs')
            .select('*')
            .eq('inventory_id', itemId)
            .order('created_at', { ascending: false });

        if (!error) {
            setItemHistory(data);
        }
        setLoading(false);
    };

    // --- ACTIONS ---
    const handleKirim = async (e) => {
        e.preventDefault();
        let newInventoryId = null;

        try {
            setLoading(true);
            const ref = references.find(r => r.id == inboundData.reference_id);
            // Relaxed validation: allow custom name
            if (!inboundData.selected_material_name) {
                alert("Xatolik: Mato nomi kiritilmadi.");
                setLoading(false);
                return;
            }

            const cleanName = inboundData.selected_material_name.trim();
            const cleanColor = inboundData.color.trim();
            const cleanBatch = inboundData.batch_number.trim();
            const cleanColorCode = inboundData.color_code.trim();

            // 1. Check or Create Inventory Item
            const { data: existing, error: fetchError } = await supabase
                .from('inventory')
                .select('*')
                .eq('item_name', cleanName)
                .eq('color', cleanColor)
                .eq('category', 'Mato')
                .eq('batch_number', cleanBatch)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (existing) {
                const newQty = Number(existing.quantity || 0) + Number(inboundData.quantity);
                const { error: updErr } = await supabase.from('inventory').update({
                    quantity: newQty,
                    last_updated: new Date(),
                    color_code: cleanColorCode || existing.color_code
                }).eq('id', existing.id);
                if (updErr) throw updErr;
                newInventoryId = existing.id;
            } else {
                const { data: created, error: createError } = await supabase
                    .from('inventory')
                    .insert([{
                        item_name: cleanName,
                        category: 'Mato',
                        quantity: Number(inboundData.quantity),
                        unit: 'kg', // Default to kg
                        color: cleanColor,
                        color_code: cleanColorCode,
                        batch_number: cleanBatch,
                        reference_id: inboundData.reference_id || null, // Optional if just name used
                        last_updated: new Date()
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                if (!created) throw new Error("Failed to create inventory item");
                newInventoryId = created.id;
            }

            // 2. Log History
            const specsStr = `Type: ${inboundData.type_specs || '-'}, ${inboundData.grammage || '-'}gr, ${inboundData.width || '-'}sm`;
            const finalNote = `${inboundData.note || 'Yangi kirim'} | ${specsStr}`;

            const { error: logError } = await supabase.from('inventory_logs').insert([{
                inventory_id: newInventoryId,
                type: 'In',
                quantity: Number(inboundData.quantity),
                reason: finalNote,
                batch_number: cleanBatch
            }]);

            if (logError) throw logError;

            // 3. Create Rolls with Sequence Logic
            if (inboundData.rolls.length > 0) {
                try {
                    // Get current count for this inventory to start sequence
                    const { count, error: countError } = await supabase
                        .from('inventory_rolls')
                        .select('*', { count: 'exact', head: true })
                        .eq('inventory_id', newInventoryId);

                    if (countError) throw countError;

                    const startIdx = (count || 0) + 1;

                    const rollsToInsert = inboundData.rolls.map((r, idx) => ({
                        inventory_id: newInventoryId,
                        roll_number: `${cleanBatch}-${startIdx + idx}`, // 10420-1, 10420-2...
                        weight: Number(r.weight),
                        status: 'in_stock'
                    }));

                    const { error: rollError } = await supabase.from('inventory_rolls').insert(rollsToInsert);
                    if (rollError) throw rollError;

                } catch (rollEx) {
                    // Compensating Transaction: Rollback inventory creation if rolls fail
                    console.error("Roll insertion failed, rolling back inventory...", rollEx);

                    // Only rollback if we created a NEW item (to avoid deleting existing data on update)
                    if (!existing && newInventoryId) {
                        await supabase.from('inventory_logs').delete().eq('inventory_id', newInventoryId);
                        await supabase.from('inventory').delete().eq('id', newInventoryId);
                    }
                    throw new Error("Rulonlarni saqlashda xatolik: " + rollEx.message + " (Amal bekor qilindi)");
                }
            }

            setShowInboundModal(false);
            setInboundData({
                date: new Date().toISOString().split('T')[0],
                selected_material_name: '',
                reference_id: '',
                color: '',
                color_code: '',
                batch_number: '',
                quantity: '',
                type_specs: '',
                grammage: '',
                width: '',
                note: '',
                rolls: []
            });

            await onRefresh();
            alert("Mato muvaffaqiyatli qabul qilindi!");

        } catch (error) {
            console.error(error);
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

            // 1. Checks
            if (Number(outboundData.quantity) > Number(item.quantity)) {
                alert('Omborda yetarli mato yo\'q!');
                setLoading(false);
                return;
            }

            // 2. Rolls Update
            if (outboundData.selected_rolls.length > 0) {
                const rollIds = outboundData.selected_rolls.map(r => r.id);
                const { error } = await supabase.from('inventory_rolls')
                    .update({ status: 'used' })
                    .in('id', rollIds);

                if (error) throw error;
            }

            // 3. Inventory Update
            const newQty = Number(item.quantity) - Number(outboundData.quantity);
            await supabase.from('inventory').update({ quantity: newQty, last_updated: new Date() }).eq('id', item.id);

            // 4. Log
            let finalReason = outboundData.reason;
            if (outboundData.order_id) {
                const ord = orders.find(o => o.id == outboundData.order_id);
                if (ord) finalReason += ` (Buyurtma: #${ord.order_number})`;
            }

            await supabase.from('inventory_logs').insert([{
                inventory_id: item.id,
                type: 'Out',
                quantity: Number(outboundData.quantity),
                reason: finalReason,
                batch_number: item.batch_number
            }]);

            alert('Chiqim bajarildi!');
            setShowOutboundModal(false);
            setOutboundData({ inventory_id: '', inventory_name: '', quantity: '', order_id: '', reason: 'Kesimga', selected_rolls: [] });
            onRefresh();

            // Refresh expanded row data if needed
            if (expandedRowId === item.id) {
                fetchRolls(item.id);
            }

        } catch (error) {
            alert('Xatolik: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setEditData({
            item_name: item.item_name || '',
            color: item.color || '',
            color_code: item.color_code || '',
            batch_number: item.batch_number || '',
            quantity: item.quantity || 0
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            // Calculate difference for logging if quantity changed
            const oldQty = Number(selectedItem.quantity || 0);
            const newQty = Number(editData.quantity || 0);
            const diff = newQty - oldQty;

            // Update Inventory
            const { error: updateError } = await supabase
                .from('inventory')
                .update({
                    item_name: editData.item_name,
                    color: editData.color,
                    color_code: editData.color_code,
                    batch_number: editData.batch_number,
                    quantity: newQty,
                    last_updated: new Date()
                })
                .eq('id', selectedItem.id);

            if (updateError) throw updateError;

            // Log if quantity changed significantly
            if (Math.abs(diff) > 0.001) {
                await supabase.from('inventory_logs').insert([{
                    inventory_id: selectedItem.id,
                    type: diff > 0 ? 'In' : 'Out', // Or specific type 'Correction' if you prefer, but In/Out keeps balance mostly sane
                    quantity: Math.abs(diff),
                    reason: `Tahrir (Correction): ${oldQty} -> ${newQty}`,
                    batch_number: editData.batch_number
                }]);
            }

            alert("Muvaffaqiyatli saqlandi!");
            setShowEditModal(false);
            onRefresh();

        } catch (error) {
            console.error("Edit Error:", error);
            alert("Saqlashda xatolik: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
        try {
            setLoading(true);
            // Delete material requests FIRST
            await supabase.from('material_requests').delete().eq('inventory_id', item.id);

            await supabase.from('inventory_logs').delete().eq('inventory_id', item.id);
            await supabase.from('inventory_rolls').delete().eq('inventory_id', item.id);
            await supabase.from('inventory').delete().eq('id', item.id);
            onRefresh();
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header - Dynamic based on selection */}
            {selectedIds.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-rose-500/10 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-rose-500/20 shadow-2xl animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-rose-500">{selectedIds.length} ta Tanlandi</h3>
                            <p className="text-xs font-bold text-rose-400/70 uppercase tracking-widest">O'chirish uchun tayyor</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setSelectedIds([])}
                            className="flex-1 md:flex-none px-6 py-4 rounded-2xl border border-rose-500/20 text-rose-500 font-bold hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2"
                        >
                            <X size={18} /> Bekor qilish
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="flex-1 md:flex-none bg-rose-500 text-white px-8 py-4 rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} /> O'chirish
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--bg-card)] backdrop-blur-3xl p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={20} />
                        <input
                            type="text"
                            placeholder="Qidirish... (ID, Partiya, Rang)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl outline-none text-[var(--text-primary)] font-bold transition-all shadow-inner focus:border-indigo-500/50"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="px-6 py-4 rounded-2xl border border-[var(--border-color)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-card-hover)] transition-all">Filtrlar</button>
                        <button
                            onClick={() => setShowInboundModal(true)}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 font-black uppercase text-xs tracking-widest border border-indigo-400/20 flex items-center gap-2"
                        >
                            <Plus size={18} /> Mato Kirimi
                        </button>
                    </div>
                </div>
            )}

            {/* Main Table */}
            <div className={`overflow-hidden bg-[var(--bg-card)] backdrop-blur-3xl rounded-3xl border border-[var(--border-color)] shadow-2xl min-h-[500px]`}>
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[var(--bg-sidebar-footer)] text-[var(--text-secondary)] text-[11px] font-black uppercase tracking-wider border-b border-[var(--border-color)]">
                        <tr>
                            <th className="px-6 py-5 text-center w-12">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded-lg bg-[var(--input-bg)] border-[var(--border-color)] checked:bg-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                                    checked={selectedIds.length === filteredInventory.length && filteredInventory.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="px-6 py-5">Sana / ID</th>
                            <th className="px-6 py-5">Mato Turi</th>
                            <th className="px-6 py-5">Rang</th>
                            <th className="px-6 py-5">Turi</th>
                            <th className="px-6 py-5">Partiya</th>
                            <th className="px-6 py-5 text-center">Rulonlar</th>
                            <th className="px-6 py-5 text-right">Jami Og'irlik</th>
                            <th className="px-6 py-5 text-center">Amallar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {filteredInventory.map(item => {
                            const isExpanded = expandedRowId === item.id;
                            const isSelected = selectedIds.includes(item.id);
                            const ref = references?.find(r => r.id === item.reference_id) || {};
                            // Safe defaults
                            const typeStr = item.material_types?.thread_type || ref.thread_type || 'Suprem 30/1';
                            const specs = ref.grammage ? `${ref.grammage}gr | ${ref.width || '-'}sm` : (item.material_types?.grammage ? `${item.material_types.grammage}gr` : '-');

                            // Fix Date Display - fallback to last_updated if created_at is missing
                            const dateDisplay = item.created_at
                                ? new Date(item.created_at).toLocaleDateString('ru-RU')
                                : (item.last_updated ? new Date(item.last_updated).toLocaleDateString('ru-RU') : '-');

                            return (
                                <React.Fragment key={item.id}>
                                    <tr className={`transition-all group ${isSelected ? 'bg-indigo-500/5' : (isExpanded ? 'bg-[var(--bg-card-hover)]' : 'hover:bg-[var(--bg-card-hover)]')}`}>
                                        <td className="px-6 py-5 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg bg-[var(--input-bg)] border-[var(--border-color)] checked:bg-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                                                checked={isSelected}
                                                onChange={() => handleSelectRow(item.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-[var(--text-primary)] text-sm mb-1">{dateDisplay}</div>
                                            <div className="text-[10px] text-[var(--text-secondary)] font-mono uppercase">MAT-{item.id}</div>
                                        </td>
                                        <td className="px-6 py-5 font-black text-[var(--text-primary)] text-sm">{item.item_name}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-full border border-[var(--border-color)] shadow-sm"
                                                    style={{ backgroundColor: item.color_code || '#ccc' }}
                                                ></div>
                                                <div>
                                                    <div className="font-bold text-[var(--text-primary)] text-xs">{item.color}</div>
                                                    <div className="text-[10px] text-[var(--text-secondary)] opacity-70">{item.color_code || '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-[var(--text-primary)] text-xs">{typeStr}</div>
                                            <div className="text-[10px] text-[var(--text-secondary)] opacity-70 mt-0.5">{specs}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="bg-[var(--bg-body)] text-[var(--text-primary)] font-mono text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                                                {item.batch_number || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex justify-center flex-col items-center">
                                                <button onClick={() => toggleRow(item)} className="text-indigo-400 hover:text-indigo-300 font-bold text-xs flex items-center gap-1">
                                                    <ScrollText size={14} /> RO'YXAT
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="font-black text-indigo-400 text-lg">{item.quantity}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => {
                                                    setSelectedItem(item);
                                                    toggleRow(item);
                                                }} className="p-2 text-[var(--text-secondary)] hover:text-indigo-400 transition-colors"><QrCode size={16} /></button>
                                                <button onClick={() => {
                                                    setSelectedItem(item);
                                                    fetchHistory(item.id);
                                                    setShowHistoryModal(true);
                                                }} className="p-2 text-[var(--text-secondary)] hover:text-sky-400 transition-colors"><History size={16} /></button>
                                                <button onClick={() => handleEdit(item)} className="p-2 text-[var(--text-secondary)] hover:text-amber-400 transition-colors"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(item)} className="p-2 text-[var(--text-secondary)] hover:text-rose-400 transition-colors"><Trash2 size={16} /></button>
                                                <button
                                                    onClick={() => toggleRow(item)}
                                                    className={`p-2 rounded-xl border border-[var(--border-color)] transition-all ${isExpanded ? 'bg-indigo-600 text-white border-indigo-600' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-body)]'}`}
                                                >
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* EXPANDED ROW */}
                                    {isExpanded && (
                                        <tr className="bg-[var(--bg-body)]/50 transition-all">
                                            <td colSpan="9" className="p-6 border-b border-[var(--border-color)]">
                                                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
                                                    <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-body)]">
                                                        <div className="flex items-center gap-3">
                                                            <ScrollText size={18} className="text-indigo-400" />
                                                            <h4 className="font-bold text-sm text-[var(--text-primary)]">Rulonlar Ro'yxati</h4>
                                                        </div>
                                                        <span className="text-xs text-[var(--text-secondary)] font-bold">Jami: {itemRolls.length} ta rulon</span>
                                                    </div>

                                                    <table className="w-full text-left text-sm">
                                                        <thead className="text-[10px] uppercase text-[var(--text-secondary)] font-bold border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                                                            <tr>
                                                                <th className="px-6 py-3">ID Raqam</th>
                                                                <th className="px-6 py-3 text-right">Og'irlik (Kg)</th>
                                                                <th className="px-6 py-3 text-center">Holati</th>
                                                                <th className="px-6 py-3 text-right">QR Kod</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-[var(--border-color)]">
                                                            {loading ? (
                                                                <tr><td colSpan="4" className="p-8 text-center text-[var(--text-secondary)]">Yuklanmoqda...</td></tr>
                                                            ) : itemRolls.length === 0 ? (
                                                                <tr><td colSpan="4" className="p-8 text-center text-[var(--text-secondary)]">Poylar mavjud emas</td></tr>
                                                            ) : (
                                                                itemRolls.map(roll => (
                                                                    <tr key={roll.id} className="hover:bg-[var(--bg-card-hover)]">
                                                                        <td className="px-6 py-3 font-mono font-bold text-[var(--text-primary)]">{roll.roll_number}</td>
                                                                        <td className="px-6 py-3 text-right font-medium">{roll.weight}</td>
                                                                        <td className="px-6 py-3 text-center">
                                                                            <div className="flex items-center justify-center gap-3">
                                                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${roll.status === 'used'
                                                                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                                                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                                                    }`}>
                                                                                    {roll.status === 'used' ? 'Ishlatilgan' : 'Omborda'}
                                                                                </span>
                                                                                {roll.status !== 'used' && (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setOutboundData({
                                                                                                inventory_id: item.id,
                                                                                                quantity: roll.weight, // Preset weight
                                                                                                inventory_name: item.item_name,
                                                                                                selected_rolls: [roll],
                                                                                                reason: 'Kesimga'
                                                                                            });
                                                                                            setShowOutboundModal(true);
                                                                                        }}
                                                                                        className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-2 py-1 rounded border border-amber-500/20 text-[10px] font-bold uppercase transition-colors"
                                                                                    >
                                                                                        <ArrowUpRight size={10} /> Chiqim
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-3 text-right">
                                                                            <button onClick={() => handlePrintQR(roll, item)} className="text-[var(--text-secondary)] hover:text-indigo-400 transition-colors"><QrCode size={16} /></button>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>

                                                    <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-body)] flex justify-end">
                                                        <button
                                                            onClick={() => handlePrintAllRolls(item, itemRolls)}
                                                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20 transition-all"
                                                        >
                                                            <Printer size={16} /> Barcha Rulonlarni Chop Etish
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* INBOUND MODAL (Redesigned) */}
            {showInboundModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-[2rem] shadow-2xl relative custom-scrollbar">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)] z-10">
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Material Kirim Qilish</h3>
                            <button onClick={() => setShowInboundModal(false)} className="text-[var(--text-secondary)] hover:text-white"><Trash2 size={20} className="rotate-45" /></button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Left: Form */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 uppercase tracking-widest">Partiya Ma'lumotlari</h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Sana (Avtomatik)</label>
                                            <input
                                                type="date"
                                                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 font-bold"
                                                value={inboundData.date}
                                                onChange={e => setInboundData({ ...inboundData, date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Partiya Raqami</label>
                                            <input
                                                type="text"
                                                placeholder="Masalan: 10525"
                                                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 font-bold"
                                                value={inboundData.batch_number}
                                                onChange={e => setInboundData({ ...inboundData, batch_number: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Mato Turi</label>
                                            <div className="relative">
                                                <input
                                                    list="mato-suggestions"
                                                    placeholder="Tanlang yoki yozing..."
                                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 font-bold"
                                                    value={inboundData.selected_material_name}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        const found = (references || []).find(r => r.name === val);
                                                        setInboundData({
                                                            ...inboundData,
                                                            selected_material_name: val,
                                                            reference_id: found ? found.id : inboundData.reference_id
                                                        });
                                                    }}
                                                />
                                                <datalist id="mato-suggestions">
                                                    {[...new Set((references || []).filter(r => r.type === 'Mato').map(r => r.name))].map(n => <option key={n} value={n} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Turi / Gramaj / Eni</label>
                                            <input
                                                type="text"
                                                placeholder="Turi (30/1)"
                                                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 mb-2 font-bold"
                                                value={inboundData.type_specs}
                                                onChange={e => setInboundData({ ...inboundData, type_specs: e.target.value })}
                                            />
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number" placeholder="240"
                                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 pr-8 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 font-bold"
                                                        value={inboundData.grammage}
                                                        onChange={e => setInboundData({ ...inboundData, grammage: e.target.value })}
                                                    />
                                                    <span className="absolute right-3 top-3 text-xs text-[var(--text-secondary)] font-bold">gr</span>
                                                </div>
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number" placeholder="185"
                                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 pr-8 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 font-bold"
                                                        value={inboundData.width}
                                                        onChange={e => setInboundData({ ...inboundData, width: e.target.value })}
                                                    />
                                                    <span className="absolute right-3 top-3 text-xs text-[var(--text-secondary)] font-bold">sm</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Rang va Kod</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Rang nomi (Oq, Qora)"
                                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 font-bold"
                                                    value={inboundData.color}
                                                    onChange={e => setInboundData({ ...inboundData, color: e.target.value })}
                                                />
                                                <input
                                                    type="color"
                                                    className="w-12 h-11 rounded-xl bg-transparent border border-[var(--border-color)] cursor-pointer p-1"
                                                    value={inboundData.color_code || '#000000'}
                                                    onChange={e => setInboundData({ ...inboundData, color_code: e.target.value })}
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Panton / Kod (#1A2B3C)"
                                                className="w-full mt-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 font-mono font-bold"
                                                value={inboundData.color_code}
                                                onChange={e => setInboundData({ ...inboundData, color_code: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Izoh</label>
                                            <textarea
                                                placeholder="Kesimdan qayti, Tasnifdan qayti..."
                                                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 h-24 resize-none font-bold"
                                                value={inboundData.note}
                                                onChange={e => setInboundData({ ...inboundData, note: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Rolls */}
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Rulonlar Hisobi</h4>
                                    <div className="flex gap-4 text-xs font-mono text-[var(--text-secondary)]">
                                        <span>Jami Rulon: <b className="text-[var(--text-primary)] text-sm">{inboundData.rolls.length}</b></span>
                                        <span>Jami Kg: <b className="text-[var(--text-primary)] text-sm">{inboundData.quantity || 0}</b></span>
                                    </div>
                                </div>

                                <div className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-3xl p-6 relative flex flex-col items-center justify-center min-h-[400px]">
                                    {inboundData.rolls.length === 0 ? (
                                        <div className="text-center text-[var(--text-secondary)] opacity-50">
                                            <Warehouse size={64} className="mx-auto mb-4 opacity-50" />
                                            <p className="text-sm font-bold">Rulonlar sonini kiriting</p>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full absolute inset-0 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-3 content-start custom-scrollbar">
                                            {inboundData.rolls.map((r, i) => (
                                                <div key={i} className="relative bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-xl flex flex-col items-center shadow-lg group">
                                                    <span className="text-[10px] text-[var(--text-secondary)] mb-1 font-bold">RULON {i + 1}</span>
                                                    <input
                                                        autoFocus={i === inboundData.rolls.length - 1}
                                                        type="number"
                                                        className="w-full text-center bg-transparent font-black text-xl outline-none text-[var(--text-primary)]"
                                                        value={r.weight}
                                                        placeholder="0"
                                                        onChange={e => {
                                                            const newRolls = [...inboundData.rolls];
                                                            newRolls[i].weight = e.target.value;
                                                            const sum = newRolls.reduce((a, b) => a + Number(b.weight), 0);
                                                            setInboundData({ ...inboundData, rolls: newRolls, quantity: sum.toFixed(2) });
                                                        }}
                                                    />
                                                    <span className="text-[10px] text-[var(--text-secondary)]">kg</span>
                                                    <button
                                                        onClick={() => {
                                                            const newRolls = inboundData.rolls.filter((_, idx) => idx !== i);
                                                            const sum = newRolls.reduce((a, b) => a + Number(b.weight), 0);
                                                            setInboundData({ ...inboundData, rolls: newRolls, quantity: sum.toFixed(2) });
                                                        }}
                                                        className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full text-white text-[10px] flex items-center justify-center hover:scale-110 transition-transform font-bold opacity-0 group-hover:opacity-100">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick Add Overlay */}
                                    {inboundData.rolls.length === 0 && (
                                        <div className="absolute bottom-6 flex gap-2">
                                            <button onClick={() => setInboundData({ ...inboundData, rolls: [...inboundData.rolls, { weight: '' }] })} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-500 transition-all">
                                                + Start Adding
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => setInboundData({ ...inboundData, rolls: [...inboundData.rolls, { weight: '' }] })}
                                        className="flex-1 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--bg-card-hover)] transition-all shadow-sm"
                                    >
                                        + Rulon qo'shish
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[var(--border-color)] flex justify-end gap-3 bg-[var(--bg-card)] sticky bottom-0 z-10">
                            <button onClick={() => setShowInboundModal(false)} className="px-6 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--bg-card-hover)]">Bekor qilish</button>
                            <button onClick={handleKirim} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2">
                                <Plus size={16} /> Kiritish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Outbound Modal (Simplified Reuse) */}
            {showOutboundModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-2xl rounded-[3rem] p-8 relative shadow-2xl">
                        <button onClick={() => setShowOutboundModal(false)} className="absolute top-8 right-8 p-2 bg-[var(--bg-body)] rounded-full text-[var(--text-secondary)] hover:text-rose-500 transition-colors"><Trash2 size={20} className="rotate-45" /></button>
                        <h3 className="text-2xl font-black mb-1 text-[var(--text-primary)]">Chiqim Qilish</h3>
                        <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-6">Tanlangan rulonlar asosida</p>

                        <form onSubmit={handleChiqim} className="space-y-6">
                            <div className="bg-[var(--bg-body)] p-6 rounded-2xl border border-[var(--border-color)]">
                                <div className="text-[10px] uppercase font-black text-[var(--text-secondary)] mb-2">Tanlangan Rulonlar:</div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {outboundData.selected_rolls.map(r => (
                                        <span key={r.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] px-2 py-1 rounded text-xs font-bold">{r.roll_number} ({r.weight}kg)</span>
                                    ))}
                                </div>
                                <div className="flex justify-between items-end border-t border-[var(--border-color)] pt-4">
                                    <span className="font-bold text-sm">Jami Og'irlik:</span>
                                    <span className="text-3xl font-black text-[var(--text-primary)]">{outboundData.quantity} <span className="text-sm text-[var(--text-secondary)]">kg</span></span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase mb-2 text-[var(--text-secondary)]">Sabab / Qayerga</label>
                                <textarea
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-4 font-bold text-[var(--text-primary)] outline-none focus:border-rose-500 min-h-[100px]"
                                    value={outboundData.reason}
                                    onChange={e => setOutboundData({ ...outboundData, reason: e.target.value })}
                                    placeholder="Masalan: Kesim bo'limiga"
                                />
                            </div>
                            <button className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black uppercase shadow-lg shadow-rose-600/30 transition-all active:scale-95">Tasdiqlash</button>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal (Minimalist Reuse) */}
            {showHistoryModal && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-[2rem] shadow-2xl relative animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] shrink-0">
                            <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                                <History size={24} className="text-indigo-500" />
                                Tarix: <span className="text-[var(--text-secondary)] font-medium text-lg ml-2">{selectedItem.item_name}</span>
                            </h3>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="w-10 h-10 rounded-full bg-[var(--bg-body)] text-[var(--text-secondary)] hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Summary Stats */}
                        <div className="p-6 grid grid-cols-3 gap-4 bg-[var(--bg-body)]/50 shrink-0">
                            {(() => {
                                const totalIn = itemHistory.filter(h => h.type === 'In').reduce((a, b) => a + Number(b.quantity), 0);
                                const totalOut = itemHistory.filter(h => h.type === 'Out').reduce((a, b) => a + Number(b.quantity), 0);
                                const currentBalance = totalIn - totalOut;

                                return (
                                    <>
                                        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Jami Kirim</div>
                                            <div className="text-2xl font-black text-[var(--text-primary)]">+{totalIn.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">kg</span></div>
                                        </div>
                                        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Jami Chiqim</div>
                                            <div className="text-2xl font-black text-[var(--text-primary)]">-{totalOut.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">kg</span></div>
                                        </div>
                                        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Joriy Qoldiq</div>
                                            <div className="text-2xl font-black text-[var(--text-primary)]">{currentBalance.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">kg</span></div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* History List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {itemHistory.length === 0 ? (
                                <div className="text-center py-10 flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-60">
                                    <History size={48} className="mb-4 stroke-1" />
                                    <p className="font-bold">Hozircha tarix mavjud emas</p>
                                </div>
                            ) : itemHistory.map(h => (
                                <div key={h.id} className="group flex justify-between items-center bg-[var(--bg-body)] hover:bg-[var(--bg-card-hover)] p-4 rounded-2xl border border-[var(--border-color)] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${h.type === 'In' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {h.type === 'In' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-wide mb-0.5">
                                                {new Date(h.created_at).toLocaleString('ru-RU')}
                                            </div>
                                            <div className="text-sm font-bold text-[var(--text-primary)]">{h.reason || (h.type === 'In' ? 'Kirim' : 'Chiqim')}</div>
                                            {h.batch_number && <div className="text-[10px] text-[var(--text-secondary)] font-mono mt-1 bg-[var(--bg-card)] inline-block px-2 py-0.5 rounded border border-[var(--border-color)]">Partiya: {h.batch_number}</div>}
                                        </div>
                                    </div>
                                    <div className={`text-lg font-black ${h.type === 'In' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {h.type === 'In' ? '+' : '-'}{h.quantity} <span className="text-xs text-[var(--text-secondary)] font-bold">kg</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative">
                        <button onClick={() => setShowEditModal(false)} className="absolute top-6 right-6 p-2 bg-[var(--bg-body)] rounded-full text-[var(--text-secondary)] hover:text-white"><X size={20} /></button>
                        <h3 className="text-2xl font-black text-[var(--text-primary)] mb-1">Tahrirlash</h3>
                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-6">Mato ma'lumotlarini o'zgartirish</p>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Mato Nomi</label>
                                <input
                                    type="text"
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-[var(--text-primary)] focus:border-indigo-500 outline-none"
                                    value={editData.item_name}
                                    onChange={e => setEditData({ ...editData, item_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Rang</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-[var(--text-primary)] focus:border-indigo-500 outline-none"
                                        value={editData.color}
                                        onChange={e => setEditData({ ...editData, color: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Rang Kodi</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            className="w-12 h-11 rounded-xl bg-transparent border border-[var(--border-color)] cursor-pointer p-1"
                                            value={editData.color_code || '#000000'}
                                            onChange={e => setEditData({ ...editData, color_code: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-[var(--text-primary)] focus:border-indigo-500 outline-none"
                                            value={editData.color_code}
                                            onChange={e => setEditData({ ...editData, color_code: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Partiya Raqami</label>
                                <input
                                    type="text"
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-[var(--text-primary)] focus:border-indigo-500 outline-none"
                                    value={editData.batch_number}
                                    onChange={e => setEditData({ ...editData, batch_number: e.target.value })}
                                />
                                <p className="text-[10px] text-amber-500 mt-1 font-bold">Ogohlantirish: Partiya raqamini o'zgartirish rulonlarning seriya raqamiga ta'sir qilmaydi.</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Jami Og'irlik (Kg)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 font-black text-xl text-indigo-400 focus:border-indigo-500 outline-none"
                                    value={editData.quantity}
                                    onChange={e => setEditData({ ...editData, quantity: e.target.value })}
                                />
                                <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-bold">Qo'lda kiritilgan o'zgarishlar "Correction (Tahrir)" sifatida saqlanadi.</p>
                            </div>

                            <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 mt-4">
                                Saqlash
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatoOmbori;
