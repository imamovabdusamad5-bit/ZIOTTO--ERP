import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simple session persistence using localStorage for username-based auth
        const savedUser = localStorage.getItem('erp_user');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);

            // Check for master user bypass to avoid DB fetch error (invalid input syntax for type uuid: "master")
            if (userData.id === 'master') {
                setProfile(userData);
                setLoading(false);
            } else {
                fetchProfile(userData.id);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setProfile(data);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, code) => {
        try {
            // Master Bypass for initial setup
            if (username === 'ADMIN' && code === '9999') {
                const masterUser = { id: 'master', username: 'ADMIN', role: 'admin', full_name: 'Asosiy Boshqaruvchi', status: true, permissions: {} };
                setUser(masterUser);
                setProfile(masterUser);
                localStorage.setItem('erp_user', JSON.stringify(masterUser));
                return { data: masterUser };
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .eq('unique_code', code)
                .eq('status', true)
                .maybeSingle(); // maybeSingle doesn't throw error on 0 rows

            if (error) {
                console.error('Login DB Error:', error);
                return { error: { message: `Bazaga bog'lanishda xatolik: ${error.message}. Iltimos SQL skriptni profil jadvalida ishga tushirganingizni tekshiring.` } };
            }

            if (!data) {
                return { error: { message: 'Foydalanuvchi ismi yoki maxsus kod noto\'g\'ri' } };
            }

            setUser(data);
            setProfile(data);
            localStorage.setItem('erp_user', JSON.stringify(data));
            return { data };
        } catch (err) {
            console.error('Login Catch Error:', err);
            return { error: { message: 'Tizimda kutilmagan xatolik: ' + err.message } };
        }
    };

    const logout = () => {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('erp_user');
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
