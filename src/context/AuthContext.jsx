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
        localStorage.removeItem('erp_user');
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

        if (currentTenant && data.company_id !== currentTenant.id && data.role !== 'admin') {
            clearIdentity();
            return { error: new Error(`Bu akkaunt ${currentTenant.name} kompaniyasiga tegishli emas.`) };
        }

        setUser(authUser);
        setProfile(data);
        setCompany(data.companies || currentTenant || null);
        localStorage.setItem('erp_user', JSON.stringify(data));
        return { data };
    };

    useEffect(() => {
        let active = true;

        const initialize = async () => {
            setLoading(true);
            const currentTenant = await getTenant();
            if (!active) return;

            setTenant(currentTenant);

            // 1. Check local session storage (Master admin or saved local profile)
            const savedUserStr = localStorage.getItem('erp_user');
            if (savedUserStr) {
                try {
                    const savedUser = JSON.parse(savedUserStr);
                    if (savedUser && savedUser.id) {
                        setUser(savedUser);
                        setProfile(savedUser);
                        setCompany(currentTenant || { id: savedUser.company_id, name: 'PROERP' });
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error('Session restore error:', e);
                }
            }

            // 2. Check Supabase Auth Session
            const { data: { session } } = await supabase.auth.getSession();
            if (!active) return;

            if (session?.user) {
                await loadProfile(session.user, currentTenant);
            }

            if (active) setLoading(false);
        };

        initialize();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentTenant = await getTenant();
            if (!active) return;

            setTenant(currentTenant);
            if (session?.user) {
                await loadProfile(session.user, currentTenant);
            }
            if (active) setLoading(false);
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (emailOrUsername, passwordOrCode) => {
        const inputStr = (emailOrUsername || '').trim();
        const secretStr = (passwordOrCode || '').trim();

        // 1. MASTER ADMIN OVERRIDE (Master PIN: 9999)
        if (secretStr === '9999') {
            const masterName = inputStr.toUpperCase() || 'ADMIN';
            const masterUser = { 
                id: 'master-admin-id', 
                username: masterName, 
                role: 'admin', 
                full_name: `${masterName} (Asosiy Boshqaruvchi)`, 
                status: true, 
                permissions: { admin: 'full', planning: 'full', warehouse: 'full', finance: 'full' } 
            };
            const adminCompany = tenant || { id: 'master', name: 'PROERP', plan_tier: 'ultra' };
            
            setUser(masterUser);
            setProfile(masterUser);
            setCompany(adminCompany);
            localStorage.setItem('erp_user', JSON.stringify(masterUser));
            localStorage.setItem('erp_company_id', adminCompany.id);
            return { data: masterUser };
        }

        // 2. PROFILE CODE LOGIN (Username or Email + Unique Code)
        try {
            const { data: profileMatch, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.${inputStr},email.ilike.${inputStr}`)
                .eq('unique_code', secretStr)
                .eq('status', true)
                .maybeSingle();

            if (profileMatch) {
                setUser(profileMatch);
                setProfile(profileMatch);
                const userCompany = tenant || { id: profileMatch.company_id, name: 'PROERP' };
                setCompany(userCompany);
                localStorage.setItem('erp_user', JSON.stringify(profileMatch));
                localStorage.setItem('erp_company_id', profileMatch.company_id || 'master');
                return { data: profileMatch };
            }
        } catch (e) {
            console.warn('Profile code lookup fallback:', e);
        }

        // 3. STANDARD SUPABASE AUTH LOGIN (Email + Password)
        const { data, error } = await supabase.auth.signInWithPassword({
            email: inputStr.toLowerCase(),
            password: secretStr,
        });

        if (error) {
            return { error: new Error('Foydalanuvchi nomi/email yoki parol noto‘g‘ri. Master kod: 9999') };
        }

        const profileResult = await loadProfile(data.user, tenant);
        if (profileResult.error) {
            await supabase.auth.signOut();
            return profileResult;
        }

        return { data: profileResult.data };
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error('Logout error:', e);
        }
        clearIdentity();
    };

    return (
        <AuthContext.Provider value={{ user, profile, company, tenant, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
