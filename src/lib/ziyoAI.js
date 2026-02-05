import { supabase } from './supabase';

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache for fresher data
let cache = {
    data: {},
    lastFetch: 0
};

// ------------------------------------------------------------------
// 1. INTENT CLASSIFICATION
// ------------------------------------------------------------------
const getIntents = (text) => {
    const lower = text.toLowerCase();

    // Greeting
    if (lower.startsWith('salom') || lower.includes('qalay') || lower.includes('assalom')) return 'GREETING';

    // Warehouse (Ombor)
    if (lower.includes('ombor') || lower.includes('zaxira') || lower.includes('mato') || lower.includes('ip') || lower.includes('aksessuar')) return 'WAREHOUSE_STATUS';

    // Production (Tikuv, Kesim, Dazmol, Modelxona)
    if (lower.includes('tikuv') || lower.includes('tiku')) return 'SEWING_STATUS';
    if (lower.includes('kesim') || lower.includes('bichuv')) return 'CUTTING_STATUS';
    if (lower.includes('model')) return 'MODEL_STATUS';
    if (lower.includes('ishlab chiqarish') || lower.includes('jarayon')) return 'PRODUCTION_GENERAL';

    // Finance (Moliya)
    if (lower.includes('pul') || lower.includes('maosh') || lower.includes('oylik') || lower.includes('xarajat') || lower.includes('foyda')) return 'FINANCE_STATUS';

    // HR (Xodimlar)
    if (lower.includes('xodim') || lower.includes('ishchi') || lower.includes('davomat') || lower.includes('keldi')) return 'HR_STATUS';

    // Fallback -> General Analysis or Unknown
    if (lower.includes('hisobot') || lower.includes('ahvol') || lower.includes('statistika')) return 'GENERAL_REPORT';

    return 'UNKNOWN';
};

// ------------------------------------------------------------------
// 2. DATA FETCHERS
// ------------------------------------------------------------------

const fetchData = async (section) => {
    const now = Date.now();
    if (cache.data[section] && (now - cache.lastFetch < CACHE_DURATION)) {
        return cache.data[section];
    }

    let result = null;

    try {
        if (section === 'WAREHOUSE') {
            const { data } = await supabase.from('inventory').select('item_name, quantity, unit, category, min_stock');
            const lowStock = data?.filter(i => Number(i.quantity) < 10) || [];
            result = { total: data?.length || 0, lowStock };
        }

        if (section === 'SEWING') {
            // Count bundles in sewing
            const { count } = await supabase.from('production_bundles').select('*', { count: 'exact', head: true }).eq('current_step', 'Tikuv').neq('status', 'Completed');
            result = { pendingBundles: count || 0 };
        }

        if (section === 'CUTTING') {
            const { count } = await supabase.from('production_orders').select('*', { count: 'exact', head: true }).eq('status', 'Confirmed'); // Assuming 'Confirmed' goes to cutting
            result = { pendingOrders: count || 0 };
        }

        if (section === 'FINANCE') {
            // Rough estimate of active employees for salary talk
            const { count: empCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', true);
            result = { activeEmployees: empCount || 0 };
        }

        if (section === 'HR') {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase.from('attendance').select('status').eq('date', today);
            const present = data?.filter(a => a.status === 'present').length || 0;
            const absent = data?.filter(a => a.status === 'absent').length || 0;
            result = { present, absent };
        }

        if (section === 'MODELS') {
            const { count } = await supabase.from('models').select('*', { count: 'exact', head: true });
            result = { totalModels: count || 0 };
        }

        // Save to cache
        cache.data[section] = result;
        cache.lastFetch = now;

    } catch (e) {
        console.error("ZiyoAI Fetch Error:", e);
        return null;
    }

    return result;
};


// ------------------------------------------------------------------
// 3. MAIN PROCESSOR
// ------------------------------------------------------------------

export const processUserMessage = async (message) => {
    const intent = getIntents(message);

    if (intent === 'GREETING') {
        return {
            text: "Assalomu alaykum! Men Ziyoman. Butun fabrika faoliyati (Ombor, Tikuv, Moliya, HR va boshqalar) bo'yicha ma'lumot bera olaman. Nima bilan yordam beray?",
            hasAlert: false
        };
    }

    if (intent === 'WAREHOUSE_STATUS') {
        const data = await fetchData('WAREHOUSE');
        if (!data) return { text: "Ombor ma'lumotlarini yuklab bo'lmadi.", hasAlert: true };

        if (data.lowStock.length > 0) {
            const items = data.lowStock.map(i => `${i.item_name} (${Number(i.quantity).toFixed(0)} ${i.unit})`).slice(0, 3).join(', ');
            return {
                text: `Omborda jami ${data.total} xil mahsulot bor. ⚠️ Diqqat: ${data.lowStock.length} ta mahsulot tugayapti! Masalan: ${items}...`,
                hasAlert: true
            };
        }
        return { text: `Ombor holati a'lo! Jami ${data.total} xil mahsulot zaxirada yetarli.`, hasAlert: false };
    }

    if (intent === 'SEWING_STATUS') {
        const data = await fetchData('SEWING');
        return {
            text: `Tikuv sexida hozir ${data?.pendingBundles || 0} ta "kroy" (partiya) jarayonda. Ishlar davom etmoqda.`,
            hasAlert: false
        };
    }

    if (intent === 'CUTTING_STATUS') {
        const data = await fetchData('CUTTING');
        return {
            text: `Kesim bo'limida ${data?.pendingOrders || 0} ta yangi buyurtma navbatda turibdi.`,
            hasAlert: false
        };
    }

    if (intent === 'FINANCE_STATUS') {
        const data = await fetchData('FINANCE');
        return {
            text: `Moliya bo'limi: Hozirda ${data?.activeEmployees || 0} ta faol xodim uchun maosh hisoblanmoqda. Aniq raqamlarni "Moliya" bo'limidan ko'rishingiz mumkin.`,
            hasAlert: false
        };
    }

    if (intent === 'HR_STATUS') {
        const data = await fetchData('HR');
        return {
            text: `Bugungi davomat: ${data?.present || 0} kishi kelgan, ${data?.absent || 0} kishi kelmagan (yoki hali belgilanmagan).`,
            hasAlert: data?.absent > 3
        };
    }

    if (intent === 'MODEL_STATUS') {
        const data = await fetchData('MODELS');
        return {
            text: `Modelxona faoliyati: Bazada jami ${data?.totalModels || 0} ta tasdiqlangan model mavjud.`,
            hasAlert: false
        };
    }

    return {
        text: "Tushunmadim. Men quyidagi bo'limlar haqida ma'lumot bera olaman:\n• Ombor (zaxira)\n• Tikuv va Kesim (ishlab chiqarish)\n• Moliya (maoshlar)\n• Xodimlar (davomat)",
        hasAlert: false
    };
};
