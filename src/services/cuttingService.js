import { supabase } from '../lib/supabase';

// 1. Yangi Bichuv faktini bazaga yozish (Insert) funksiyasi
export const insertCuttingActual = async (actualData) => {
    try {
        const { data, error } = await supabase
            .from('cutting_actuals')
            .insert({
                production_order_id: actualData.production_order_id,
                roll_id: actualData.roll_id,
                actual_weight_kg: Number(actualData.actual_weight_kg),
                layer_count: Number(actualData.layer_count),
                lay_length_meters: Number(actualData.lay_length_meters)
            })
            .select()
            .single();

        if (error) {
            console.error('Bichuv faktini saqlashda xatolik:', error.message);
            throw error;
        }

        console.log('Bichuv fakti muvaffaqiyatli saqlandi:', data);
        return data;
    } catch (err) {
        console.error('API xatosi:', err);
        return null;
    }
};

// 2. Production Plan (Reja) yaratish funksiyasi
export const createProductionOrder = async (orderData) => {
    try {
        const { data, error } = await supabase
            .from('production_orders')
            .insert({
                model_name: orderData.model_name,
                planned_quantity: Number(orderData.planned_quantity),
                normative_consumption: Number(orderData.normative_consumption)
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error creating plan:', err);
        return null;
    }
};

// 3. Faqat faol rejalarni olish
export const fetchActivePlans = async () => {
    const { data, error } = await supabase
        .from('production_orders')
        .select('*')
        .eq('status', 'planned')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};
