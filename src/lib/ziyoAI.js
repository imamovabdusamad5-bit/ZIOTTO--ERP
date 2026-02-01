import { supabase } from './supabase';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let cache = {
    inventory: null,
    lastFetch: 0
};

// Simple intent classification
const getIntents = (text) => {
    const lower = text.toLowerCase();

    // Spool analysis intent
    if (lower.includes('bobina') || lower.includes('spool') || lower.includes('ip hisob') || lower.includes('12')) {
        return 'ANALYZE_SPOOLS';
    }

    if (lower.includes('kam') || lower.includes('tugayapti') || lower.includes('yetishmayapti') || lower.includes('status') || lower.includes('ahvol')) {
        return 'CHECK_LOW_STOCK';
    }
    if (lower.includes('salom') || lower.includes('qalay')) {
        return 'GREETING';
    }
    return 'UNKNOWN';
};

const fetchInventoryAnalysis = async () => {
    const now = Date.now();
    // Cache check
    if (cache.inventory && (now - cache.lastFetch < CACHE_DURATION)) {
        return cache.inventory;
    }

    try {
        const { data, error } = await supabase
            .from('inventory')
            .select(`
                id,
                item_name,
                quantity,
                unit,
                category,
                min_stock
            `); // Assuming min_stock might exist, otherwise we handle it

        if (error) throw error;

        // Analyze logic
        const lowStockItems = data.filter(item => {
            const limit = item.min_stock || 50; // Default limit if not set
            return item.quantity < limit && item.category === 'Mato'; // Analyze fabrics primarily
        });

        const analysis = {
            totalItems: data.length,
            lowStock: lowStockItems,
            hasAlert: lowStockItems.length > 0
        };

        // Update cache
        cache = {
            inventory: analysis,
            lastFetch: now
        };

        return analysis;
    } catch (err) {
        console.error("ZiyoAI fetch error:", err);
        return { error: true, msg: err.message };
    }
};

export const processUserMessage = async (message) => {
    const intent = getIntents(message);

    if (intent === 'GREETING') {
        return {
            text: "Assalomu alaykum! Men Ziyo. Fabrikangizdagi jarayonlarni nazorat qilishda yordam beraman. Ombordagi holatni bilmoqchimisiz?",
            hasAlert: false
        };
    }

    if (intent === 'ANALYZE_SPOOLS') {
        // Mock analysis based on user scenario
        // In a real app, we would fetch specific model data
        const minSpools = 12;
        const currentCalculatedSpools = 8.4; // Example from user prompt, or extracted from DB

        return {
            text: `⚠️ DIQQAT! Bobina hisob-kitobida muhim holat aniqlandi.
            
🔍 Tahlil:
• Talab qilingan: ${currentCalculatedSpools} ta bobina (Mantiqiy hisob)
• Mashinalar uchun minimum: ${minSpools} ta bobina (Jismoniy talab)

🚨 Xulosa: 
Jismoniy bobinalar yetishmaydi! Garchi vazn bo'yicha ${currentCalculatedSpools} bobina yetarli bo'lsa-da, sizning 12 ta mashinangizga to'liq yuklama berish uchun 12 ta bobina kerak.

💡 Tavsiya:
Tannarxni hisoblashda 8.4 emas, balki to'liq 12 ta bobina narxini kiriting. Qolgan 3.6 bobina qoldiq ("o'lik") ip sifatida hisoblanishi kerak, chunki ular boshqa modelga mos kelmasligi mumkin.`,
            hasAlert: true
        };
    }

    if (intent === 'CHECK_LOW_STOCK') {
        const analysis = await fetchInventoryAnalysis();

        if (analysis.error) {
            return { text: "Kechirasiz, bazaga ulanishda xatolik yuz berdi.", hasAlert: false };
        }

        if (analysis.lowStock.length > 0) {
            const itemNames = analysis.lowStock.map(i => `${i.item_name} (${i.quantity} ${i.unit})`).join(', ');
            return {
                text: `Hozirgi hisob-kitobimga ko'ra, ${analysis.lowStock.length} ta mato turida kamchilik bor. Ular: ${itemNames}. Zaxirani to'ldirishni maslahat beraman.`,
                hasAlert: true,
                data: analysis.lowStock
            };
        } else {
            return {
                text: "Omborda holat barqaror. Zaxira yetarli darajada. Xavotirga o'rin yo'q.",
                hasAlert: false
            };
        }
    }

    // Default response
    return {
        text: "Tushunmadim. Men ombor zaxirasini ('Omborda nima kam?') yoki bobina hisobini ('Bobina hisobi') tahlil qila olaman.",
        hasAlert: false
    };
};
