import React, { useState, useEffect } from 'react';
import {
    ArrowUpRight, ArrowDownLeft, ScrollText, QrCode, Printer, Trash2, CircleCheck, RotateCcw, ChevronDown, ChevronUp, Edit, X, Search, Plus, History, Warehouse
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../../lib/supabase';

const MatoOmbori = ({ inventory, references, orders, onRefresh, viewMode }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showInboundModal, setShowInboundModal] = useState(false);
    const [showOutboundModal, setShowOutboundModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemRolls, setItemRolls] = useState([]);
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [subTab, setSubTab] = useState('kirim'); // 'kirim' | 'chiqim'
    const [outboundLogs, setOutboundLogs] = useState([]);
    const [outboundExtra, setOutboundExtra] = useState({
        model: '',
        part: '',
        age: '',
        cutter: 'Mastura' // Default as requested
    });

    // Missing States Restored
    const [selectedIds, setSelectedIds] = useState([]);


    useEffect(() => {
        if (subTab === 'chiqim') {
            const fetchOutbound = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('inventory_logs')
                    .select('*')
                    .eq('type', 'Out')
                    .order('created_at', { ascending: false });

                if (error) console.error(error);
                else setOutboundLogs(data || []);
                setLoading(false);
            };
            fetchOutbound();
        }
    }, [subTab]);

    // Selection State for Rolls (Multi-select)
    const [selectedRollIds, setSelectedRollIds] = useState([]);

    // Scanner State
    const [showScanner, setShowScanner] = useState(false);
    const [scannedRolls, setScannedRolls] = useState([]);
    const [rollSourceMap, setRollSourceMap] = useState({}); // Stores id -> source (string)

    useEffect(() => {
        let scanner = null;
        if (showScanner) {
            try {
                // Ensure DOM element exists
                const element = document.getElementById('reader');
                if (element) {
                    scanner = new Html5QrcodeScanner(
                        "reader",
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        /* verbose= */ false
                    );
                    scanner.render(handleScanSuccess, (err) => {
                        console.warn(err);
                    });
                }
            } catch (e) {
                console.error("Scanner init error:", e);
                alert("Kamerani ishga tushirib bo'lmadi. Iltimos brauzer ruxsatlarini tekshiring.");
                setShowScanner(false);
            }
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(e => console.error(e));
            }
        };
    }, [showScanner]); // Only restart if showScanner toggles. ScannedRolls dependency would restart scanner constantly.

    // Separate handler to avoid closure staleness if possible, but actually useEffect closure "traps" the initial state.
    // Solution: Use a Ref or just fetch DB and then check duplication in existing state via functional update.
    const handleScanSuccess = async (decodedText) => {
        try {
            let scanId = decodedText;
            try {
                // Attempt to parse validation data if QR contains JSON
                const parsed = JSON.parse(decodedText);
                if (parsed.id) scanId = parsed.id;
            } catch (e) {
                // Not JSON, continue with raw text
            }

            // check if already scanned
            setScannedRolls(prev => {
                if (prev.some(r => r.id === scanId)) {
                    return prev;
                }
                return prev; // We need to fetch data first, but let's check duplicates after fetch to be safe
            });

            // Fetch roll data
            const { data: rollData, error } = await supabase
                .from('inventory_rolls')
                .select(`*, inventory!inner(*)`)
                .eq('id', scanId)
                .single();

            if (error || !rollData) {
                console.warn('Scan Error:', error);
                // Try searching by roll_number if ID fail (fallback for legacy)
                const { data: rollByNum } = await supabase
                    .from('inventory_rolls')
                    .select(`*, inventory!inner(*)`)
                    .eq('roll_number', scanId)
                    .single();

                if (rollByNum) {
                    // Proceed with rollByNum
                    addScannedRoll(rollByNum);
                    return;
                }

                alert('Rulon topilmadi: ' + (decodedText.length > 20 ? 'QR Kod' : decodedText));
                return;
            }

            if (rollData.status === 'used') {
                // Prevent spamming alerts for the same roll
                if (window.lastAlertedRoll !== rollData.id) {
                    alert(`Diqqat! Bu rulon ishlatilgan: ${rollData.roll_number}`);
                    window.lastAlertedRoll = rollData.id;
                    // Reset after 3 seconds to allow re-alert if scanned again later
                    setTimeout(() => { window.lastAlertedRoll = null; }, 3000);
                }
                return;
            }

            // Reset alert cache on success
            window.lastAlertedRoll = null;
            addScannedRoll(rollData);

        } catch (e) {
            console.error(e);
        }
    };


    const addScannedRoll = (rollData) => {
        setScannedRolls(prev => {
            if (prev.some(r => r.id === rollData.id)) return prev;

            // Consistency Check REMOVED to allow mixed batches
            // if (prev.length > 0) {
            //     if (prev[0].inventory_id !== rollData.inventory_id) {
            //         alert(`Xatolik! Aralash partiya. \nKutilmoqda: ${prev[0].inventory?.item_name}\nTopildi: ${rollData.inventory?.item_name}`);
            //         return prev;
            //     }
            // }
            return [...prev, rollData];
        });
    };

    // Clear selection when changing rows
    useEffect(() => {
        setSelectedRollIds([]);
    }, [expandedRowId]);

    const toggleRollSelection = (rollId) => {
        setSelectedRollIds(prev =>
            prev.includes(rollId)
                ? prev.filter(id => id !== rollId)
                : [...prev, rollId]
        );
    };

    const handleBulkChiqim = (item, rolls) => {
        if (!rolls || rolls.length === 0) return;

        const totalWeight = rolls.reduce((sum, r) => sum + Number(r.weight), 0);

        // Allow mixed items (item might be null or just one of them)
        setOutboundData({
            inventory_id: item ? item.id : 'MIXED', // Flag for mixed
            quantity: totalWeight, // Display total
            inventory_name: item ? item.item_name : 'Aralash Partiya',
            selected_rolls: rolls,
            reason: 'Kesimga' // Default
        });
        setShowOutboundModal(true);
    };

    // NEW: Local Inventory state to handle missing 'source' via logs
    const [localInventory, setLocalInventory] = useState([]);

    // EFFECT: Sync props to local state AND fetch logs for missing sources
    useEffect(() => {
        const enrichInventory = async () => {
            if (!inventory) {
                setLocalInventory([]);
                return;
            }

            // 1. Initial set from props
            let enriched = [...inventory];

            // 2. Identify items missing source
            const idsToCheck = enriched.filter(i => !i.source).map(i => i.id);

            if (idsToCheck.length > 0) {
                try {
                    // Fetch logs for these items
                    const { data: logs } = await supabase
                        .from('inventory_logs')
                        .select('inventory_id, reason')
                        .in('inventory_id', idsToCheck)
                        .order('created_at', { ascending: false });

                    if (logs && logs.length > 0) {
                        enriched = enriched.map(item => {
                            if (item.source) return item; // already has source

                            let foundSource = null;

                            // A. Check for 'Correction' log: "Updated [SOURCE]"
                            const updateLog = logs.find(l => l.inventory_id === item.id && l.reason && l.reason.includes('Updated ['));
                            if (updateLog) {
                                const match = updateLog.reason.match(/Updated \[(.*?)\]/);
                                if (match && match[1]) foundSource = match[1];
                            }

                            // B. Check for Initial log: "SOURCE | ..."
                            if (!foundSource) {
                                const initialLog = logs.find(l => l.inventory_id === item.id && l.reason && l.reason.includes('|'));
                                if (initialLog) {
                                    const parts = initialLog.reason.split('|');
                                    if (parts.length > 0) foundSource = parts[0].trim();
                                }
                            }

                            return foundSource ? { ...item, source: foundSource } : item;
                        });
                    }
                } catch (e) {
                    console.error("Error enriching inventory sources:", e);
                }
            }

            setLocalInventory(enriched);
        };

        enrichInventory();
    }, [inventory]);

    // Filter - Use localInventory instead of inventory prop
    const filteredInventory = localInventory.filter(item => {
        const query = searchTerm.toLowerCase();
        return (
            !searchTerm ||
            (item.item_name || '').toLowerCase().includes(query) ||
            (item.color || '').toLowerCase().includes(query) ||
            (item.color_code || '').toLowerCase().includes(query) ||
            (item.material_types?.thread_type || '').toLowerCase().includes(query) ||
            (item.material_types?.grammage || '').toString().includes(query) ||
            (item.batch_number || '').toLowerCase().includes(query) ||
            (item.source || '').toLowerCase().includes(query)
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
        rolls: [],
        source: "E'zonur" // Default source
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
        id: null,
        date: '',
        item_name: '',
        reference_id: '',
        color: '',
        color_code: '',
        batch_number: '',
        quantity: 0,
        rolls: [],
        deletedRolls: [], // To track rolls removed during edit
        note: '', // Try to fetch from 'In' log
        source: '',
        // Specs for display/reference connection
        type_specs: '',
        grammage: '',
        width: ''
    });

    // ... (existing code)

    const handleEdit = async (item) => {
        setLoading(true);
        try {
            // 1. Fetch Rolls
            const { data: rolls, error: rollsError } = await supabase
                .from('inventory_rolls')
                .select('*')
                .eq('inventory_id', item.id)
                .order('id', { ascending: true });

            if (rollsError) throw rollsError;

            // Sort rolls
            const sortedRolls = (rolls || []).sort((a, b) => {
                const aNum = parseInt(a.roll_number.split('-').pop());
                const bNum = parseInt(b.roll_number.split('-').pop());
                return (aNum && bNum) ? aNum - bNum : a.roll_number.localeCompare(b.roll_number);
            });

            // 2. Fetch 'In' log for Note (Reason)
            const { data: logs, error: logError } = await supabase
                .from('inventory_logs')
                .select('reason, created_at')
                .eq('inventory_id', item.id)
                .eq('type', 'In')
                .order('created_at', { ascending: true })
                .limit(1);

            const initialLog = logs && logs.length > 0 ? logs[0] : null;

            // Extract specs from reference or log if possible, but mainly rely on references
            const ref = references?.find(r => r.id === item.reference_id);

            // Prepare Edit Data
            setEditData({
                id: item.id,
                date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                item_name: item.item_name || '',
                reference_id: item.reference_id || '',
                // Try to find source in logs if not in item
                source: item.source || (() => {
                    // Check logs for "Updated [SOURCE]" pattern (latest correction log)
                    const correctionLog = logs && logs.find(l => l.reason && l.reason.includes('Updated ['));
                    if (correctionLog) {
                        const match = correctionLog.reason.match(/Updated \[(.*?)\]/);
                        if (match && match[1]) return match[1];
                    }
                    // Check initial log for "SOURCE |" pattern
                    const initial = logs && logs.find(l => l.reason && l.reason.includes('|'));
                    if (initial) {
                        const parts = initial.reason.split('|');
                        if (parts.length > 0) return parts[0].trim();
                    }
                    return '';
                })(),
                color: item.color || '',
                color_code: item.color_code || '',
                batch_number: item.batch_number || '',
                quantity: item.quantity || 0,

                rolls: sortedRolls, // Keep full objects: {id, roll_number, weight, status}
                deletedRolls: [],

                note: initialLog ? initialLog.reason : '',

                type_specs: ref?.thread_type || '', // We don't save these to inventory, just for UI context
                grammage: ref?.grammage || '',
                width: ref?.width || ''
            });

            setSelectedItem(item);
            setShowEditModal(true);

        } catch (error) {
            console.error(error);
            alert("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            // 1. Calculate new total from rolls logic (Edit modal should enforce consistency)
            // But user might edit quantity manually? In inbound quantity is sum of rolls.
            // Let's recalculate quantity from rolls to be safe and consistent.
            const newTotalWeight = editData.rolls.reduce((sum, r) => sum + Number(r.weight), 0);

            // 2. Validation
            if (editData.rolls.length === 0) {
                alert("Xatolik: Rulonlar mavjud emas!");
                setLoading(false);
                return;
            }

            // 3. Update Inventory Header
            const { error: updateError } = await supabase
                .from('inventory')
                .update({
                    item_name: editData.item_name,
                    color: editData.color,
                    color_code: editData.color_code,
                    batch_number: editData.batch_number,
                    quantity: newTotalWeight,
                    reference_id: editData.reference_id || null,
                    // source: editData.source, // TEMPORARILY DISABLED: Column might be missing in DB. Keep disabled until confirmed.

                    // FALLBACK: Since 'grammage', 'width', 'type_specs' columns might not exist in DB yet,

                    last_updated: new Date()
                })
                .eq('id', editData.id);

            // Log the update effectively as a 'Correction'
            // This is a temporary workaround until DB schema is fixed.
            const newSpecsNote = `Updated [${editData.source || 'N/A'}] | Specs: ${editData.type_specs}, ${editData.grammage}gr, ${editData.width}sm`;
            await supabase.from('inventory_logs').insert([{
                inventory_id: editData.id,
                type: 'Correction',
                quantity: 0,
                reason: newSpecsNote,
                batch_number: editData.batch_number,
                created_at: new Date()
            }]);

            if (updateError) throw updateError;

            // 4. Handle Rolls Updates

            // A. Delete removed rolls directly
            if (editData.deletedRolls.length > 0) {
                await supabase.from('inventory_rolls').delete().in('id', editData.deletedRolls);
            }

            // B. Upsert (Update or Insert) current rolls
            // We need to handle 'New' rolls (no ID) and 'Existing' rolls (have ID)
            const rollsToUpsert = [];

            // Get max sequence for naming new rolls if needed
            // But wait, existing rolls have names. New rolls need names.
            // A simple strategy for new rolls: Find highest index in current names

            let maxIndex = 0;
            // Scan current rolls to find max index in "batch-Index"
            // Also need to consider deleted rolls? No, just find free index or append? 
            // Safest: Append from max found.

            editData.rolls.forEach(r => {
                if (r.roll_number) {
                    const parts = r.roll_number.split('-');
                    const num = parseInt(parts[parts.length - 1]);
                    if (!isNaN(num) && num > maxIndex) maxIndex = num;
                }
            });

            // Prepare operations
            for (let i = 0; i < editData.rolls.length; i++) {
                const roll = editData.rolls[i];
                if (roll.id) {
                    // Update existing
                    await supabase.from('inventory_rolls').update({
                        weight: roll.weight,
                        roll_number: roll.roll_number, // User currently can't edit name, but if we allow re-sequencing... let's keep it simple
                        // Ensure batch number in roll_number matches new batch number?
                        // If batch_number changed, we should technically rename ALL rolls.
                        // Let's doing it:
                        roll_number: `${editData.batch_number}-${roll.roll_number.split('-').pop()}`
                    }).eq('id', roll.id);
                } else {
                    // Insert New
                    maxIndex++;
                    const newRollNumber = `${editData.batch_number}-${maxIndex}`;
                    await supabase.from('inventory_rolls').insert([{
                        inventory_id: editData.id,
                        roll_number: newRollNumber,
                        weight: roll.weight,
                        status: 'in_stock'
                    }]);
                }
            }

            // 5. Log "Correction" if total weight changed
            const oldQty = Number(selectedItem.quantity || 0);
            const diff = newTotalWeight - oldQty;

            if (Math.abs(diff) > 0.001) {
                await supabase.from('inventory_logs').insert([{
                    inventory_id: editData.id,
                    type: diff > 0 ? 'In' : 'Out',
                    quantity: Math.abs(diff),
                    reason: `Tahrir (Correction): To'liq o'zgartirish. ${oldQty} -> ${newTotalWeight}`,
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
        try {
            // 1. Fetch Rolls
            const { data: rollsData, error: rollsError } = await supabase
                .from('inventory_rolls')
                .select('*')
                .eq('inventory_id', inventoryId)
                .order('id', { ascending: true });

            if (rollsError) throw rollsError;

            // 2. Fetch Logs for Source Detection
            const { data: logsData, error: logsError } = await supabase
                .from('inventory_logs')
                .select('created_at, reason, type')
                .eq('inventory_id', inventoryId)
                .order('created_at', { ascending: true });

            if (!logsError && logsData) {
                // Strategy: Time-Based Matching (Closest Log)
                // This resists sequence errors caused by deleted rolls/logs.
                // We use a wide window (24h) to catch matches even if there are small time drifts,
                // but we strictly pick the CLOSEST log.

                const validLogs = logsData.filter(l =>
                    l.type === 'In' || (l.type === 'Correction' && l.quantity > 0)
                );

                const newSourceMap = {};
                rollsData.forEach(roll => {
                    if (!roll.created_at) return;
                    const rollTime = new Date(roll.created_at).getTime();
                    if (isNaN(rollTime)) return;

                    let bestLog = null;
                    let minDiff = 86400000; // 24 hours threshold

                    validLogs.forEach(log => {
                        const logTime = new Date(log.created_at).getTime();
                        const diff = Math.abs(logTime - rollTime);

                        if (diff < minDiff) {
                            minDiff = diff;
                            bestLog = log;
                        }
                    });

                    if (bestLog && bestLog.reason) {
                        const upper = bestLog.reason.toUpperCase();
                        if (upper.includes("KESIM")) {
                            newSourceMap[roll.id] = "KESIM";
                        } else if (upper.includes("FABRIKA")) {
                            newSourceMap[roll.id] = "FABRIKA";
                        } else if (upper.includes("E'ZONUR")) {
                            newSourceMap[roll.id] = "E'ZONUR";
                        } else {
                            const parts = bestLog.reason.split('|');
                            if (parts.length > 0) newSourceMap[roll.id] = parts[0].trim().toUpperCase();
                        }
                    }
                });
                setRollSourceMap(prev => ({ ...prev, ...newSourceMap }));
            }

            // Sort by roll number numerically if possible
            const sorted = (rollsData || []).sort((a, b) => {
                const aNum = parseInt(a.roll_number.split('-').pop());
                const bNum = parseInt(b.roll_number.split('-').pop());
                return (aNum && bNum) ? aNum - bNum : a.roll_number.localeCompare(b.roll_number);
            });
            setItemRolls(sorted);

        } catch (error) {
            console.error("Error fetching rolls:", error);
            setItemRolls([]);
        } finally {
            setLoading(false);
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
        // Deduplicate rolls to prevent double printing
        const uniqueRolls = [];
        const seenIds = new Set();
        rolls.forEach(r => {
            if (!seenIds.has(r.id)) {
                seenIds.add(r.id);
                uniqueRolls.push(r);
            }
        });

        const printWindow = window.open('', '_blank');
        const content = uniqueRolls.map(roll => {
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
                        // source: inboundData.source, // REMOVED: Column does not exist
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
            // Include Source in the log reason since column is missing
            const sourceStr = inboundData.source ? `${inboundData.source} | ` : '';
            const finalNote = `${sourceStr}${inboundData.note || 'Yangi kirim'} | ${specsStr}`;

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
                rolls: [],
                source: "E'zonur"
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

            // Group rolls by inventory_id to handle Mixed Batches
            const rollsByInventory = {};

            // If we have selected rolls, use them to group
            if (outboundData.selected_rolls.length > 0) {
                outboundData.selected_rolls.forEach(r => {
                    if (!rollsByInventory[r.inventory_id]) rollsByInventory[r.inventory_id] = [];
                    rollsByInventory[r.inventory_id].push(r);
                });
            } else {
                // Fallback for manual non-roll outbound (single item)
                if (outboundData.inventory_id && outboundData.inventory_id !== 'MIXED') {
                    rollsByInventory[outboundData.inventory_id] = [];
                }
            }

            const inventoryIds = Object.keys(rollsByInventory);

            if (inventoryIds.length === 0) {
                // Pure manual outbound without rolls?
                // Current logic supports this found in original handleChiqim
                // Let's support it for backward compat if inventory_id is set
                if (outboundData.inventory_id && outboundData.inventory_id !== 'MIXED') {
                    inventoryIds.push(outboundData.inventory_id);
                } else {
                    throw new Error("Chiqim qilish uchun ma'lumot yetarli emas");
                }
            }

            // Common Reason
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

            // Process each inventory group
            for (const invId of inventoryIds) {
                const groupRolls = rollsByInventory[invId] || [];
                const item = inventory.find(i => i.id == invId);

                if (!item) continue;

                // Calculate quantity for this group
                // If rolls exist, sum them. If not (manual), use outboundData.quantity (only if single item)
                let qtyToDeduct = 0;
                if (groupRolls.length > 0) {
                    qtyToDeduct = groupRolls.reduce((sum, r) => sum + Number(r.weight), 0);
                } else if (inventoryIds.length === 1) {
                    qtyToDeduct = Number(outboundData.quantity);
                }

                // Check stock
                if (qtyToDeduct > Number(item.quantity)) {
                    throw new Error(`"${item.item_name}" (Partiya: ${item.batch_number}) uchun yetarli qoldiq yo'q! So'raldi: ${qtyToDeduct}, Bor: ${item.quantity}`);
                }

                // 2. Rolls Update
                if (groupRolls.length > 0) {
                    const rollIds = groupRolls.map(r => r.id);
                    const { error } = await supabase.from('inventory_rolls')
                        .update({ status: 'used' })
                        .in('id', rollIds);
                    if (error) throw error;
                }

                // 3. Inventory Update
                const newQty = Number(item.quantity) - qtyToDeduct;
                await supabase.from('inventory').update({ quantity: newQty, last_updated: new Date() }).eq('id', item.id);

                // 4. Log
                const { error: logError } = await supabase.from('inventory_logs').insert([{
                    inventory_id: item.id,
                    type: 'Out',
                    quantity: qtyToDeduct,
                    reason: finalReasonBase,
                    batch_number: item.batch_number
                }]);

                if (logError) throw logError;
            }

            alert('Chiqim bajarildi!');
            setShowOutboundModal(false);
            setOutboundData({ inventory_id: '', inventory_name: '', quantity: '', order_id: '', reason: '', selected_rolls: [] });
            setOutboundExtra({ model: '', part: '', age: '', cutter: 'Mastura' });
            onRefresh();

            // Refresh actions
            if (expandedRowId) fetchRolls(expandedRowId);

        } catch (error) {
            console.error(error);
            alert('Xatolik: ' + error.message);
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

    const filteredOutboundLogs = outboundLogs.filter(log => {
        if (!searchTerm) return true;
        const lowSearch = searchTerm.toLowerCase();
        const propItem = (inventory || []).find(i => i.id === log.inventory_id);
        const item = propItem || log.inventory || {};
        const reason = log.reason || '';

        return (
            (item.item_name && item.item_name.toLowerCase().includes(lowSearch)) ||
            (item.color && item.color.toLowerCase().includes(lowSearch)) ||
            (log.batch_number && log.batch_number.toLowerCase().includes(lowSearch)) ||
            reason.toLowerCase().includes(lowSearch)
        );
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Tabs */}
            <div className="flex gap-2 p-1 my-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-max">
                <button
                    onClick={() => { setSubTab('kirim'); setSearchTerm(''); }}
                    className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${subTab === 'kirim' ? 'bg-indigo-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
                >
                    Kirim Bo'limi
                </button>
                <button
                    onClick={() => { setSubTab('chiqim'); setSearchTerm(''); }}
                    className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${subTab === 'chiqim' ? 'bg-indigo-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
                >
                    Chiqim Bo'limi
                </button>
            </div>

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
                            placeholder={subTab === 'kirim' ? "Qidirish... (ID, Partiya, Rang)" : "Qidirish... (Chiqim loglari)"}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl outline-none text-[var(--text-primary)] font-bold transition-all shadow-inner focus:border-indigo-500/50"
                        />
                    </div>
                    <div className="flex gap-3">
                        {subTab === 'chiqim' && (
                            <button
                                onClick={() => {
                                    setLoading(true);
                                    // Manually re-trigger fetch
                                    const fetchOutbound = async () => {
                                        const { data } = await supabase
                                            .from('inventory_logs')
                                            .select('*')
                                            .eq('type', 'Out')
                                            .order('created_at', { ascending: false });
                                        setOutboundLogs(data || []);
                                        setLoading(false);
                                    };
                                    fetchOutbound();
                                }}
                                className="px-4 py-4 rounded-xl border border-[var(--border-color)] text-indigo-500 font-bold hover:bg-indigo-500/10 transition-all flex items-center gap-2"
                            >
                                <RotateCcw size={18} />
                            </button>
                        )}
                        <button
                            onClick={() => { setShowScanner(true); setScannedRolls([]); }}
                            className="px-4 py-4 rounded-2xl border border-[var(--border-color)] text-emerald-500 font-bold hover:bg-emerald-500/10 transition-all flex items-center gap-2"
                        >
                            <QrCode size={20} /> <span className="hidden sm:inline">Scan</span>
                        </button>
                        <button className="px-6 py-4 rounded-2xl border border-[var(--border-color)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-card-hover)] transition-all">Filtrlar</button>
                        {subTab === 'kirim' && (
                            <button
                                onClick={() => setShowInboundModal(true)}
                                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 font-black uppercase text-xs tracking-widest border border-indigo-400/20 flex items-center gap-2"
                            >
                                <Plus size={18} /> Mato Kirimi
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Main Table */}
            {subTab === 'chiqim' ? (
                <div className="overflow-hidden bg-[var(--bg-card)] backdrop-blur-3xl rounded-3xl border border-[var(--border-color)] shadow-2xl min-h-[500px] animate-in fade-in">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--bg-sidebar-footer)] text-[var(--text-secondary)] text-[11px] font-black uppercase tracking-wider border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-6 py-5">Sana</th>
                                <th className="px-6 py-5">Mato Turi</th>
                                <th className="px-6 py-5">Rang</th>
                                <th className="px-6 py-5">Turi</th>
                                <th className="px-6 py-5">Partiya</th>
                                <th className="px-6 py-5 text-right">Jami Chiqim</th>
                                <th className="px-6 py-5">Model</th>
                                <th className="px-6 py-5">Qism</th>
                                <th className="px-6 py-5">Yosh</th>
                                <th className="px-6 py-5">Bichuvchi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {filteredOutboundLogs.map(log => {
                                const propItem = (inventory || []).find(i => i.id === log.inventory_id);
                                const item = propItem || log.inventory || {};
                                const reason = log.reason || '';
                                const extract = (k) => {
                                    const m = reason.match(new RegExp(`\\[${k}: (.*?)\\]`));
                                    return m ? m[1] : '-';
                                };
                                const extractedModel = extract('Model');
                                let model = extractedModel;
                                // Try to resolve Model Name if it looks like an Order Number
                                const matchedOrder = (orders || []).find(o => o.order_number === model || o.model_name === model);
                                if (matchedOrder) {
                                    model = matchedOrder.models?.name || matchedOrder.model_name || model;
                                }

                                const part = extract('Qism');
                                const age = extract('Yosh');
                                const cutter = extract('Bichuvchi');

                                const ref = references?.find(r => r.id === item.reference_id) || {};
                                const typeStr = item.material_types?.thread_type || ref.thread_type || item.type_specs || '-';

                                return (
                                    <tr key={log.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                                        <td className="px-6 py-5 text-sm font-bold text-[var(--text-primary)]">
                                            {new Date(log.created_at).toLocaleDateString('ru-RU')}
                                        </td>
                                        <td className="px-6 py-5 font-black text-sm">{item.item_name || '-'}</td>
                                        <td className="px-6 py-5 text-xs font-bold">{item.color || '-'}</td>
                                        <td className="px-6 py-5 text-xs text-[var(--text-secondary)]">{typeStr}</td>
                                        <td className="px-6 py-5 text-xs font-mono">{log.batch_number || item.batch_number || '-'}</td>
                                        <td className="px-6 py-5 text-right font-black text-rose-500 text-lg">{log.quantity} kg</td>
                                        <td className="px-6 py-5 text-xs font-bold text-indigo-400">{model}</td>
                                        <td className="px-6 py-5 text-xs">{part}</td>
                                        <td className="px-6 py-5 text-xs text-[var(--text-secondary)]">{age}</td>
                                        <td className="px-6 py-5 text-xs font-bold">{cutter}</td>
                                    </tr>
                                );
                            })}
                            {filteredOutboundLogs.length === 0 && (
                                <tr><td colSpan="10" className="p-10 text-center text-[var(--text-secondary)]">Chiqimlar mavjud emas (debug: {outboundLogs.length} ta)</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3 pb-20">
                        {filteredInventory.map(item => (
                            <div key={item.id} className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)] shadow-sm relative overflow-hidden">
                                {selectedIds.includes(item.id) && <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-500 rounded-bl-lg"></div>}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id])}
                                            className="w-5 h-5 rounded border-[var(--border-color)] bg-[var(--input-bg)]"
                                        />
                                        <span className="font-bold text-[var(--text-primary)] text-sm">#{item.id}</span>
                                    </div>
                                    <span className="font-black text-indigo-400 text-lg">{item.quantity} kg</span>
                                </div>

                                <div className="mb-3 pl-8">
                                    <div className="font-bold text-[var(--text-primary)] leading-tight">{item.item_name}</div>
                                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1">
                                        <div className="w-3 h-3 rounded-full border border-[var(--border-color)]" style={{ backgroundColor: item.color_code || '#ccc' }}></div>
                                        {item.color} | {item.material_types?.thread_type || '-'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs mb-3 pl-8">
                                    <div className="bg-[var(--bg-body)] p-2 rounded text-[var(--text-secondary)]">Pr: <span className="font-bold text-[var(--text-primary)]">{item.batch_number || '-'}</span></div>
                                    <div className="bg-[var(--bg-body)] p-2 rounded text-[var(--text-secondary)]">Mn: <span className="font-bold text-[var(--text-primary)]">{item.source || '-'}</span></div>
                                </div>

                                <div className="flex gap-2 pl-8">
                                    <button onClick={() => toggleRow(item)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${expandedRowId === item.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-[var(--bg-body)] text-[var(--text-secondary)] border-[var(--border-color)]'}`}>
                                        {expandedRowId === item.id ? 'Yopish' : "Ro'yxat"}
                                    </button>
                                    <button onClick={() => { setSelectedItem(item); toggleRow(item); }} className="p-2 text-[var(--text-secondary)] bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg">
                                        <QrCode size={16} />
                                    </button>
                                    <button onClick={() => handleEdit(item)} className="p-2 text-[var(--text-secondary)] bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg">
                                        <Edit size={16} />
                                    </button>
                                </div>

                                {expandedRowId === item.id && (
                                    <div className="mt-3 pt-3 border-t border-[var(--border-color)] pl-8">
                                        {itemRolls.length > 0 ? (
                                            <div className="space-y-2">
                                                {itemRolls.map(r => (
                                                    <div key={r.id} className="flex justify-between items-center text-xs bg-[var(--bg-body)] p-2 rounded border border-[var(--border-color)]">
                                                        <div className="font-mono">{r.roll_number}</div>
                                                        <div className="font-bold text-emerald-500">{r.weight} kg</div>
                                                    </div>
                                                ))}
                                                <div className="text-center pt-2">
                                                    <button onClick={() => {
                                                        setSubTab('chiqim');
                                                        handleBulkChiqim(item, itemRolls.filter(r => r.status !== 'used'));
                                                    }} className="text-xs text-indigo-400 font-bold underline">Barchasini Chiqim Qilish</button>
                                                </div>
                                            </div>
                                        ) : <div className="text-center text-xs opacity-50 py-2">Rulonlar topilmadi</div>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:block overflow-hidden bg-[var(--bg-card)] backdrop-blur-3xl rounded-3xl border border-[var(--border-color)] shadow-2xl min-h-[500px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[var(--bg-sidebar-footer)] text-[var(--text-secondary)] text-[11px] font-black uppercase tracking-wider border-b border-[var(--border-color)]">
                                <tr>
                                    <th className="px-6 py-5 text-center w-12">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg bg-[var(--input-bg)] border-[var(--border-color)] checked:bg-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                                            checked={selectedIds.length === filteredInventory.length && filteredInventory.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedIds(filteredInventory.map(i => i.id));
                                                else setSelectedIds([]);
                                            }}
                                        />
                                    </th>
                                    <th className="px-6 py-5">Sana / ID</th>
                                    <th className="px-6 py-5">Mato Turi</th>
                                    <th className="px-6 py-5">Rang</th>
                                    <th className="px-6 py-5">Turi</th>
                                    <th className="px-6 py-5">Partiya</th>
                                    <th className="px-6 py-5 text-center">Rulonlar</th>
                                    <th className="px-6 py-5 text-right">Jami Og'irlik</th>
                                    <th className="px-6 py-5">Kimdan</th>
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
                                                        onChange={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}
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
                                                <td className="px-6 py-5 font-bold text-[var(--text-secondary)] text-xs uppercase">{item.source || '-'}</td>
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
                                                                    {selectedRollIds.length > 0 && (
                                                                        <button
                                                                            onClick={() => {
                                                                                const selectedRolls = itemRolls.filter(r => selectedRollIds.includes(r.id));
                                                                                handleBulkChiqim(item, selectedRolls);
                                                                            }}
                                                                            className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors animate-in fade-in zoom-in"
                                                                        >
                                                                            Tanlanganlarni Chiqim Qilish ({selectedRollIds.length})
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-[var(--text-secondary)] font-bold">Jami: {itemRolls.length} ta rulon</span>
                                                            </div>

                                                            <table className="w-full text-left text-sm">
                                                                <thead className="text-[10px] uppercase text-[var(--text-secondary)] font-bold border-b border-[var(--border-color)] bg-[var(--bg-card)]">
                                                                    <tr>
                                                                        <th className="px-6 py-3 w-10">
                                                                            <input
                                                                                type="checkbox"
                                                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                                                checked={itemRolls.filter(r => r.status !== 'used').length > 0 && itemRolls.filter(r => r.status !== 'used').every(r => selectedRollIds.includes(r.id))}
                                                                                onChange={(e) => {
                                                                                    if (e.target.checked) {
                                                                                        const allIds = itemRolls.filter(r => r.status !== 'used').map(r => r.id);
                                                                                        setSelectedRollIds(allIds);
                                                                                    } else {
                                                                                        setSelectedRollIds([]);
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </th>
                                                                        <th className="px-6 py-3">ID Raqam</th>
                                                                        <th className="px-6 py-3 text-right">Og'irlik (Kg)</th>
                                                                        <th className="px-6 py-3 text-center">Holati</th>
                                                                        <th className="px-6 py-3 text-center">Kimdan</th>
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
                                                                                <td className="px-6 py-3 w-10">
                                                                                    {roll.status !== 'used' && (
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={selectedRollIds.includes(roll.id)}
                                                                                            onChange={() => toggleRollSelection(roll.id)}
                                                                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                                                        />
                                                                                    )}
                                                                                </td>
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
                                                                                <td className="px-6 py-3 text-center font-bold text-[10px] uppercase text-[var(--text-secondary)]">
                                                                                    {rollSourceMap[roll.id] || item.source || "E'ZONUR"}
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
                </div>
            )}



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
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Kimdan (Manba)</label>
                                            <input
                                                list="source-suggestions"
                                                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 font-bold"
                                                value={inboundData.source}
                                                onChange={e => setInboundData({ ...inboundData, source: e.target.value })}
                                                placeholder="Tanlang yoki yozing..."
                                            />
                                            <datalist id="source-suggestions">
                                                <option value="E'zonur" />
                                                <option value="Kesim" />
                                                <option value="Buzilgan (Qayta)" />
                                                <option value="Boshqa" />
                                                {[...new Set(localInventory?.map(i => i.source).filter(Boolean) || [])]
                                                    .filter(s => !["E'zonur", "Kesim", "Buzilgan (Qayta)", "Buzilgan", "Boshqa"].includes(s))
                                                    .map(s => <option key={s} value={s} />)
                                                }
                                            </datalist>
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
                                                        className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full text-white text-[10px] flex items-center justify-center hover:scale-110 transition-transform font-bold opacity-0 group-hover:opacity-100">Г—</button>
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

                                <div className="mt-4 flex gap-2 mb-24">
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
                                    <span className="text-3xl font-black text-[var(--text-primary)]">{Number(outboundData.quantity).toFixed(2)} <span className="text-sm text-[var(--text-secondary)]">kg</span></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Model (Plan)</label>
                                    <input
                                        list="model-suggestions"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-500 font-bold"
                                        value={outboundExtra.model}
                                        onChange={e => setOutboundExtra({ ...outboundExtra, model: e.target.value })}
                                        placeholder="Modelni tanlang..."
                                        required
                                    />
                                    <datalist id="model-suggestions">
                                        {(orders || []).map(o => <option key={o.id} value={o.models?.name || o.models?.model_name || o.model_name || o.order_number} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Qism</label>
                                    <select
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-500 font-bold"
                                        value={outboundExtra.part}
                                        onChange={e => setOutboundExtra({ ...outboundExtra, part: e.target.value })}
                                    >
                                        <option value="">Tanlang</option>
                                        <option value="Futbolka">Futbolka</option>
                                        <option value="Shalvar">Shalvar</option>
                                        <option value="Mayka">Mayka</option>
                                        <option value="Kofta">Kofta</option>
                                        <option value="Boshqa">Boshqa</option>
                                    </select>
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
                                    <label className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Bichuvchi</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-rose-500 font-bold"
                                        value={outboundExtra.cutter}
                                        onChange={e => setOutboundExtra({ ...outboundExtra, cutter: e.target.value })}
                                        placeholder="Ism"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase mb-2 text-[var(--text-secondary)]">Qo'shimcha Izoh</label>
                                <textarea
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-4 font-bold text-[var(--text-primary)] outline-none focus:border-rose-500 min-h-[80px]"
                                    value={outboundData.reason}
                                    onChange={e => setOutboundData({ ...outboundData, reason: e.target.value })}
                                    placeholder="Masalan: Kesim bo'limiga"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowOutboundModal(false);
                                        setShowScanner(true);
                                    }}
                                    className="flex-1 py-4 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-bold uppercase transition-all hover:bg-[var(--bg-card)] flex items-center justify-center gap-2"
                                >
                                    <QrCode size={20} />
                                    <span className="text-xs">Qo'shish</span>
                                </button>
                                <button className="flex-[3] py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black uppercase shadow-lg shadow-rose-600/30 transition-all active:scale-95">Tasdiqlash</button>
                            </div>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-[2rem] shadow-2xl relative custom-scrollbar">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)] z-10">
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Tahrirlash</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-[var(--text-secondary)] hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Left: Form */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 uppercase tracking-widest">Partiya Ma'lumotlari</h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Sana (Yaratilgan)</label>
                                            <input
                                                type="date"
                                                disabled // Keep creation date immutable or allow edit? Usually immutable.
                                                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-secondary)] outline-none font-bold opacity-50 cursor-not-allowed"
                                                value={editData.date}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Partiya Raqami</label>
                                            <input
                                                type="text"
                                                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 font-bold"
                                                value={editData.batch_number}
                                                onChange={e => setEditData({ ...editData, batch_number: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Mato Turi</label>
                                            <div className="relative">
                                                <input
                                                    list="edit-mato-suggestions"
                                                    placeholder="Tanlang yoki yozing..."
                                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 font-bold"
                                                    value={editData.item_name}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        const found = (references || []).find(r => r.name === val);
                                                        setEditData({
                                                            ...editData,
                                                            item_name: val,
                                                            reference_id: found ? found.id : editData.reference_id,
                                                            // Auto-update specs for view if ref found
                                                            type_specs: found?.thread_type || editData.type_specs,
                                                            grammage: found?.grammage || editData.grammage,
                                                            width: found?.width || editData.width
                                                        });
                                                    }}
                                                />
                                                <datalist id="edit-mato-suggestions">
                                                    {[...new Set((references || []).filter(r => r.type === 'Mato').map(r => r.name))].map(n => <option key={n} value={n} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Turi / Gramaj / Eni</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Turi (30/1)"
                                                    className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-indigo-500"
                                                    value={editData.type_specs || ''}
                                                    onChange={e => setEditData({ ...editData, type_specs: e.target.value })}
                                                />
                                                <div className="relative w-24">
                                                    <input
                                                        type="number"
                                                        placeholder="Gr"
                                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-indigo-500"
                                                        value={editData.grammage || ''}
                                                        onChange={e => setEditData({ ...editData, grammage: e.target.value })}
                                                    />
                                                    <span className="absolute right-2 top-3 text-[10px] text-[var(--text-secondary)] font-bold">gr</span>
                                                </div>
                                                <div className="relative w-24">
                                                    <input
                                                        type="number"
                                                        placeholder="Sm"
                                                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-indigo-500"
                                                        value={editData.width || ''}
                                                        onChange={e => setEditData({ ...editData, width: e.target.value })}
                                                    />
                                                    <span className="absolute right-2 top-3 text-[10px] text-[var(--text-secondary)] font-bold">sm</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Kimdan (Manba)</label>
                                            <div className="relative">
                                                <input
                                                    list="source-suggestions"
                                                    type="text"
                                                    placeholder="Manbani kiriting..."
                                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-[var(--text-primary)] focus:border-indigo-500 outline-none"
                                                    value={editData.source || ''}
                                                    onChange={e => setEditData({ ...editData, source: e.target.value })}
                                                />
                                                <datalist id="source-suggestions">
                                                    <option value="E'zonur" />
                                                    <option value="Kesim" />
                                                    <option value="Buzilgan (Qayta)" />
                                                    <option value="Boshqa" />
                                                </datalist>
                                                <div className="absolute right-3 top-3 pointer-events-none">
                                                    <ChevronDown size={16} className="text-[var(--text-secondary)]" />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Rang va Kod</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 font-bold"
                                                    value={editData.color}
                                                    onChange={e => setEditData({ ...editData, color: e.target.value })}
                                                />
                                                <input
                                                    type="color"
                                                    className="w-12 h-11 rounded-xl bg-transparent border border-[var(--border-color)] cursor-pointer p-1"
                                                    value={editData.color_code || '#000000'}
                                                    onChange={e => setEditData({ ...editData, color_code: e.target.value })}
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full mt-2 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 font-mono font-bold"
                                                value={editData.color_code}
                                                onChange={e => setEditData({ ...editData, color_code: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-[var(--text-secondary)] mb-1 block font-bold">Asl Izoh (O'zgartirib bo'lmaydi)</label>
                                            <textarea
                                                disabled
                                                className="w-full bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-secondary)] outline-none h-24 resize-none font-bold opacity-70"
                                                value={editData.note}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Rolls */}
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Rulonlar Tahriri</h4>
                                    <div className="flex gap-4 text-xs font-mono text-[var(--text-secondary)]">
                                        <span>Jami Rulon: <b className="text-[var(--text-primary)] text-sm">{editData.rolls.length}</b></span>
                                        <span>Jami Kg: <b className="text-[var(--text-primary)] text-sm">{editData.rolls.reduce((a, b) => a + Number(b.weight), 0).toFixed(2)}</b></span>
                                    </div>
                                </div>

                                <div className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-3xl p-6 relative flex flex-col items-center justify-center min-h-[400px]">
                                    <div className="w-full h-full absolute inset-0 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-3 content-start custom-scrollbar">
                                        {editData.rolls.map((r, i) => (
                                            <div key={r.uniqueId || r.id || i} className={`relative bg-[var(--bg-card)] border ${r.status === 'used' ? 'border-amber-500/30 bg-amber-500/5' : 'border-[var(--border-color)]'} p-4 rounded-xl flex flex-col items-center shadow-lg group`}>
                                                <span className="text-[10px] text-[var(--text-secondary)] mb-1 font-bold">
                                                    {r.roll_number || 'Yangi'}
                                                </span>
                                                <input
                                                    type="number"
                                                    disabled={r.status === 'used'}
                                                    className="w-full text-center bg-transparent font-black text-xl outline-none text-[var(--text-primary)] disabled:opacity-50"
                                                    value={r.weight}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        const updatedRolls = [...editData.rolls];
                                                        updatedRolls[i] = { ...r, weight: val };
                                                        setEditData({ ...editData, rolls: updatedRolls });
                                                    }}
                                                />
                                                <span className="text-[10px] text-[var(--text-secondary)]">kg</span>

                                                {/* Delete Button (Only if not used, or if allow override) */}
                                                {r.status !== 'used' && (
                                                    <button
                                                        onClick={() => {
                                                            if (!window.confirm("Bu rulonni o'chirib tashlaysizmi?")) return;
                                                            const updatedRolls = editData.rolls.filter((_, idx) => idx !== i);
                                                            const deleted = r.id ? [...editData.deletedRolls, r.id] : editData.deletedRolls;
                                                            setEditData({ ...editData, rolls: updatedRolls, deletedRolls: deleted });
                                                        }}
                                                        className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full text-white text-[10px] flex items-center justify-center hover:scale-110 transition-transform font-bold opacity-0 group-hover:opacity-100"
                                                    >
                                                        ×
                                                    </button>
                                                )}

                                                {r.status === 'used' && <span className='absolute bottom-1 right-2 text-[8px] font-black text-amber-500 uppercase'>Ishlatilgan</span>}
                                            </div>
                                        ))}
                                    </div>

                                    {editData.rolls.length === 0 && (
                                        <div className="text-center text-[var(--text-secondary)] opacity-50 absolute inset-0 flex flex-col items-center justify-center">
                                            <Warehouse size={48} className="mb-2" />
                                            <p className="text-sm font-bold">Rulonlar yo'q</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => {
                                            // Add new roll placeholder
                                            const newRoll = {
                                                weight: '',
                                                status: 'in_stock',
                                                uniqueId: Date.now() // temporary ID for key
                                            };
                                            setEditData({ ...editData, rolls: [...editData.rolls, newRoll] });
                                        }}
                                        className="flex-1 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--bg-card-hover)] transition-all shadow-sm"
                                    >
                                        + Rulon qo'shish
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[var(--border-color)] flex justify-end gap-3 bg-[var(--bg-card)] sticky bottom-0 z-10">
                            <button onClick={() => setShowEditModal(false)} className="px-6 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--bg-card-hover)]">Bekor qilish</button>
                            <button onClick={handleSaveEdit} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2">
                                Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
            {/* SCANNER MODAL */}
            {showScanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-card)] w-full max-w-lg rounded-3xl border border-[var(--border-color)] shadow-2xl relative flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
                            <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2"><QrCode className="text-indigo-500" /> QR Skaner</h3>
                            <button onClick={() => setShowScanner(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-body)] p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="w-full rounded-2xl overflow-hidden border-2 border-dashed border-indigo-500/30 bg-[var(--bg-body)] min-h-[250px] p-6 text-center">
                                {/* SCANNER UI - THIS DIV IS REQUIRED FOR CAMERA */}
                                <div id="reader" className="w-full min-h-[200px]"></div>

                                {/* MANUAL INPUT FALLBACK */}
                                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                                    <p className="text-xs text-[var(--text-secondary)] mb-2 font-bold uppercase tracking-widest">Yoki ID raqam</p>
                                    <input
                                        type="text"
                                        placeholder="Scan ID..."
                                        className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 text-sm w-full text-center font-mono font-bold outline-none focus:border-indigo-500 transition-colors"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleScanSuccess(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="font-bold text-sm text-[var(--text-primary)] mb-3 flex justify-between items-center">
                                    <span>Skan qilinganlar</span>
                                    <span className="bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded text-xs">{scannedRolls.length} ta</span>
                                </h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar bg-[var(--bg-body)] p-2 rounded-xl border border-[var(--border-color)]">
                                    {scannedRolls.map((r, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] hover:border-indigo-500/30 transition-colors">
                                            <div>
                                                <div className="font-mono font-bold text-xs text-[var(--text-primary)]">{r.roll_number || r.roll_id?.substring(0, 8)}</div>
                                                <div className="text-[10px] text-[var(--text-secondary)] font-bold">{r.inventory?.item_name}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="font-black text-emerald-500 text-sm">{r.weight} kg</div>
                                                <button
                                                    onClick={() => setScannedRolls(scannedRolls.filter((_, idx) => idx !== i))}
                                                    className="text-[var(--text-secondary)] hover:text-rose-500 p-1"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {scannedRolls.length === 0 && (
                                        <div className="text-center text-[var(--text-secondary)] text-xs py-8 opacity-50 font-bold">Kamerani rulon QR kodiga qarating</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-card)] rounded-b-3xl">
                            <button
                                disabled={scannedRolls.length === 0}
                                onClick={() => {
                                    if (scannedRolls.length === 0) return;

                                    // Check if mixed
                                    const firstInvId = scannedRolls[0].inventory_id;
                                    const isMixed = scannedRolls.some(r => r.inventory_id !== firstInvId);

                                    // If mixed, pass null (so handleBulkChiqim sets 'MIXED' / 'Aralash Partiya')
                                    // Otherwise pass the inventory object of the first roll
                                    const itemParams = isMixed ? null : scannedRolls[0].inventory;

                                    handleBulkChiqim(itemParams, scannedRolls);
                                    setShowScanner(false);
                                }}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowUpRight size={18} />
                                Chiqim Qilish ({scannedRolls.reduce((a, b) => a + Number(b.weight), 0).toFixed(1)} kg)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default MatoOmbori;
