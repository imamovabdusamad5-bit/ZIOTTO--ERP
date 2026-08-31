import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

const getTenant = async () => {
    const hostname = window.location.hostname;
    const { data: companies, error } = await supabase
        .from('companies')
        .select('*');

    if (error || !companies?.length) return null;

    return companies.find((company) => company.domain_slug && hostname.includes(company.domain_slug))
        || companies.find((company) => company.domain_slug === 'ziotto')
        || companies[0];
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [company, setCompany] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    const clearIdentity = () => {
        setUser(null);
        setProfile(null);
        setCompany(null);
    };

    const loadProfile = async (authUser, currentTenant) => {
        if (!authUser) {
            clearIdentity();
            return { error: null };
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*, companies!profiles_company_id_fkey(*)')
            .eq('auth_user_id', authUser.id)
            .maybeSingle();

        if (error || !data) {
            clearIdentity();
            return { error: new Error('Bu akkaunt uchun faol ProERP profili topilmadi.') };
        }

        if (!data.status) {
            clearIdentity();
            return { error: new Error('Ushbu foydalanuvchi bloklangan.') };
        }

        if (currentTenant && data.company_id !== currentTenant.id) {
            clearIdentity();
            return { error: new Error(`Bu akkaunt ${currentTenant.name} kompaniyasiga tegishli emas.`) };
        }

        setUser(authUser);
        setProfile(data);
        setCompany(data.companies || currentTenant || null);
        return { data };
    };

    useEffect(() => {
        let active = true;

        const initialize = async () => {
            setLoading(true);
            const currentTenant = await getTenant();
            if (!active) return;

            setTenant(currentTenant);
            const { data: { session } } = await supabase.auth.getSession();
            if (!active) return;

            await loadProfile(session?.user, currentTenant);
            if (active) setLoading(false);
        };

        initialize();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentTenant = await getTenant();
            if (!active) return;

            setTenant(currentTenant);
            await loadProfile(session?.user, currentTenant);
            if (active) setLoading(false);
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
        });

        if (error) return { error };

        const profileResult = await loadProfile(data.user, tenant);
        if (profileResult.error) {
            await supabase.auth.signOut();
            return profileResult;
        }

        return { data: profileResult.data };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        clearIdentity();
    };

    return (
        <AuthContext.Provider value={{ user, profile, company, tenant, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
