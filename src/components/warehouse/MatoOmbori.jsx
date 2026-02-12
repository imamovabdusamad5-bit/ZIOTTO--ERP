import React, { useState } from 'react';
import {
    Warehouse, Search, Plus, History, CircleArrowDown,
    ArrowUpRight, ScrollText, QrCode, Printer, Trash2, CircleCheck, RotateCcw
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../../lib/supabase';

const MatoOmbori = ({ inventory, references, orders, onRefresh, viewMode }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showInboundModal, setShowInboundModal] = useState(false);
    const [showOutboundModal, setShowOutboundModal] = useState(false);
    const [showRollsModal, setShowRollsModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemRolls, setItemRolls] = useState([]);

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
        reason: 'Kesimga (Ishlab chiqarishga)',
        selected_rolls: []
    });

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [itemHistory, setItemHistory] = useState([]);

    // --- HELPERS ---
    const generateQRUrl = (data) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
    };

    const fetchHistory = async (itemId) => {
        setLoading(true);
        // Fetch logs for this item
        const { data, error } = await supabase
            .from('inventory_logs')
            .select('*')
            .eq('inventory_id', itemId)
            .order('created_at', { ascending: false });

        if (!error) {
            setItemHistory(data);
        } else {
            console.error("History fetch error:", error);
        }
        setLoading(false);
    };

    const fetchRolls = async (inventoryId) => {
        const { data, error } = await supabase
            .from('inventory_rolls')
            .select('*')
            .eq('inventory_id', inventoryId)
            // .eq('status', 'in_stock') // Optionally filter
            .order('created_at', { ascending: true });

        if (!error) setItemRolls(data || []);
    };

    const handleOpenRolls = async (item) => {
        setSelectedItem(item);
        setLoading(true);
        await fetchRolls(item.id);
        setShowRollsModal(true);
        setLoading(false);
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

    // --- QR SCANNER LOGIC ---
    // Buffer to hold scanner input
    const [scanBuffer, setScanBuffer] = useState('');
    const [lastKeyTime, setLastKeyTime] = useState(0);

    React.useEffect(() => {
        const handleKeyDown = async (e) => {
            // Scanner acts like keyboard. We determine if it's scanner by speed of typing or specific prefix/suffix if configured.
            // Simple buffer logic:
            const currentTime = Date.now();
            const char = e.key;

            // If time between keys is long (e.g. > 50ms), it's likely manual typing, so reset buffer
            if (currentTime - lastKeyTime > 50) {
                setScanBuffer(char);
            } else {
                setScanBuffer(prev => prev + char);
            }
            setLastKeyTime(currentTime);

            // If "Enter" is pressed, try to parse the buffer as JSON
            if (char === 'Enter') {
                try {
                    // Clean buffer from potential 'Shift' or other non-char keys if any
                    // Usually scanners send exact string + Enter.
                    // Our QR format: {"id":..., "w":...}
                    // We need to trim just in case
                    const rawData = scanBuffer.trim();
                    // Some scanners might send 'Shift' chars if configured wrong, but let's assume valid JSON string first.

                    // Allow simple ID scan if JSON fails? No, our QR is JSON.
                    if (rawData.startsWith('{') && rawData.endsWith('}')) {
                        const parsed = JSON.parse(rawData);
                        if (parsed.id && parsed.w) {
                            handleScannedRoll(parsed);
                        }
                    } else if (rawData.includes('"id":')) {
                        // Robustness: Sometimes buffer might have garbage at start
                        const start = rawData.indexOf('{');
                        const end = rawData.lastIndexOf('}');
                        if (start > -1 && end > -1) {
                            const clean = rawData.substring(start, end + 1);
                            const parsed = JSON.parse(clean);
                            handleScannedRoll(parsed);
                        }
                    }
                    setScanBuffer(''); // Reset after process
                } catch (err) {
                    // Not a valid JSON or scanner error, ignore manual Enter presses
                    // console.log("Scan parse error", err); 
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scanBuffer, lastKeyTime, outboundData, showOutboundModal, itemRolls]);


    const handleScannedRoll = async (qrData) => {
        // qrData = { id: 123, w: 25.5 }

        // Scenario 1: Outbound Modal is OPEN
        if (showOutboundModal) {
            // Check if roll is already selected
            const exists = outboundData.selected_rolls.find(r => r.id == qrData.id);
            if (exists) {
                alert(`Bu poy allaqachon ro'yxatda bor! (${qrData.w} kg)`);
                return;
            }

            // We need full roll object. If it's in 'itemRolls' (current view), use it.
            // If not, we might need to fetch it or just use QR data if trusted.
            // Better to find it in itemRolls to ensure it belongs to current Item?
            setLoading(true);

            // 1. Validate if we already have this roll in selected_rolls
            if (outboundData.selected_rolls.find(r => r.id === qrData.id)) {
                alert("Bu poy allaqachon ro'yxatga qo'shilgan!");
                setLoading(false);
                return;
            }

            // 2. We need full roll details. Either we have them in itemRolls (if we opened that item)
            // or we need to fetch from DB.
            // Since this is a global scanner potentially, let's try to find in current itemRolls first
            // If the user hasn't selected an item, fetching is tricky unless we fetch by Roll ID.

            // Let's FETCH by ID to be safe and accurate
            const { data: rollData, error } = await supabase
                .from('inventory_rolls')
                .select('*, inventory(*)')
                .eq('id', qrData.id)
                .single();

            if (error || !rollData) {
                alert("Poy topilmadi yoki xatolik!");
                setLoading(false);
                return;
            }

            // Check status
            if (rollData.status !== 'in_stock') {
                alert(`Poy holati: ${rollData.status}. Faqat omborda bor poyni chiqim qilish mumkin.`);
                setLoading(false);
                return;
            }

            // Add to selection
            const newSelection = [...outboundData.selected_rolls, rollData];
            const totalWeight = newSelection.reduce((sum, r) => sum + Number(r.weight), 0);

            setOutboundData(prev => ({
                ...prev,
                selected_rolls: newSelection,
                quantity: totalWeight.toFixed(2)
            }));

            // Play a beep sound if possible? 
            // Audio context is browser blocked mostly, but we can try basic beep logic or just UI feedback
            setLoading(false);
        } else {
            alert("Iltimos, avval tegishli 'Chiqim' oynasini (Arrow Up Icon) oching, so'ng skanerlang.");
        }
    };

    const handleKirim = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const ref = references.find(r => r.id == inboundData.reference_id);
            if (!ref) {
                alert("Xatolik: Mato turi topilmadi (ID mismatch). Iltimos qaytadan tanlang.");
                setLoading(false);
                return;
            }

            // 1. Check existing
            const cleanName = ref.name.trim();
            const cleanColor = inboundData.color.trim();
            const cleanBatch = inboundData.batch_number.trim();
            const cleanColorCode = inboundData.color_code.trim();

            const { data: existing } = await supabase
                .from('inventory')
                .select('*')
                .eq('item_name', cleanName)
                .eq('color', cleanColor)
                .eq('category', 'Mato')
                .eq('batch_number', cleanBatch)
                .maybeSingle();

            let inventoryId;

            if (existing) {
                const newQty = Number(existing.quantity || 0) + Number(inboundData.quantity);
                const { error: updErr } = await supabase.from('inventory').update({
                    quantity: newQty,
                    last_updated: new Date(),
                    color_code: cleanColorCode || existing.color_code
                }).eq('id', existing.id);
                if (updErr) throw updErr;
                inventoryId = existing.id;
            } else {
                const { data: created, error } = await supabase
                    .from('inventory')
                    .insert([{
                        item_name: cleanName,
                        category: 'Mato',
                        quantity: Number(inboundData.quantity),
                        unit: ref.unit,
                        color: cleanColor,
                        color_code: cleanColorCode,
                        batch_number: cleanBatch,
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
                batch_number: cleanBatch,
                reason: inboundData.reason
            }]);

            // 3. Rolls
            if (inboundData.rolls.length > 0) {
                const rollsToInsert = inboundData.rolls.map((r, idx) => ({
                    inventory_id: inventoryId,
                    roll_number: `R-${Date.now().toString().slice(-6)}-${idx + 1}`, // Unique automated ID
                    weight: Number(r.weight),
                    // status: 'in_stock' // Assuming default or not needed if table strict
                }));
                // Check if table exists, if not this might fail, but assuming user has created it or it exists
                const { error: rollError } = await supabase.from('inventory_rolls').insert(rollsToInsert);
                if (rollError) console.warn("Rolls insert failed (table might be missing):", rollError);
            }

            setShowInboundModal(false);
            setInboundData({ reference_id: '', color: '', color_code: '', batch_number: '', quantity: '', reason: 'Yangi kirim', rolls: [] });

            setTimeout(async () => { await onRefresh(); }, 1000);
            alert("Mato va poylar muvaffaqiyatli qabul qilindi! QR kodlarni chop etishingiz mumkin.");

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

            if (outboundData.selected_rolls.length > 0) {
                // Logic for selected rolls
                // 1. Mark rolls as used
                const rollIds = outboundData.selected_rolls.map(r => r.id);
                // Assuming 'status' column exists or we delete. 
                // If status doesn't exist, we might just delete them or log them.
                // Ideally we update status. Let's try update.
                const { error: rollErr } = await supabase.from('inventory_rolls')
                    .update({ status: 'used' })
                    .in('id', rollIds);

                if (rollErr) {
                    // Fallback: If status column missing, maybe delete? Or just ignore for now.
                    console.warn("Could not update roll status:", rollErr);
                }
            }

            if (Number(outboundData.quantity) > Number(item.quantity)) {
                alert('Omborda yetarli mato yo\'q!');
                setLoading(false);
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
                // Optional: Status update logic
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
            setOutboundData({ inventory_id: '', quantity: '', order_id: '', reason: 'Kesimga', selected_rolls: [] });
            onRefresh();
        } catch (error) {
            alert('Xatolik: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ... existing helpers ...

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Search / Add */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--bg-card)] backdrop-blur-3xl p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-hover:text-indigo-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Mato, rang yoki partiya bo'yicha qidiruv..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl focus:border-indigo-500/50 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none font-bold transition-all shadow-inner hover:bg-[var(--bg-card-hover)]"
                    />
                </div>
                <button
                    onClick={() => setShowInboundModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 font-black uppercase text-xs tracking-widest border border-indigo-400/20"
                >
                    <Plus size={18} /> Yangi Mato Kirimi
                </button>
            </div>

            {/* Content Display */}
            <div className={`overflow-hidden bg-[var(--bg-card)] backdrop-blur-3xl rounded-[3rem] border border-[var(--border-color)] shadow-2xl ${viewMode === 'table' ? 'rounded-xl' : ''}`}>
                <div className="overflow-x-auto">
                    {viewMode === 'table' ? (
                        // EXCEL-LIKE TABLE VIEW
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-[var(--bg-sidebar-footer)] text-[var(--text-secondary)] uppercase tracking-widest text-[10px] font-black border-b border-[var(--border-color)] sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)]">№</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)]">Mato Nomi</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)]">Turi</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)]">Grammaj</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)]">Rangi</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)]">Kodi</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)]">Partiya</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)] text-right">Qoldiq</th>
                                    <th className="px-4 py-3 border-r border-[var(--border-color)] text-center">Birlik</th>
                                    <th className="px-4 py-3 text-center">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {filteredInventory.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-[var(--bg-card-hover)] transition-colors even:bg-[var(--bg-body)]">
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] text-[var(--text-secondary)] font-mono text-xs">{index + 1}</td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] font-bold text-[var(--text-primary)]">{item.item_name}</td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] text-[var(--text-secondary)]">{item.material_types?.thread_type || '-'}</td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] text-[var(--text-secondary)]">{item.material_types?.grammage || '-'}</td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] text-[var(--text-primary)]">{item.color}</td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] font-mono text-xs text-[var(--text-secondary)]">{item.color_code || '-'}</td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] font-mono text-xs text-[var(--text-secondary)]">{item.batch_number || '-'}</td>
                                        <td className={`px-4 py-2 border-r border-[var(--border-color)] text-right font-bold ${Number(item.quantity) < 100 ? 'text-rose-500' : 'text-emerald-500'}`}>{item.quantity}</td>
                                        <td className="px-4 py-2 border-r border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)] uppercase">{item.unit}</td>
                                        <td className="px-2 py-1 text-center">
                                            <div className="flex justify-center gap-1">
                                                <button onClick={() => handleOpenRolls(item)} className="p-1.5 hover:bg-indigo-50 text-indigo-500 rounded"><QrCode size={16} /></button>
                                                <button onClick={() => {
                                                    setSelectedItem(item);
                                                    fetchHistory(item.id);
                                                    setShowHistoryModal(true);
                                                }} className="p-1.5 hover:bg-sky-50 text-sky-500 rounded" title="Tarix va Statistika"><History size={16} /></button>

                                                <button onClick={() => {
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
                                                }} className="p-1.5 hover:bg-amber-50 text-amber-500 rounded" title="Qaytim Qilish"><RotateCcw size={16} /></button>
                                                <button onClick={() => {
                                                    setOutboundData({
                                                        inventory_id: item.id,
                                                        quantity: '',
                                                        order_id: '',
                                                        reason: 'Kesimga',
                                                        selected_rolls: []
                                                    });
                                                    fetchRolls(item.id).then(() => setShowOutboundModal(true));
                                                }} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded"><ArrowUpRight size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        // STANDARD / CARD VIEW
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[var(--bg-body)] text-[var(--text-secondary)] uppercase tracking-widest text-[10px] font-black border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="px-8 py-6">Mato Nomi / Turi</th>
                                    <th className="px-8 py-6">Xususiya (Parametr)</th>
                                    <th className="px-8 py-6">Rangi / Kodi</th>
                                    <th className="px-8 py-6 text-right">Qoldiq</th>
                                    <th className="px-8 py-6 text-right">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {filteredInventory.map(item => (
                                    <tr key={item.id} className="hover:bg-[var(--bg-card-hover)] transition-colors group">
                                        <td className="px-8 py-6 align-top">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                                    <Warehouse size={26} />
                                                </div>
                                                <div>
                                                    <div className="text-[var(--text-primary)] font-black text-lg uppercase tracking-tight leading-tight bg-gradient-to-r from-[var(--text-primary)] to-slate-400 bg-clip-text text-transparent">{item.item_name}</div>
                                                    <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Partiya: {item.batch_number || '---'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 align-top text-[var(--text-secondary)] font-bold text-sm">
                                            {item.material_types?.thread_type || '---'}
                                            <br />
                                            <span className="text-xs text-[var(--text-secondary)] opacity-70 font-medium">{item.material_types?.grammage ? `${item.material_types.grammage} gr` : ''}</span>
                                        </td>
                                        <td className="px-8 py-6 align-top">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[var(--text-primary)] font-bold uppercase text-sm tracking-wide">{item.color}</span>
                                                {item.color_code && (
                                                    <span className="text-[10px] bg-[var(--bg-body)] px-2 py-1 rounded-lg text-[var(--text-secondary)] font-mono w-fit border border-[var(--border-color)]">{item.color_code}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 align-top text-right">
                                            <div className={`text-2xl font-black ${Number(item.quantity) < 100 ? 'text-rose-500' : 'text-indigo-400'}`}>{item.quantity}</div>
                                            <div className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest">{item.unit}</div>
                                        </td>
                                        <td className="px-8 py-6 align-top text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenRolls(item)}
                                                    className="p-3 bg-[var(--bg-body)] text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all border border-[var(--border-color)] hover:border-indigo-500 shadow-lg hover:shadow-indigo-500/20"
                                                    title="Poylar va QR kodlar"
                                                >
                                                    <QrCode size={18} />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        fetchHistory(item.id);
                                                        setShowHistoryModal(true);
                                                    }}
                                                    className="p-3 bg-[var(--bg-body)] text-sky-500 hover:bg-sky-500 hover:text-white rounded-xl transition-all border border-[var(--border-color)] hover:border-sky-500 shadow-lg hover:shadow-sky-500/20"
                                                    title="Tarix va Statistika"
                                                >
                                                    <History size={18} />
                                                </button>

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
                                                    className="p-3 bg-[var(--bg-body)] text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all border border-[var(--border-color)] hover:border-amber-500 shadow-lg hover:shadow-amber-500/20"
                                                    title="Qaytim qilish"
                                                >
                                                    <RotateCcw size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setOutboundData({
                                                            inventory_id: item.id,
                                                            quantity: '',
                                                            order_id: '',
                                                            reason: 'Kesimga',
                                                            selected_rolls: []
                                                        });
                                                        // Also fetch rolls to allow selection
                                                        fetchRolls(item.id).then(() => setShowOutboundModal(true));
                                                    }}
                                                    className="p-3 bg-[var(--bg-body)] text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-[var(--border-color)] hover:border-rose-500 shadow-lg hover:shadow-rose-500/20"
                                                    title="Chiqim qilish"
                                                >
                                                    <ArrowUpRight size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {filteredInventory.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-[var(--text-secondary)] border-t border-[var(--border-color)]">
                        <Warehouse size={48} className="mb-4 opacity-20" />
                        <span className="font-bold uppercase tracking-widest text-xs">Ma'lumot topilmadi</span>
                    </div>
                )}
            </div>

            {/* INBOUND MODAL */}
            {showInboundModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl shadow-indigo-900/20 relative custom-scrollbar">
                        <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur-md z-10 rounded-t-[3rem]">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-4">
                                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30"><CircleArrowDown size={24} /></div>
                                    <span className="bg-gradient-to-r from-[var(--text-primary)] via-indigo-400 to-indigo-600 bg-clip-text text-transparent">Yangi Mato Kirimi</span>
                                </h3>
                                <p className="text-[11px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-2 ml-[3.25rem]">Omborga yangi mato qabul qilish</p>
                            </div>
                            <button onClick={() => setShowInboundModal(false)} className="p-3 rounded-2xl bg-[var(--bg-body)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all border border-[var(--border-color)]"><Trash2 className="rotate-45" size={20} /></button>
                        </div>

                        <form onSubmit={handleKirim} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Mato Nomi</label>
                                    <select
                                        required
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-bold appearance-none cursor-pointer placeholder-[var(--text-muted)] shadow-inner"
                                        value={inboundData.selected_material_name}
                                        onChange={e => setInboundData({ ...inboundData, selected_material_name: e.target.value, reference_id: '' })}
                                    >
                                        <option value="" className="bg-[var(--bg-card)] text-[var(--text-muted)]">Tanlang...</option>
                                        {[...new Set((references || []).filter(r => r.type === 'Mato').map(r => r.name))].map(n => (
                                            <option key={n} value={n} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{n}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Turi va Grammaj</label>
                                    <select
                                        required
                                        disabled={!inboundData.selected_material_name}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-bold appearance-none cursor-pointer disabled:opacity-50 placeholder-[var(--text-muted)] shadow-inner"
                                        value={inboundData.reference_id}
                                        onChange={e => setInboundData({ ...inboundData, reference_id: e.target.value })}
                                    >
                                        <option value="" className="bg-[var(--bg-card)]">Tanlang...</option>
                                        {(references || [])
                                            .filter(r => r.name === inboundData.selected_material_name)
                                            .map(r => <option key={r.id} value={r.id} className="bg-[var(--bg-card)]">{r.thread_type} - {r.grammage}gr</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Rangi</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Mato rangi..."
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-bold uppercase placeholder-[var(--text-muted)] shadow-inner"
                                        value={inboundData.color}
                                        onChange={e => setInboundData({ ...inboundData, color: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Partiya №</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Partiya raqami"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-black uppercase text-lg placeholder-[var(--text-muted)] shadow-inner"
                                        value={inboundData.batch_number}
                                        onChange={e => setInboundData({ ...inboundData, batch_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Rang Kodi (ID)</label>
                                    <input
                                        type="text"
                                        placeholder="Rang kodi (ixtiyoriy)"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-bold uppercase placeholder-[var(--text-muted)] shadow-inner"
                                        value={inboundData.color_code}
                                        onChange={e => setInboundData({ ...inboundData, color_code: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Rolls */}
                            <div className="bg-[var(--bg-body)] p-8 rounded-[2.5rem] border border-[var(--border-color)]">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-black uppercase text-xs text-indigo-400 tracking-widest flex items-center gap-2"><ScrollText size={16} /> Poylar (O'ramlar)</h4>
                                    <button type="button" onClick={() => setInboundData({ ...inboundData, rolls: [...inboundData.rolls, { weight: '' }] })} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-indigo-600/20 hover:bg-indigo-500">+ Poy Qo'shish</button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {inboundData.rolls.map((r, i) => (
                                        <div key={i} className="relative group">
                                            <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-sm group-hover:bg-indigo-500/10 transition-all"></div>
                                            <input
                                                type="number"
                                                className="relative w-full py-4 text-center font-black bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl focus:border-indigo-500 outline-none text-[var(--text-primary)] text-lg transition-all shadow-inner group-hover:border-indigo-500/30"
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
                                            }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-[10px] font-black border-4 border-[var(--bg-body)] hover:scale-110 transition-transform shadow-lg z-10 hover:bg-rose-600">×</button>
                                        </div>
                                    ))}
                                    {inboundData.rolls.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest border border-dashed border-[var(--border-color)] rounded-2xl">
                                            Hozircha poylar yo'q
                                        </div>
                                    )}
                                </div>
                                <div className="mt-8 flex items-end justify-end gap-3 border-t border-[var(--border-color)] pt-6">
                                    <span className="text-xs font-black uppercase text-[var(--text-secondary)] tracking-widest mb-1">Jami Og'irlik:</span>
                                    <span className="text-4xl font-black text-[var(--text-primary)] leading-none tracking-tight">{inboundData.quantity || 0} <span className="text-lg text-[var(--text-secondary)]">kg</span></span>
                                </div>
                            </div>

                            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30 text-xs active:scale-95">Kirimni Saqlash</button>
                        </form>
                    </div>
                </div>
            )}

            {/* ROLLS DETAIL MODAL */}
            {showRollsModal && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl shadow-indigo-900/20 relative custom-scrollbar">
                        <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur-md z-10 rounded-t-[3rem]">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20"><QrCode size={20} /></div>
                                    <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">QR Kodlar va Poylar</h3>
                                </div>
                                <p className="text-[11px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1 ml-11">{selectedItem.item_name} - {selectedItem.color}</p>
                            </div>
                            <button onClick={() => setShowRollsModal(false)} className="p-3 rounded-2xl bg-[var(--bg-body)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all border border-[var(--border-color)]"><Trash2 className="rotate-45" size={20} /></button>
                        </div>
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {itemRolls.length === 0 ? (
                                <div className="col-span-full text-center py-10 text-slate-500 italic">Hech qanday poy topilmadi</div>
                            ) : (
                                itemRolls.map(roll => (
                                    <div key={roll.id} className="bg-[var(--bg-body)] border border-[var(--border-color)] p-6 rounded-3xl flex flex-col items-center gap-4 hover:border-indigo-500/30 transition-all group shadow-lg">
                                        <div className="bg-white p-2 rounded-xl">
                                            <img src={generateQRUrl(JSON.stringify({ id: roll.id, w: roll.weight }))} alt="QR" className="w-32 h-32 object-contain mix-blend-multiply" />
                                        </div>
                                        <div className="text-center w-full">
                                            <div className="text-[var(--text-primary)] font-black text-lg">{roll.weight} kg</div>
                                            <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold">{roll.roll_number}</div>
                                            <div className={`text-[10px] uppercase font-bold mt-1 ${roll.status === 'used' ? 'text-rose-500' : 'text-emerald-500'}`}>{roll.status === 'used' ? 'Ishlatilgan' : 'Omborda'}</div>
                                        </div>
                                        <button
                                            onClick={() => handlePrintQR(roll, selectedItem)}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                                        >
                                            <Printer size={14} /> Chop etish
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORY & STATISTICS MODAL */}
            {showHistoryModal && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative custom-scrollbar flex flex-col">
                        <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur-md z-10 shrink-0">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-4">
                                    <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-500/30"><History size={24} /></div>
                                    <span className="bg-gradient-to-r from-[var(--text-primary)] via-amber-400 to-amber-600 bg-clip-text text-transparent">Mato Tarixi va Statistikasi</span>
                                </h3>
                                <p className="text-[11px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-2 ml-[3.25rem]">{selectedItem.item_name} - {selectedItem.color} ({selectedItem.batch_number})</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="p-3 rounded-2xl bg-[var(--bg-body)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all border border-[var(--border-color)]"><Trash2 className="rotate-45" size={20} /></button>
                        </div>

                        <div className="p-8 space-y-8 flex-1">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[var(--bg-body)] p-6 rounded-3xl border border-[var(--border-color)]">
                                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-black mb-2">Jami Kirim</div>
                                    <div className="text-3xl font-black text-emerald-500">
                                        {itemHistory.filter(h => h.type === 'In').reduce((sum, h) => sum + Number(h.quantity), 0).toFixed(2)} <span className="text-sm text-[var(--text-secondary)]">kg</span>
                                    </div>
                                </div>
                                <div className="bg-[var(--bg-body)] p-6 rounded-3xl border border-[var(--border-color)]">
                                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-black mb-2">Jami Chiqim</div>
                                    <div className="text-3xl font-black text-rose-500">
                                        {itemHistory.filter(h => h.type === 'Out').reduce((sum, h) => sum + Number(h.quantity), 0).toFixed(2)} <span className="text-sm text-[var(--text-secondary)]">kg</span>
                                    </div>
                                </div>
                                <div className="bg-[var(--bg-body)] p-6 rounded-3xl border border-[var(--border-color)]">
                                    <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-black mb-2">Hozirgi Qoldiq</div>
                                    <div className="text-3xl font-black text-indigo-500">
                                        {selectedItem.quantity} <span className="text-sm text-[var(--text-secondary)]">kg</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Log Table */}
                            <div className="overflow-hidden rounded-3xl border border-[var(--border-color)]">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[var(--bg-body)] text-[var(--text-secondary)] uppercase font-black text-[10px] tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Sana</th>
                                            <th className="px-6 py-4">Harakat</th>
                                            <th className="px-6 py-4">Miqdor</th>
                                            <th className="px-6 py-4">Sabab / Model</th>
                                            <th className="px-6 py-4 text-right">Partiya</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                                        {itemHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-[var(--text-secondary)] italic">Tarix topilmadi</td>
                                            </tr>
                                        ) : (
                                            itemHistory.map((log) => (
                                                <tr key={log.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                                                    <td className="px-6 py-4 text-[var(--text-secondary)] font-mono text-xs">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${log.type === 'In'
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                            }`}>
                                                            {log.type === 'In' ? 'Kirim' : 'Chiqim'}
                                                        </span>
                                                    </td>
                                                    <td className={`px-6 py-4 font-black ${log.type === 'In' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {log.type === 'In' ? '+' : '-'}{log.quantity} kg
                                                    </td>
                                                    <td className="px-6 py-4 text-[var(--text-primary)] font-medium">
                                                        {log.reason}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-[var(--text-secondary)] font-mono text-xs">
                                                        {log.batch_number || '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OUTBOUND MODAL */}
            {showOutboundModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-2xl rounded-[3rem] shadow-2xl shadow-rose-900/20 relative max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)] z-10 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-500 rounded-2xl text-white shadow-lg shadow-rose-500/30">
                                    <ArrowUpRight size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Ombordan Chiqim</h3>
                                    <p className="text-[11px] text-[var(--text-secondary)] font-black uppercase tracking-widest mt-1">Matoni ishlab chiqarishga berish</p>
                                </div>
                            </div>
                            <button onClick={() => setShowOutboundModal(false)} className="p-3 rounded-2xl bg-[var(--bg-body)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all border border-[var(--border-color)]"><Trash2 className="rotate-45" size={20} /></button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar p-8 space-y-8 flex-1">
                            {/* DEDICATED SCANNER INPUT */}
                            <div className="bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-3xl flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                        <QrCode size={16} /> QR Skaner (Kamera yoki Qo'lda)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowCameraScanner(!showCameraScanner)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${showCameraScanner
                                            ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                                            : 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20 hover:bg-indigo-600'
                                            }`}
                                    >
                                        {showCameraScanner ? <><Trash2 size={14} /> Kamerani Yopish</> : <><QrCode size={14} /> Kamerani Ochish</>}
                                    </button>
                                </div>

                                {showCameraScanner ? (
                                    <div className="animate-in fade-in zoom-in duration-300">
                                        <div id="reader" className="w-full rounded-2xl overflow-hidden border-2 border-indigo-500/30 bg-black"></div>
                                        <p className="text-[10px] text-center text-indigo-400 mt-2 font-medium">Kamerani QR kodga qarating</p>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Skanerlash uchun shu yerga bosing..."
                                            className="w-full bg-[var(--bg-card)] border-2 border-indigo-500/30 rounded-xl p-3 text-center text-indigo-400 font-mono text-sm placeholder:text-indigo-500/30 focus:border-indigo-500 focus:bg-indigo-500/10 outline-none transition-all"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    try {
                                                        const val = e.target.value.trim();
                                                        if (!val) return;

                                                        // Try parse JSON
                                                        let qrData = null;
                                                        // Robust parse logic
                                                        if (val.includes('{') && val.includes('}')) {
                                                            const start = val.indexOf('{');
                                                            const end = val.lastIndexOf('}');
                                                            const jsonStr = val.substring(start, end + 1);
                                                            qrData = JSON.parse(jsonStr);
                                                        }

                                                        if (qrData && qrData.id && qrData.w) {
                                                            handleScannedRoll(qrData);
                                                            e.target.value = ''; // Clear after scan
                                                            // Play beep sound logic here if needed
                                                        } else {
                                                            alert("Noto'g'ri QR kod formati!");
                                                        }
                                                    } catch (err) {
                                                        console.error("Scan error", err);
                                                        // alert("Skanerlash xatoligi");
                                                    }
                                                }
                                            }}
                                        />
                                        <p className="text-[9px] text-center text-indigo-400/60 font-bold uppercase tracking-widest">Har bir skanerdan so'ng poy avtomatik qo'shiladi</p>
                                    </>
                                )}
                            </div>


                            <form id="outboundForm" onSubmit={handleChiqim} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Qaysi Buyurtma Uchun? (Optional)</label>
                                    <select
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-rose-500 transition-all font-bold appearance-none cursor-pointer shadow-inner"
                                        value={outboundData.order_id}
                                        onChange={e => setOutboundData({ ...outboundData, order_id: e.target.value })}
                                    >
                                        <option value="" className="bg-[var(--bg-card)] text-[var(--text-secondary)]">Tanlanmagan (Umumiy chiqim)</option>
                                        {orders.map(o => (
                                            <option key={o.id} value={o.id} className="bg-[var(--bg-card)]">Order #{o.order_number} - {o.models?.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* ROLL SELECTION LIST (Updated Visuals) */}
                                {itemRolls.length > 0 && (
                                    <div className="bg-[var(--bg-body)] border border-[var(--border-color)] p-6 rounded-3xl">
                                        <h4 className="flex items-center justify-between text-[var(--text-secondary)] font-black uppercase text-xs tracking-widest mb-4">
                                            <span>Mavjud Poylar</span>
                                            <span className="text-rose-500">{outboundData.selected_rolls.length} ta tanlandi</span>
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                            {itemRolls.map(roll => {
                                                const isSelected = outboundData.selected_rolls.find(r => r.id === roll.id);
                                                return (
                                                    <div
                                                        key={roll.id}
                                                        onClick={() => {
                                                            let newSelection;
                                                            if (isSelected) {
                                                                newSelection = outboundData.selected_rolls.filter(r => r.id !== roll.id);
                                                            } else {
                                                                newSelection = [...outboundData.selected_rolls, roll];
                                                            }
                                                            const totalWeight = newSelection.reduce((sum, r) => sum + Number(r.weight), 0);
                                                            setOutboundData({ ...outboundData, selected_rolls: newSelection, quantity: totalWeight.toFixed(2) });
                                                        }}
                                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center relative overflow-hidden ${isSelected
                                                            ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                                                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-rose-500/30'
                                                            }`}
                                                    >
                                                        {isSelected && <div className="absolute top-1 right-1"><CircleCheck size={12} fill="white" className="text-rose-500" /></div>}
                                                        <span className="font-black text-sm">{roll.weight} kg</span>
                                                        <span className={`text-[9px] uppercase font-bold mt-0.5 ${isSelected ? 'text-white/70' : 'text-[var(--text-secondary)] opacity-50'}`}>{roll.roll_number}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}


                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Chiqim Miqdori (kg)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-rose-500 transition-all font-black text-2xl placeholder-[var(--text-muted)] shadow-inner"
                                        value={outboundData.quantity}
                                        onChange={e => setOutboundData({ ...outboundData, quantity: e.target.value })}
                                        placeholder="0.00"
                                    />
                                    <p className="text-[10px] text-[var(--text-secondary)] mt-2 ml-1">* Agar poylar tanlangan bo'lsa, avtomatik hisoblanadi.</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1 mb-2 block">Sabab / Qayerga</label>
                                    <textarea
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-rose-500 transition-all font-bold placeholder-[var(--text-muted)] shadow-inner resize-none h-24"
                                        value={outboundData.reason}
                                        onChange={e => setOutboundData({ ...outboundData, reason: e.target.value })}
                                        placeholder="Masalan: Kesim bo'limiga"
                                    />
                                </div>
                            </form>
                        </div>
                        <div className="p-8 border-t border-[var(--border-color)] bg-[var(--bg-card)] shrink-0">
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowOutboundModal(false)} className="flex-1 py-4 bg-[var(--bg-body)] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all">Bekor qilish</button>
                                <button type="submit" form="outboundForm" className="flex-[2] py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-600/30 transition-all active:scale-95">Chiqimni Tasdiqlash</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatoOmbori;
