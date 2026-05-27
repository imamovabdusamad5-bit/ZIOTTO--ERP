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
    const exemptTables = ['profiles', 'companies'];
    if (exemptTables.includes(table) || !companyId) {
        return builder;
    }

    // Helper to proxy the filter builder methods safely
    const proxyFilter = (queryBuilder) => {
        if (companyId === 'master') return queryBuilder;
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
        return proxyFilter(originalUpdate(values, ...args));
    };

    // Proxy the delete method
    const originalDelete = builder.delete.bind(builder);
    builder.delete = (...args) => {
        return proxyFilter(originalDelete(...args));
    };

    // Proxy the insert method
    const originalInsert = builder.insert.bind(builder);
    builder.insert = (values, ...args) => {
        let injected = values;
        if (Array.isArray(values)) {
            injected = values.map(v => ({ ...v, company_id: companyId }));
        } else if (typeof values === 'object' && values !== null) {
            injected = { ...values, company_id: companyId };
        }
        return originalInsert(injected, ...args);
    };

    return builder;
};

export const supabase = client;
