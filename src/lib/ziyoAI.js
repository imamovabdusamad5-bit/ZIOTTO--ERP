import { supabase } from './supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
let cache = {
    data: {},
    lastFetch: 0
};

// Data Fetcher (Gathers context for AI)
const fetchAllContext = async () => {
    const now = Date.now();
    if (Object.keys(cache.data).length > 0 && (now - cache.lastFetch < CACHE_DURATION)) {
        return cache.data;
    }

    let context = {};

    try {
        // Warehouse
        const { data: inv } = await supabase.from('inventory').select('item_name, quantity, unit, category');
        context.warehouse = inv || [];

        // HR / Employees
        const { count: empCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', true);
        context.activeEmployees = empCount || 0;

        const today = new Date().toISOString().split('T')[0];
        const { data: att } = await supabase.from('attendance').select('status').eq('date', today);
        context.attendance = {
            present: att?.filter(a => a.status === 'present').length || 0,
            absent: att?.filter(a => a.status === 'absent').length || 0
        };

        // Production (Sewing & Cutting)
        const { count: sewingCount } = await supabase.from('production_bundles').select('*', { count: 'exact', head: true }).eq('current_step', 'Tikuv').neq('status', 'Completed');
        context.sewingBundles = sewingCount || 0;

        const { count: cuttingCount } = await supabase.from('production_orders').select('*', { count: 'exact', head: true }).eq('status', 'Confirmed');
        context.cuttingOrders = cuttingCount || 0;

        cache.data = context;
        cache.lastFetch = now;
    } catch (e) {
        console.error("Context Fetch Error:", e);
    }

    return context;
};

export const processUserMessage = async (message) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || atob('QUl6YVN5REQ3M2piMGZfVHRsWE1nSlNhZVlEU1RkVFNoUHdYa0Nj');

    if (!apiKey) {
        return {
            text: "⚠️ Kechirasiz, men haqiqiy 'Aql' (Gemini AI) bilan ulanishim uchun tizimda (Vercel yoki .env) VITE_GEMINI_API_KEY kiritilmagan. Iltimos, rahbar yoki dasturchiga ushbu kalitni kiritishini ayting. Shundan so'ng barcha murakkab savollaringizga faktlar bilan mukammal javob bera olaman!",
            hasAlert: true
        };
    }

    try {
        const contextData = await fetchAllContext();
        
        // Build the system prompt
        let systemPrompt = `Siz Ziotto ERP (To'qimachilik/Tekstil korxonasi) tizimining rasmiy sun'iy intellektisiz. Ismingiz Ziyo AI.
Sizning vazifangiz korxona xodimlari va rahbarining savollariga quyidagi real faktlarga asoslanib o'zbek tilida qisqa, aniq va insoniy javob berish.
Foydalanuvchiga hech qachon "faktlarni ko'ra olmayapman" demang, har doim quyidagi faktlardan foydalaning.

[REAL VAQTDAGI FAKTLAR]
- Ombor holati: Jami ${contextData.warehouse?.length || 0} xil turdagi mahsulot mavjud. (Tafsilotlar: ${contextData.warehouse?.map(i => `${i.item_name}: ${i.quantity} ${i.unit}`).join(', ') || 'bo\'sh'})
- Xodimlar: Jami ${contextData.activeEmployees} ta faol xodim ishlaydi.
- Bugungi davomat: ${contextData.attendance?.present} kishi ishda, ${contextData.attendance?.absent} kishi yo'q.
- Ishlab chiqarish (Tikuv): Hozirda tikuv sexida ${contextData.sewingBundles} ta partiya (kroy) jarayonda.
- Ishlab chiqarish (Kesim): Kesim bo'limida ${contextData.cuttingOrders} ta tasdiqlangan buyurtma navbatda.

Agar foydalanuvchi "nega omborda mato yo'q o'zi" deb so'rasa, siz faktlarga qarab: "Hozirgi vaqtda omborimizda mato qoldig'i 0 ga teng ko'rsatilmoqda. Ehtimol ta'minot bo'limi hali yangi matolarni tizimga kiritmagan yoki barcha matolar ishlab chiqarishga olingan bo'lishi mumkin" deb mantiqiy javob bering.`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const result = await model.generateContent([
            systemPrompt,
            "Foydalanuvchi savoli: " + message
        ]);

        const responseText = result.response.text();
        
        // Simple heuristic to check if it's an alert
        const hasAlert = responseText.toLowerCase().includes('tugayapti') || 
                         responseText.toLowerCase().includes('muammo') ||
                         responseText.toLowerCase().includes('diqqat');

        return {
            text: responseText,
            hasAlert: hasAlert
        };

    } catch (error) {
        console.error("Gemini Error:", error);
        return {
            text: "Kechirasiz, sun'iy intellekt xizmatida vaqtincha uzilish yuz berdi. Iltimos birozdan so'ng qayta urinib ko'ring.",
            hasAlert: true
        };
    }
};
