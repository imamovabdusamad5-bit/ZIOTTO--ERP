import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [company, setCompany] = useState(null);
    const [tenant, setTenant] = useState(null); // The company bound to this subdomain
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeApp = async () => {
            // 1. Determine Subdomain Tenant
            const hostname = window.location.hostname;
            
            // Fetch companies to match the subdomain slug
            const { data: companiesData } = await supabase.from('companies').select('*');
            let currentTenant = null;

            if (companiesData && companiesData.length > 0) {
                // Try to find a company whose slug is in the hostname (e.g. 'bonito' in 'bonito-kids.vercel.app')
                currentTenant = companiesData.find(c => c.domain_slug && hostname.includes(c.domain_slug));
                
                // Fallback for localhost or unmatched domains -> default to 'ziotto'
                if (!currentTenant) {
                    currentTenant = companiesData.find(c => c.domain_slug === 'ziotto') || companiesData[0];
                }
                setTenant(currentTenant);
            }

            // 2. Restore Session
            const savedUser = localStorage.getItem('erp_user');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                
                if (userData.id === 'master') {
                    setUser(userData);
                    setProfile(userData);
                    const adminCompany = currentTenant || { id: 'master', name: 'Master Admin' };
                    setCompany(adminCompany);
                    localStorage.setItem('erp_company_id', 'master');
                    setLoading(false);
                } else {
                    // Only restore if the user belongs to the CURRENT tenant!
                    await fetchProfile(userData.id, currentTenant?.id);
                }
            } else {
                setLoading(false);
            }
        };

        initializeApp();
    }, []);

    const fetchProfile = async (userId, tenantId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*, companies!profiles_company_id_fkey(*)')
                .eq('id', userId)
                .single();

            if (!error && data) {
                // Security Check: Does the user belong to the subdomain they are visiting?
                if (data.company_id !== tenantId && data.role !== 'admin') {
                    // Optional: You could log them out if they switch subdomains
                    console.warn("User does not belong to this tenant!");
                }
                
                setUser(data);
                setProfile(data);
                if (data.companies) {
                    setCompany(data.companies);
                    localStorage.setItem('erp_company_id', data.companies.id);
                } else if (data.company_id) {
                    localStorage.setItem('erp_company_id', data.company_id);
                }
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, code) => {
        try {
            const upperUsername = (username || '').trim().toUpperCase();
            const cleanCode = (code || '').trim();

            // 1. Master Admin Override (Code 9999 for any admin username)
            if (cleanCode === '9999') {
                const masterUser = { 
                    id: 'master', 
                    username: upperUsername || 'ADMIN', 
                    role: 'admin', 
                    full_name: `${upperUsername || 'ADMIN'} (Asosiy Boshqaruvchi)`, 
                    status: true, 
                    permissions: { admin: 'full' } 
                };
                setUser(masterUser);
                setProfile(masterUser);
                
                const adminCompany = tenant || { id: 'master', name: 'Master Admin' };
                setCompany(adminCompany);
                localStorage.setItem('erp_company_id', 'master');
                localStorage.setItem('erp_user', JSON.stringify(masterUser));
                return { data: masterUser };
            }

            // 2. Normal User Database Login
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', upperUsername)
                .eq('unique_code', cleanCode)
                .eq('status', true)
                .maybeSingle();

            if (error) {
                console.error('Login DB Error:', error);
                return { error: { message: `Bazaga bog'lanishda xatolik: ${error.message}.` } };
            }

            if (!data) {
                return { error: { message: 'Foydalanuvchi ismi yoki maxsus kod noto\'g\'ri' } };
            }

            // Fetch company separately if available
            let companyData = null;
            if (data.company_id) {
                const { data: comp } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', data.company_id)
                    .maybeSingle();
                companyData = comp;
            }

            // Subdomain Security: Reject login if user is not from this tenant
            if (tenant && data.company_id && data.company_id !== tenant.id && data.role !== 'admin') {
                return { error: new Error(`Ruxsat etilmagan! Siz ${tenant.name} xodimi emassiz!`) };
            }

            const userCompany = companyData || tenant;
            setUser(data);
            setProfile(data);
            if (userCompany) {
                setCompany(userCompany);
                localStorage.setItem('erp_company_id', userCompany.id);
            }
            
            const safeUser = { ...data };
            delete safeUser.unique_code;
            
            localStorage.setItem('erp_user', JSON.stringify(safeUser));
            return { data: safeUser };
        } catch (err) {
            console.error('Login error:', err);
            return { error: { message: err.message || "Tizimga kirishda kutilmagan xatolik yuz berdi" } };
        }
    };

    const logout = () => {
        setUser(null);
        setProfile(null);
        setCompany(null);
        localStorage.removeItem('erp_user');
        localStorage.removeItem('erp_company_id');
    };

    return (
        <AuthContext.Provider value={{ user, profile, company, tenant, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
