import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qnouaodxzovzzclpzpmu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__y3K2v9Lyx_7T-5wnp90zA_c_6d1fNv';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your .env file.');
}

const client = createClient(supabaseUrl, supabaseAnonKey);

const getCompanyId = () => {
    try {
        return localStorage.getItem('erp_company_id');
    } catch {
        return null;
    }
};

const originalFrom = client.from.bind(client);

// Intercept Supabase Client to automatically inject Multi-Tenancy company_id
client.from = (table) => {
    const builder = originalFrom(table);
    const companyId = getCompanyId();

    // Tables that do NOT need company filtering (Global tables)
    const exemptTables = ['profiles', 'companies', 'models', 'bom_items', 'production_orders', 'production_order_items', 'operations'];
    if (exemptTables.includes(table) || !companyId) {
        return builder;
    }

    // Helper to proxy the filter builder methods safely
    const proxyFilter = (queryBuilder) => {
        if (companyId === 'master') return queryBuilder;
        // Allow rows belonging to this company OR legacy/global rows where company_id IS NULL
        if (table === 'material_types' || table === 'inventory' || table === 'inventory_logs' || table === 'material_requests') {
            return queryBuilder.or(`company_id.eq.${companyId},company_id.is.null`);
        }
        return queryBuilder.eq('company_id', companyId);
    };

    // Proxy the select method
    const originalSelect = builder.select.bind(builder);
    builder.select = (...args) => {
        return proxyFilter(originalSelect(...args));
    };

    // Proxy the update method
    const originalUpdate = builder.update.bind(builder);
    builder.update = (values, ...args) => {
        if (companyId === 'master') return originalUpdate(values, ...args);
        return originalUpdate(values, ...args).eq('company_id', companyId);
    };

    // Proxy the delete method
    const originalDelete = builder.delete.bind(builder);
    builder.delete = (...args) => {
        if (companyId === 'master') return originalDelete(...args);
        return originalDelete(...args).eq('company_id', companyId);
    };

    // Proxy the insert method
    const originalInsert = builder.insert.bind(builder);
    builder.insert = (values, ...args) => {
        let injected = values;
        if (companyId && companyId !== 'master') {
            if (Array.isArray(values)) {
                injected = values.map(v => ({ company_id: companyId, ...v }));
            } else if (typeof values === 'object' && values !== null) {
                injected = { company_id: companyId, ...values };
            }
        }
        return originalInsert(injected, ...args);
    };

    return builder;
};

export const supabase = client;
