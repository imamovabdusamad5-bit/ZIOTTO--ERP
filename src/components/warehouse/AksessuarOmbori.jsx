import React, { useState, useEffect } from 'react';
import {
    Package, Search, Plus, History, CircleArrowDown,
    ArrowUpRight, Trash2, X, ArrowDownLeft, RotateCcw, Edit,
    QrCode, Printer, ChevronDown, ChevronUp
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';

const AksessuarOmbori = ({ inventory, references, orders, onRefresh, viewMode }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showInboundModal, setShowInboundModal] = useState(false);
    const [showOutboundModal, setShowOutboundModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Grouping & Scanner
    const [expandedGroups, setExpandedGroups] = useState({});
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        let html5QrCode = null;
        if (showScanner) {
            const startScanner = async () => {
                try {
                    await new Promise(resolve => setTimeout(resolve, 100)); // allow render
                    html5QrCode = new Html5Qrcode("reader");
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText) => {
                            const code = decodedText.trim();
                            const item = inventory.find(i =>
                                i.id === code ||
                                `AKS-${i.id}` === code ||
                                Object.values(references || {}).some(r => r.code === code && r.id === i.reference_id)
                            );
                            if (item) {
                                setOutboundData(prev => ({ ...prev, inventory_id: item.id }));
                                setShowOutboundModal(true);
                                setShowScanner(false);
                            } else {
                                alert("Bunday Aksessuar (ID yoki Kod) topilmadi: " + code);
                                setShowScanner(false);
                            }
                        },
                        (error) => { /* ignore */ }
                    );
                } catch (err) {
                    console.error('Scanner init error:', err);
                }
            };
            startScanner();
        }
        return () => {
            if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
        };
    }, [showScanner, inventory, references]);

    const toggleGroup = (name) => {
        setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const handlePrintQR = (item, codeText) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert("Brauzerda yangi oyna ochishga ruxsat bering!");

        printWindow.document.write(`
            <html>
                <head>
                    <title>Aksessuar QR - ${codeText}</title>
                    <style>
                        body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; background: #fff; }
                        .qr-card { text-align: center; border: 2px solid #000; padding: 20px; border-radius: 12px; }
                        .title { font-weight: 900; font-size: 24px; margin-bottom: 5px; text-transform: uppercase; }
                        .code { font-size: 14px; color: #555; margin-top: 10px; opacity: 0.8; }
                        canvas { margin: 10px auto; display: block; }
                    </style>
                </head>
                <body>
                    <div class="qr-card">
                        <div class="title">${item.item_name}</div>
                        <div id="qr-container"></div>
                        <div class="code">${codeText}</div>
                    </div>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                    <script>
                        new QRCode(document.getElementById("qr-container"), {
                            text: "${codeText}",
                            width: 200,
                            height: 200,
                            colorDark : "#000000",
                            colorLight : "#ffffff",
                            correctLevel : QRCode.CorrectLevel.H
                        });
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePrintAllQRs = (items) => {
        if (!items || items.length === 0) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert("Brauzerda yangi oyna ochishga ruxsat bering!");

        let qrContainers = items.map((item, index) => {
            const refItem = references?.find(r => r.id === item.reference_id) || {};
            const codeText = refItem.code || `AKS-${item.id}`;
            return `
                <div class="qr-card">
                    <div class="title">${item.item_name}</div>
                    <div id="qr-container-${index}"></div>
                    <div class="code">${codeText}</div>
                </div>
            `;
        }).join('');

        let qrScripts = items.map((item, index) => {
            const refItem = references?.find(r => r.id === item.reference_id) || {};
            const codeText = refItem.code || `AKS-${item.id}`;
            return `
                new QRCode(document.getElementById("qr-container-${index}"), {
                    text: "${codeText}",
                    width: 150,
                    height: 150,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            `;
        }).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Aksessuar QRs</title>
                    <style>
                        body { margin: 0; font-family: sans-serif; background: #fff; padding: 20px; }
                        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
                        .qr-card { text-align: center; border: 2px solid #000; padding: 15px; border-radius: 12px; page-break-inside: avoid; }
                        .title { font-weight: 900; font-size: 16px; margin-bottom: 5px; text-transform: uppercase; }
                        .code { font-size: 12px; color: #555; margin-top: 10px; opacity: 0.8; }
                        canvas { margin: 10px auto; display: block; }
                    </style>
                </head>
                <body>
                    <div class="grid">
                        ${qrContainers}
                    </div>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                    <script>
                        window.onload = function() {
                            ${qrScripts}
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 1000);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // New States from MatoOmbori
    const [subTab, setSubTab] = useState('kirim'); // 'kirim' | 'chiqim'
    const [outboundLogs, setOutboundLogs] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [itemHistory, setItemHistory] = useState([]);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        id: null,
        date: '',
        item_name: '',
        color: '',
        color_code: '',
        batch_number: '',
        quantity: 0,
        unit: 'dona',
        source: '',
        note: ''
    });

    const [inboundData, setInboundData] = useState({
        date: new Date().toISOString().split('T')[0],
        selected_material_name: '',
        color: '',
        color_code: '',
        quantity: '',
        quantities: {}, // Added for multi-size input
        unit: 'dona',
        batch_number: '',
        reason: 'Yangi aksessuar',
        note: '',
        source: ''
    });

    // Outbound State
    const [outboundData, setOutboundData] = useState({
        inventory_id: '',
        quantity: '',
        reason: 'Ishlab chiqarishga',
        order_id: ''
    });

    const [outboundExtra, setOutboundExtra] = useState({
        model: '',
        part: '',
        age: '',
        cutter: 'Mastura'
    });

    // Fetch Outbound Logs
    useEffect(() => {
        if (subTab === 'chiqim') {
            const fetchOutbound = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('inventory_logs')
                    .select('*, inventory(*)')
                    .eq('type', 'Out')
                    .order('created_at', { ascending: false });

                if (error) console.error(error);
                else setOutboundLogs(data || []);
                setLoading(false);
            };
            fetchOutbound();
        }
    }, [subTab]);

    // Filters
    const filteredInventory = inventory.filter(item => {
        const query = searchTerm.toLowerCase();
        return (
            !searchTerm ||
            (item.item_name || '').toLowerCase().includes(query) ||
            (item.color || '').toLowerCase().includes(query) ||
            (item.color_code || '').toLowerCase().includes(query) ||
            (item.batch_number || '').toLowerCase().includes(query) ||
            (item.source || '').toLowerCase().includes(query)
        );
    }).filter(i => (i.category || '').toLowerCase().includes('aksessuar'));

    const filteredOutboundLogs = outboundLogs.filter(log => {
        const propItem = (inventory || []).find(i => i.id === log.inventory_id);
        const item = propItem || log.inventory || {};

        // Filter out non-accessory items
        if (!(item.category || '').toLowerCase().includes('aksessuar')) {
            return false;
        }

        if (!searchTerm) return true;

        const lowSearch = searchTerm.toLowerCase();
        const reason = log.reason || '';

        return (
            (item.item_name && item.item_name.toLowerCase().includes(lowSearch)) ||
            (item.color && item.color.toLowerCase().includes(lowSearch)) ||
            (log.batch_number && log.batch_number.toLowerCase().includes(lowSearch)) ||
            reason.toLowerCase().includes(lowSearch)
        );
    });

    // Handlers
    const handleKirim = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const cleanName = inboundData.selected_material_name.trim();
            const actionDate = inboundData.date ? new Date(inboundData.date).toISOString() : new Date().toISOString();

            if (!cleanName) {
                alert('Iltimos, aksessuar nomini tanlang!');
                setLoading(false);
                return;
            }

            const refGroup = references?.filter(r => r.name === cleanName && r.type === 'Aksessuar') || [];

            let itemsToProcess = [];

            if (refGroup.length > 0) {
                // If we have references, we use the `quantities` map
                for (const ref of refGroup) {
                    const qty = Number(inboundData.quantities[ref.id] || 0);
                    if (qty > 0) {
                        itemsToProcess.push({
                            refId: ref.id,
                            qty: qty,
                            unit: ref.unit || inboundData.unit,
                            code: ref.code || ''
                        });
                    }
                }
            } else {
                // Single item fallback
                const qty = Number(inboundData.quantity || 0);
                if (qty > 0) {
                    itemsToProcess.push({
                        refId: null,
                        qty: qty,
                        unit: inboundData.unit,
                        code: ''
                    });
                }
            }

            if (itemsToProcess.length === 0) {
                alert('Iltimos, qabul qilinayotgan miqdorni kiriting!');
                setLoading(false);
                return;
            }

            const sourceStr = inboundData.source ? `${inboundData.source} | ` : '';
            const finalNote = `${sourceStr}${inboundData.note || inboundData.reason}`;

            for (const item of itemsToProcess) {
                // Check existing
                const { data: existing } = await supabase.from('inventory')
                    .select('*')
                    .eq('item_name', cleanName)
                    .eq('reference_id', item.refId) // Match exactly by reference if it exists
                    .is('color', null) // Ensure we match simple accessory
                    .is('batch_number', null)
                    .filter('category', 'ilike', 'Aksessuar')
                    .maybeSingle();

                let inventoryId;
                if (existing) {
                    const { error: updateError } = await supabase.from('inventory').update({
                        quantity: Number(existing.quantity || 0) + item.qty,
                        last_updated: new Date()
                    }).eq('id', existing.id);
                    if (updateError) throw updateError;
                    inventoryId = existing.id;
                } else {
                    const { data: created, error } = await supabase.from('inventory').insert([{
                        item_name: cleanName,
                        category: 'Aksessuar',
                        quantity: item.qty,
                        unit: item.unit,
                        reference_id: item.refId,
                        last_updated: new Date()
                    }]).select().single();
                    if (error) throw error;
                    inventoryId = created.id;
                }

                const { error: logError } = await supabase.from('inventory_logs').insert([{
                    inventory_id: inventoryId,
                    type: 'In',
                    quantity: item.qty,
                    reason: finalNote,
                    created_at: actionDate
                }]);
                if (logError) throw logError;
            }

            // Success feedback
            setShowInboundModal(false);
            setInboundData({
                date: new Date().toISOString().split('T')[0],
                selected_material_name: '',
                color: '',
                color_code: '',
                quantity: '',
                quantities: {},
                unit: 'dona',
                batch_number: '',
                reason: 'Yangi aksessuar',
                note: '',
                source: ''
            });

            await onRefresh();
            alert(`Muvaffaqiyatli! Aksessuar qabul qilindi.`);
        } catch (error) {
            console.error('Kirim xatosi:', error);
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
            if (!item) throw new Error("Aksessuar topilmadi");

            const qtyToDeduct = Number(outboundData.quantity);

            if (qtyToDeduct > Number(item.quantity)) {
                alert('Yetarli miqdor yo\'q!');
                setLoading(false);
                return;
            }

            let finalReasonBase = outboundData.reason || '';
            const extraInfo = [];
            if (outboundExtra.model) extraInfo.push(`[Model: ${outboundExtra.model}]`);
            if (outboundExtra.part) extraInfo.push(`[Qism: ${outboundExtra.part}]`);
            if (outboundExtra.age) extraInfo.push(`[Yosh: ${outboundExtra.age}]`);
            if (outboundExtra.cutter) extraInfo.push(`[Bichuvchi: ${outboundExtra.cutter}]`);

            if (extraInfo.length > 0) {
                finalReasonBase = `${extraInfo.join(' ')} ${finalReasonBase}`;
            }

            if (outboundData.order_id) {
                const ord = orders.find(o => o.id == outboundData.order_id);
                if (ord) finalReasonBase += ` (Buyurtma: #${ord.order_number})`;
            }

            const newQty = Number(item.quantity) - qtyToDeduct;
            await supabase.from('inventory').update({ quantity: newQty, last_updated: new Date() }).eq('id', item.id);

            await supabase.from('inventory_logs').insert([{
                inventory_id: item.id,
                type: 'Out',
                quantity: qtyToDeduct,
                reason: finalReasonBase,
                batch_number: item.batch_number
            }]);

            setShowOutboundModal(false);
            setOutboundData({ inventory_id: '', quantity: '', reason: 'Ishlab chiqarishga', order_id: '' });
            setOutboundExtra({ model: '', part: '', age: '', cutter: 'Mastura' });
            await onRefresh();
            alert('Chiqim muvaffaqiyatli amalga oshirildi!');
        } catch (error) {
            alert('Xato: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`${selectedIds.length} ta elementni o'chirmoqchimisiz?`)) return;

        setLoading(true);
        try {
            await supabase.from('material_requests').delete().in('inventory_id', selectedIds);
            await supabase.from('inventory_logs').delete().in('inventory_id', selectedIds);
            await supabase.from('inventory').delete().in('id', selectedIds);

            setSelectedIds([]);
            onRefresh();
        } catch (error) {
            console.error(error);
            alert("Xatolik: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm("Haqiqatan ham o'chirmoqchimisiz?")) return;
        try {
            setLoading(true);
            await supabase.from('material_requests').delete().eq('inventory_id', item.id);
            await supabase.from('inventory_logs').delete().eq('inventory_id', item.id);
            await supabase.from('inventory').delete().eq('id', item.id);
            onRefresh();
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLog = async (log) => {
        if (!window.confirm("Kiritilgan amaliyotni bekor qilmoqchimisiz? (Miqdor omborga qaytariladi/ayriladi)")) return;
        try {
            setLoading(true);
            const item = (inventory || []).find(i => i.id === log.inventory_id);
            if (item) {
                const modifier = log.type === 'Out' ? 1 : -1;
                const newQty = Number(item.quantity) + (Number(log.quantity) * modifier);
                await supabase.from('inventory').update({ quantity: newQty, last_updated: new Date() }).eq('id', item.id);
            }
            await supabase.from('inventory_logs').delete().eq('id', log.id);
            onRefresh();
        } catch (error) {
            alert('Xato: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

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

    const handleEdit = async (item) => {
        setLoading(true);
        try {
            const { data: logs } = await supabase
                .from('inventory_logs')
                .select('reason')
                .eq('inventory_id', item.id)
                .eq('type', 'In')
                .order('created_at', { ascending: true })
                .limit(1);

            const initialLog = logs && logs[0] ? logs[0].reason : '';

            setEditData({
                id: item.id,
                date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                item_name: item.item_name || '',
                color: item.color || '',
                color_code: item.color_code || '',
                batch_number: item.batch_number || '',
                quantity: item.quantity || 0,
                unit: item.unit || 'dona',
                source: item.source || '',
                note: initialLog
            });
            setSelectedItem(item);
            setShowEditModal(true);
        } catch (error) {
            console.error(error);
            alert("Xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            const oldQty = Number(selectedItem.quantity || 0);
            const newQty = Number(editData.quantity);
            const diff = newQty - oldQty;

            const { error: updateError } = await supabase
                .from('inventory')
                .update({
                    item_name: editData.item_name,
                    color: editData.color,
                    color_code: editData.color_code,
                    batch_number: editData.batch_number,
                    quantity: newQty,
                    unit: editData.unit,
                    last_updated: new Date()
                })
                .eq('id', editData.id);

            if (updateError) throw updateError;

            if (Math.abs(diff) > 0.001) {
                await supabase.from('inventory_logs').insert([{
                    inventory_id: editData.id,
                    type: diff > 0 ? 'In' : 'Out',
                    quantity: Math.abs(diff),
                    reason: `Tahrir (Correction): To'liq o'zgartirish. ${oldQty} -> ${newQty}`,
                    batch_number: editData.batch_number
                }]);
            }

            alert("O'zgarishlar saqlandi!");
            setShowEditModal(false);
            onRefresh();

        } catch (error) {
            console.error("Edit Save Error:", error);
            alert("Saqlashda xatolik: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Tabs */}
            <div className="flex gap-2 p-1 my-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-max">
                <button
                    onClick={() => { setSubTab('kirim'); setSearchTerm(''); }}
                    className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${subTab === 'kirim' ? 'bg-purple-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
                >
                    Kirim Bo'limi
                </button>
                <button
                    onClick={() => { setSubTab('chiqim'); setSearchTerm(''); }}
                    className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${subTab === 'chiqim' ? 'bg-purple-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
                >
                    Chiqim Bo'limi
                </button>
            </div>

            {/* Header */}
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
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-hover:text-purple-400 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder={subTab === 'kirim' ? "Qidirish... (ID, Partiya, Rang)" : "Qidirish... (Chiqim loglari)"}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-3xl focus:border-purple-500/50 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none font-bold transition-all shadow-inner hover:bg-[var(--bg-card-hover)]"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        {subTab === 'chiqim' && (
                            <button
                                onClick={() => {
                                    setLoading(true);
                                    const fetchOutbound = async () => {
                                        const { data } = await supabase.from('inventory_logs').select('*, inventory(*)').eq('type', 'Out').order('created_at', { ascending: false });
                                        setOutboundLogs(data || []);
                                        setLoading(false);
                                    };
                                    fetchOutbound();
                                }}
                                className="px-4 py-4 rounded-2xl border border-[var(--border-color)] text-purple-500 font-bold hover:bg-purple-500/10 transition-all flex items-center gap-2"
                            >
                                <RotateCcw size={18} />
                            </button>
                        )}
                        <button className="px-6 py-4 rounded-2xl border border-[var(--border-color)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-card-hover)] transition-all">Filtrlar</button>
                        {subTab === 'kirim' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-[2rem] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all font-black uppercase text-xs tracking-widest border border-indigo-400/20 whitespace-nowrap"
                                >
                                    <QrCode size={18} /> QR Chiqim
                                </button>
                                <button
                                    onClick={() => setShowInboundModal(true)}
                                    className="flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-[2rem] hover:bg-purple-500 transition-all shadow-xl shadow-purple-600/20 font-black uppercase text-xs tracking-widest border border-purple-400/20 whitespace-nowrap"
                                >
                                    <Plus size={18} /> Yangi Kirim
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showScanner && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-card)] max-w-lg w-full rounded-[2.5rem] p-8 shadow-2xl border border-[var(--border-color)]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3"><QrCode className="text-purple-400" /> QR Skaner</h3>
                            <button onClick={() => setShowScanner(false)} className="p-2 text-[var(--text-secondary)] hover:text-white hover:bg-white/10 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div id="reader" className="w-full bg-[var(--input-bg)] rounded-2xl overflow-hidden border border-purple-500/20 shadow-inner"></div>
                        <p className="text-center text-xs text-purple-400 font-bold mt-4 animate-pulse">Kamerani QR kodga qarating...</p>
                    </div>
                </div>
            )}

            {/* Inventory / Logs Display */}
            {subTab === 'chiqim' ? (
                // Chiqim Logs Table
                <div className="overflow-hidden bg-[var(--bg-card)] backdrop-blur-3xl rounded-3xl border border-[var(--border-color)] shadow-2xl min-h-[500px] animate-in fade-in">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--bg-sidebar-footer)] text-[var(--text-secondary)] text-[11px] font-black uppercase tracking-wider border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-6 py-5">Sana</th>
                                <th className="px-6 py-5">Nomi</th>
                                <th className="px-6 py-5">ID</th>
                                <th className="px-6 py-5 text-right">Soni</th>
                                <th className="px-6 py-5 text-center">Birligi</th>
                                <th className="px-6 py-5">Kimga</th>
                                <th className="px-6 py-5">Model</th>
                                <th className="px-6 py-5">Qism</th>
                                <th className="px-6 py-5">Buyurtma ID</th>
                                <th className="px-6 py-5">Buyurtma Soni</th>
                                <th className="px-6 py-5 text-center">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {filteredOutboundLogs.map(log => {
                                const propItem = (inventory || []).find(i => i.id === log.inventory_id);
                                const item = propItem || log.inventory || {};
                                const refItem = references?.find(r => r.id === item.reference_id) || {};
                                const codeToDisplay = refItem.code || `AKS-${item.id}`;
                                const reason = log.reason || '';
                                const extract = (k) => {
                                    const m = reason.match(new RegExp(`\\[${k}: (.*?)\\]`));
                                    return m ? m[1] : '-';
                                };
                                const extractedModel = extract('Model');
                                let model = extractedModel;
                                let orderId = '-';
                                let orderQuantity = '-';
                                const matchedOrder = (orders || []).find(o => o.order_number === model || o.model_name === model);
                                if (matchedOrder) {
                                    model = matchedOrder.models?.name || matchedOrder.model_name || model;
                                    orderId = matchedOrder.order_number || matchedOrder.id;
                                    orderQuantity = matchedOrder.quantity || '-';
                                }

                                return (
                                    <tr key={log.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                                        <td className="px-6 py-5 text-xs font-bold text-[var(--text-primary)]">
                                            {new Date(log.created_at).toLocaleDateString('ru-RU')}
                                        </td>
                                        <td className="px-6 py-5 font-black text-xs text-[var(--text-primary)]">{item.item_name || '-'}</td>
                                        <td className="px-6 py-5 text-[10px] text-[var(--text-secondary)] font-mono uppercase" title={`Asl ID: AKS-${item.id}`}>{codeToDisplay}</td>
                                        <td className="px-6 py-5 text-right font-black text-rose-500 text-sm">{log.quantity}</td>
                                        <td className="px-6 py-5 text-center text-[10px] font-bold text-[var(--text-secondary)] uppercase">{item.unit || 'dona'}</td>
                                        <td className="px-6 py-5 text-xs font-bold text-[var(--text-primary)]">{extract('Bichuvchi')}</td>
                                        <td className="px-6 py-5 text-xs font-bold text-purple-400">{model}</td>
                                        <td className="px-6 py-5 text-xs text-[var(--text-primary)]">{extract('Qism')}</td>
                                        <td className="px-6 py-5 text-[10px] text-[var(--text-secondary)] font-mono">#{orderId}</td>
                                        <td className="px-6 py-5 text-xs font-bold text-[var(--text-primary)]">{orderQuantity}</td>
                                        <td className="px-6 py-5 text-center">
                                            <button onClick={() => handleDeleteLog(log)} className="p-2 text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all" title="O'chirish">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredOutboundLogs.length === 0 && (
                                <tr><td colSpan="9" className="p-10 text-center text-[var(--text-secondary)]">Chiqimlar mavjud emas</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                // Kirim Table
                <div className="overflow-hidden bg-[var(--bg-card)] backdrop-blur-3xl rounded-3xl border border-[var(--border-color)] shadow-2xl min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[var(--bg-sidebar-footer)] text-[var(--text-secondary)] uppercase tracking-widest text-[11px] font-black border-b border-[var(--border-color)] sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-5 text-center w-12">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg bg-[var(--input-bg)] border-[var(--border-color)] checked:bg-purple-600 focus:ring-purple-500 cursor-pointer transition-all"
                                            checked={filteredInventory.length > 0 && selectedIds.length === filteredInventory.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedIds(filteredInventory.map(i => i.id));
                                                } else {
                                                    setSelectedIds([]);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="px-6 py-5">Sana</th>
                                    <th className="px-6 py-5 font-black text-white">Nomi</th>
                                    <th className="px-6 py-5">ID</th>
                                    <th className="px-6 py-5 text-right">Soni</th>
                                    <th className="px-6 py-5 text-center">Birligi</th>
                                    <th className="px-6 py-5">Qo'shimcha</th>
                                    <th className="px-6 py-5 text-center">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {Object.values(filteredInventory.reduce((acc, item) => {
                                    const itemName = item.item_name || "Noma'lum";
                                    const dateStr = item.created_at
                                        ? new Date(item.created_at).toLocaleDateString('ru-RU')
                                        : (item.last_updated ? new Date(item.last_updated).toLocaleDateString('ru-RU') : '-');
                                    const key = `${itemName}_${dateStr}`;

                                    if (!acc[key]) acc[key] = { groupKey: key, name: itemName, date: dateStr, items: [], total: 0, unit: item.unit };
                                    acc[key].items.push(item);
                                    acc[key].total += Number(item.quantity) || 0;
                                    return acc;
                                }, {})).map(group => (
                                    <React.Fragment key={group.groupKey}>
                                        <tr onClick={() => toggleGroup(group.groupKey)} className="cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors group bg-[var(--bg-body)] border-b-2 border-[var(--border-color)]">
                                            <td className="px-6 py-5 text-center">
                                                {expandedGroups[group.groupKey] ? <ChevronUp size={20} className="text-purple-400 mx-auto" /> : <ChevronDown size={20} className="text-[var(--text-secondary)] mx-auto group-hover:text-purple-400 transition-colors" />}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-[var(--text-primary)] font-bold">
                                                {group.date}
                                            </td>
                                            <td className="px-6 py-5 font-black text-white text-base tracking-wide flex items-center gap-2">
                                                {group.name}
                                                <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">{group.items.length} xil</span>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-[var(--text-secondary)] font-mono uppercase">-</td>
                                            <td className="px-6 py-5 text-right font-black text-purple-400 text-lg">{group.total.toFixed(2)}</td>
                                            <td className="px-6 py-5 text-center text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest">{group.unit}</td>
                                            <td className="px-6 py-5 text-xs text-[var(--text-secondary)] italic opacity-50">Jamlangan ko'rinish</td>
                                            <td className="px-6 py-5 text-center text-xs text-[var(--text-secondary)] font-bold">UMUMIY JAMI</td>
                                        </tr>
                                        {expandedGroups[group.groupKey] && (
                                            <tr className="bg-[var(--bg-body)]/50 transition-all">
                                                <td colSpan="8" className="p-6 border-b border-[var(--border-color)]">
                                                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
                                                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-body)]">
                                                            <div className="flex items-center gap-3">
                                                                <Package size={18} className="text-purple-400" />
                                                                <h4 className="font-bold text-sm text-[var(--text-primary)]">Aksessuarlar Ro'yxati</h4>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs text-[var(--text-secondary)] font-bold">Jami: {group.items.length} xil</span>
                                                                <button onClick={(e) => { e.stopPropagation(); handlePrintAllQRs(group.items); }} className="p-2 bg-indigo-500/10 text-indigo-400 hover:text-white hover:bg-indigo-500 rounded-xl transition-all border border-indigo-500/20 shadow-sm flex items-center gap-2 text-xs font-bold" title="Barcha QR kodelarni Chop etish"><Printer size={16} /> Barchasini chop etish</button>
                                                            </div>
                                                        </div>

                                                        <table className="w-full text-left text-sm">
                                                            <thead className="text-[10px] uppercase text-[var(--text-secondary)] font-bold border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                                                                <tr>
                                                                    <th className="px-6 py-3 w-10 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--input-bg)] text-purple-600 focus:ring-purple-500 cursor-pointer"
                                                                            checked={group.items.length > 0 && group.items.every(i => selectedIds.includes(i.id))}
                                                                            onChange={(e) => {
                                                                                if (e.target.checked) {
                                                                                    const ids = group.items.map(i => i.id);
                                                                                    setSelectedIds(prev => [...new Set([...prev, ...ids])]);
                                                                                } else {
                                                                                    const ids = group.items.map(i => i.id);
                                                                                    setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
                                                                                }
                                                                            }}
                                                                        />
                                                                    </th>
                                                                    <th className="px-6 py-3">Sana</th>
                                                                    <th className="px-6 py-3">Nomi</th>
                                                                    <th className="px-6 py-3">ID / KOD</th>
                                                                    <th className="px-6 py-3 text-right">Soni</th>
                                                                    <th className="px-6 py-3 text-center">Birligi</th>
                                                                    <th className="px-6 py-3">Qo'shimcha</th>
                                                                    <th className="px-6 py-3 text-center">Amallar</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-[var(--border-color)]">
                                                                {group.items.map(item => {
                                                                    const isSelected = selectedIds.includes(item.id);
                                                                    const dateDisplay = item.created_at
                                                                        ? new Date(item.created_at).toLocaleDateString('ru-RU')
                                                                        : (item.last_updated ? new Date(item.last_updated).toLocaleDateString('ru-RU') : '-');
                                                                    const refItem = references?.find(r => r.id === item.reference_id) || {};
                                                                    const codeToDisplay = refItem.code || `AKS-${item.id}`;

                                                                    return (
                                                                        <tr key={item.id} className={`hover:bg-[var(--bg-card-hover)] transition-colors ${isSelected ? 'bg-purple-500/5' : ''}`}>
                                                                            <td className="px-6 py-3 text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--input-bg)] text-purple-600 focus:ring-purple-500 cursor-pointer transition-all"
                                                                                    checked={isSelected}
                                                                                    onChange={(e) => { e.stopPropagation(); setSelectedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]); }}
                                                                                />
                                                                            </td>
                                                                            <td className="px-6 py-3 text-xs text-[var(--text-primary)] font-bold">{dateDisplay}</td>
                                                                            <td className="px-6 py-3 font-medium text-[var(--text-secondary)] text-sm">{item.item_name}</td>
                                                                            <td className="px-6 py-3 font-mono font-black text-xl text-purple-400 uppercase bg-purple-500/10 rounded-lg inline-block my-1 px-3 border border-purple-500/20 shadow-sm" title={`Asl ID: AKS-${item.id}`}>{codeToDisplay}</td>
                                                                            <td className="px-6 py-3 text-right font-black text-[var(--text-primary)] text-sm">{Number(item.quantity).toFixed(2)}</td>
                                                                            <td className="px-6 py-3 text-center text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{item.unit}</td>
                                                                            <td className="px-6 py-3">
                                                                                <div className="text-[10px] text-[var(--text-secondary)] flex flex-col gap-0.5">
                                                                                    {(item.color || item.batch_number) ? (
                                                                                        <>
                                                                                            {item.color && <span><span className="font-bold opacity-70">Rangi:</span> {item.color}</span>}
                                                                                            {item.batch_number && <span><span className="font-bold opacity-70">Partiya:</span> {item.batch_number}</span>}
                                                                                        </>
                                                                                    ) : (
                                                                                        <span className="opacity-50 italic">-</span>
                                                                                    )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-6 py-3">
                                                                                <div className="flex items-center justify-center gap-1.5 transition-opacity">
                                                                                    <button onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setOutboundData({ inventory_id: item.id, quantity: '', reason: 'Ishlab chiqarishga' });
                                                                                        setShowOutboundModal(true);
                                                                                    }} className="p-1.5 text-[var(--text-secondary)] hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all border border-transparent hover:border-green-500/30" title="Chiqim"><ArrowUpRight size={14} /></button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); handlePrintQR(item, codeToDisplay); }} className="p-1.5 text-[var(--text-secondary)] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all border border-transparent hover:border-indigo-500/30" title="QR Chop etish"><Printer size={14} /></button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedItem(item); fetchHistory(item.id); setShowHistoryModal(true); }} className="p-1.5 text-[var(--text-secondary)] hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all border border-transparent hover:border-sky-500/30" title="Tarix"><History size={14} /></button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-1.5 text-[var(--text-secondary)] hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all border border-transparent hover:border-amber-500/30" title="Tahrir"><Edit size={14} /></button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="p-1.5 text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/30" title="O'chirish"><Trash2 size={14} /></button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>

                        {filteredInventory.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center text-[var(--text-secondary)]">
                                <Package size={48} className="mb-4 opacity-20" />
                                <span className="font-bold uppercase tracking-widest text-xs">Aksessuarlar topilmadi</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* INBOUND MODAL (Redesigned like MatoOmbori) */}
            {showInboundModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-[2rem] shadow-2xl relative custom-scrollbar">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)] z-10">
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Yangi Aksessuar Qabul Qilish</h3>
                            <button onClick={() => setShowInboundModal(false)} className="text-[var(--text-secondary)] hover:text-white"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleKirim}>
                            <div className="p-8 space-y-6">
                                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 uppercase tracking-widest">Aksessuar Ma'lumotlari</h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Sana</label>
                                        <input
                                            type="date"
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-purple-500 font-bold shadow-inner"
                                            value={inboundData.date}
                                            onChange={e => setInboundData({ ...inboundData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Nomi</label>
                                        <select
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-purple-500 transition-all font-bold appearance-none cursor-pointer placeholder-[var(--text-secondary)] shadow-inner"
                                            value={inboundData.selected_material_name}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const ref = references?.find(r => r.name === val);
                                                setInboundData({ ...inboundData, selected_material_name: val, unit: ref ? ref.unit : 'dona' });
                                            }}
                                            required
                                        >
                                            <option value="" className="bg-[var(--bg-card)] text-[var(--text-secondary)]">Tanlang...</option>
                                            {[...new Set((references || []).filter(r => r.type === 'Aksessuar').map(r => r.name))].map(n => (
                                                <option key={n} value={n} className="bg-[var(--bg-card)] text-[var(--text-primary)]">{n}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">ID</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-secondary)] font-mono font-bold cursor-not-allowed opacity-70"
                                            value="Saqlanganda beriladi"
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Kimdan (Manba)</label>
                                        <input
                                            list="in-source-suggestions"
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-purple-500 font-bold shadow-inner"
                                            value={inboundData.source || ''}
                                            onChange={e => setInboundData({ ...inboundData, source: e.target.value })}
                                            placeholder="Sotuvchi o'rnini yozing..."
                                        />
                                        <datalist id="in-source-suggestions">
                                            <option value="Bozor" />
                                            <option value="E'zonur" />
                                            <option value="Qaytim" />
                                        </datalist>
                                    </div>
                                    {(() => {
                                        const selectedRefs = references?.filter(r => r.name === inboundData.selected_material_name && r.type === 'Aksessuar') || [];

                                        if (selectedRefs.length > 0) {
                                            return (
                                                <div className="col-span-2 mt-2">
                                                    <label className="text-xs text-[var(--text-secondary)] mb-2 block font-bold">Miqdorlar (O'lcham/ID bo'yicha)</label>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-[var(--bg-body)] p-4 rounded-2xl border border-[var(--border-color)]">
                                                        {selectedRefs.map(ref => (
                                                            <div key={ref.id} className="bg-[var(--bg-card)] p-3 rounded-xl shadow-sm border border-[var(--border-color)]">
                                                                <div className="text-[10px] text-purple-400 font-black mb-1 truncate uppercase" title={ref.code || 'Asosiy'}>{ref.code || 'Asosiy'}</div>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg p-2 text-sm font-black text-[var(--text-primary)] outline-none focus:border-purple-500 shadow-inner pr-10"
                                                                        value={inboundData.quantities?.[ref.id] || ''}
                                                                        onChange={e => setInboundData({
                                                                            ...inboundData,
                                                                            quantities: { ...inboundData.quantities, [ref.id]: e.target.value }
                                                                        })}
                                                                        placeholder="0"
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-secondary)] font-bold">{ref.unit || inboundData.unit}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="col-span-2">
                                                <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Miqdor va Birlik</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-purple-500 font-bold pr-20 shadow-inner"
                                                        value={inboundData.quantity}
                                                        onChange={e => setInboundData({ ...inboundData, quantity: e.target.value })}
                                                        placeholder="0.00"
                                                        required={!inboundData.selected_material_name}
                                                    />
                                                    <select
                                                        className="absolute right-1 top-1 bottom-1 bg-[var(--bg-card)] text-xs text-[var(--text-secondary)] font-bold outline-none border-l border-[var(--border-color)] pl-2 rounded-r-xl"
                                                        value={inboundData.unit}
                                                        onChange={e => setInboundData({ ...inboundData, unit: e.target.value })}
                                                    >
                                                        <option value="dona">dona</option>
                                                        <option value="kg">kg</option>
                                                        <option value="metr">metr</option>
                                                        <option value="rulon">rulon</option>
                                                        <option value="quti">quti</option>
                                                        <option value="komplekt">komplekt</option>
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div>
                                    <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Izoh</label>
                                    <textarea
                                        placeholder="Qo'shimcha ma'lumotlar..."
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-purple-500 h-20 resize-none font-bold"
                                        value={inboundData.note}
                                        onChange={e => setInboundData({ ...inboundData, note: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-[var(--border-color)] flex justify-end gap-3 bg-[var(--bg-card)] sticky bottom-0 z-10">
                                <button type="button" onClick={() => setShowInboundModal(false)} className="px-6 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--bg-card-hover)]">Bekor qilish</button>
                                <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 shadow-lg shadow-purple-600/20 active:scale-95 transition-all flex items-center gap-2">
                                    <Plus size={16} /> Kiritish
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* OUTBOUND MODAL (Redesigned like MatoOmbori) */}
            {showOutboundModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-2xl rounded-[3rem] p-8 relative shadow-2xl">
                        <button onClick={() => setShowOutboundModal(false)} className="absolute top-8 right-8 p-2 bg-[var(--bg-body)] rounded-full text-[var(--text-secondary)] hover:text-rose-500 transition-colors"><X size={20} /></button>
                        <h3 className="text-2xl font-black mb-1 text-[var(--text-primary)]">Chiqim Qilish</h3>
                        <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-6">Ishlab chiqarish uchun tayyorlash</p>

                        <form onSubmit={handleChiqim} className="space-y-6">
                            <div className="bg-[var(--bg-body)] p-6 rounded-2xl border border-[var(--border-color)] flex justify-between items-center">
                                <div>
                                    <div className="text-[10px] uppercase font-black text-[var(--text-secondary)] mb-1">Aksessuar:</div>
                                    <div className="font-bold text-[var(--text-primary)]">{(inventory.find(i => i.id === outboundData.inventory_id) || {}).item_name || 'Hato'}</div>
                                    <div className="text-xs font-mono text-[var(--text-secondary)] mt-1">Sklad Qoldiq: <span className="text-[var(--text-primary)] font-bold">{(inventory.find(i => i.id === outboundData.inventory_id) || {}).quantity || 0}</span></div>
                                </div>
                                <div className="text-right">
                                    <label className="text-[10px] uppercase font-black text-[var(--text-secondary)] mb-1 block">Chiqim Miqdori:</label>
                                    <div className="flex items-center justify-end gap-2">
                                        <input
                                            type="number"
                                            className="w-32 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-2 text-xl text-[var(--text-primary)] text-right outline-none focus:border-rose-500 font-black shadow-inner"
                                            value={outboundData.quantity}
                                            onChange={e => setOutboundData({ ...outboundData, quantity: e.target.value })}
                                            placeholder="0.00"
                                            required
                                        />
                                        <span className="text-xs font-bold text-[var(--text-secondary)]">{(inventory.find(i => i.id === outboundData.inventory_id) || {}).unit}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Model (Plan)</label>
                                    <input
                                        list="out-model-suggestions"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-500 font-bold"
                                        value={outboundExtra.model}
                                        onChange={e => setOutboundExtra({ ...outboundExtra, model: e.target.value })}
                                        placeholder="Modelni tanlang..."
                                        required
                                    />
                                    <datalist id="out-model-suggestions">
                                        {(orders || []).map(o => <option key={o.id} value={o.models?.name || o.models?.model_name || o.model_name || o.order_number} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Qism / Izoh</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-500 font-bold"
                                        value={outboundExtra.part}
                                        onChange={e => setOutboundExtra({ ...outboundExtra, part: e.target.value })}
                                        placeholder="M: Zamok uchun"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Yosh / O'lcham</label>
                                    <select
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-500 font-bold"
                                        value={outboundExtra.age}
                                        onChange={e => setOutboundExtra({ ...outboundExtra, age: e.target.value })}
                                    >
                                        <option value="">Tanlang</option>
                                        <option value="2/5 yosh">2/5 yosh</option>
                                        <option value="6/9 yosh">6/9 yosh</option>
                                        <option value="10/14 yosh">10/14 yosh</option>
                                        <option value="S/M">S/M</option>
                                        <option value="L/XL">L/XL</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Qabul qildi / Bichuvchi</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-500 font-bold"
                                        value={outboundExtra.cutter}
                                        onChange={e => setOutboundExtra({ ...outboundExtra, cutter: e.target.value })}
                                        placeholder="Ism..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase mb-2 text-[var(--text-secondary)]">Qo'shimcha Izoh / Sabab</label>
                                <textarea
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-4 font-bold text-[var(--text-primary)] outline-none focus:border-rose-500 min-h-[80px] resize-none"
                                    value={outboundData.reason}
                                    onChange={e => setOutboundData({ ...outboundData, reason: e.target.value })}
                                    placeholder="Ishlab chiqarish uchun..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowOutboundModal(false)} className="flex-1 py-4 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-bold uppercase transition-all hover:bg-[var(--bg-card)]">
                                    Bekor qilish
                                </button>
                                <button type="submit" disabled={loading} className="flex-[3] py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black uppercase shadow-lg shadow-rose-600/30 transition-all active:scale-95">Tasdiqlash</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-[2rem] shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)] shrink-0">
                            <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                                <History size={24} className="text-purple-500" />
                                Tarix: <span className="text-[var(--text-secondary)] font-medium text-lg ml-2">{selectedItem.item_name}</span>
                            </h3>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="w-10 h-10 rounded-full bg-[var(--bg-body)] text-[var(--text-secondary)] hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-3 gap-4 bg-[var(--bg-body)]/50 shrink-0">
                            {(() => {
                                const totalIn = itemHistory.filter(h => h.type === 'In').reduce((a, b) => a + Number(b.quantity), 0);
                                const totalOut = itemHistory.filter(h => h.type === 'Out').reduce((a, b) => a + Number(b.quantity), 0);
                                const currentBalance = totalIn - totalOut;

                                return (
                                    <>
                                        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Jami Kirim</div>
                                            <div className="text-2xl font-black text-[var(--text-primary)]">+{totalIn.toFixed(2)}</div>
                                        </div>
                                        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Jami Chiqim</div>
                                            <div className="text-2xl font-black text-[var(--text-primary)]">-{totalOut.toFixed(2)}</div>
                                        </div>
                                        <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-1">Joriy Qoldiq</div>
                                            <div className="text-2xl font-black text-[var(--text-primary)]">{currentBalance.toFixed(2)}</div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
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
                                        {h.type === 'In' ? '+' : '-'}{Number(h.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-xl max-h-[95vh] overflow-y-auto rounded-[2rem] shadow-2xl relative custom-scrollbar">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)] z-10">
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Tahrirlash: {selectedItem.item_name}</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-[var(--text-secondary)] hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveEdit}>
                            <div className="p-8 space-y-4">
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Aksessuar Nomi</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-purple-500 font-bold"
                                        value={editData.item_name}
                                        onChange={e => setEditData({ ...editData, item_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Rangi</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-purple-500 font-bold"
                                            value={editData.color}
                                            onChange={e => setEditData({ ...editData, color: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Partiya</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-purple-500 font-bold"
                                            value={editData.batch_number}
                                            onChange={e => setEditData({ ...editData, batch_number: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Miqdor</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-purple-500 font-bold pr-16"
                                                value={editData.quantity}
                                                onChange={e => setEditData({ ...editData, quantity: e.target.value })}
                                                required
                                            />
                                            <select
                                                className="absolute right-1 top-1 bottom-1 bg-transparent text-xs text-[var(--text-secondary)] font-bold outline-none border-l border-[var(--border-color)] pl-2"
                                                value={editData.unit}
                                                onChange={e => setEditData({ ...editData, unit: e.target.value })}
                                            >
                                                <option value="dona">dona</option>
                                                <option value="kg">kg</option>
                                                <option value="metr">metr</option>
                                                <option value="rulon">rulon</option>
                                                <option value="quti">quti</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Kod (Pantone)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                className="w-12 h-11 rounded-xl bg-transparent border border-[var(--border-color)] cursor-pointer p-1"
                                                value={editData.color_code || '#cccccc'}
                                                onChange={e => setEditData({ ...editData, color_code: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-purple-500 font-mono font-bold"
                                                value={editData.color_code}
                                                onChange={e => setEditData({ ...editData, color_code: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Asl Izoh (O'zgartirib bo'lmaydi)</label>
                                    <textarea
                                        disabled
                                        className="w-full bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-secondary)] outline-none h-20 resize-none font-bold opacity-70"
                                        value={editData.note}
                                    />
                                </div>
                            </div>
                            <div className="p-6 border-t border-[var(--border-color)] flex justify-end gap-3 bg-[var(--bg-card)] sticky bottom-0 z-10">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--bg-card-hover)]">Bekor qilish</button>
                                <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 shadow-lg shadow-purple-600/20 active:scale-95 transition-all flex items-center gap-2">
                                    Saqlash
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AksessuarOmbori;
