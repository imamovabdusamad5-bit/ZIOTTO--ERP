import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, UploadCloud, Globe, DollarSign, Activity, Image as ImageIcon } from 'lucide-react';

const Sozlamalar = () => {
    const { tenant, company } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        domain_slug: '',
        logo_url: '',
        language: 'uz',
        currency: 'UZS',
        plan_tier: 'standart'
    });

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (tenant) {
            fetchSettings();
        }
    }, [tenant]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', tenant.id)
                .single();

            if (error) throw error;
            
            if (data) {
                setFormData({
                    name: data.name || '',
                    domain_slug: data.domain_slug || '',
                    logo_url: data.logo_url || '',
                    language: data.language || 'uz',
                    currency: data.currency || 'UZS',
                    plan_tier: data.plan_tier || 'standart'
                });
            }
        } catch (error) {
            console.error('Sozlamalarni yuklashda xatolik:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Iltimos, faqat rasm fayllarini yuklang.');
            return;
        }

        try {
            setUploading(true);
            const fileName = `logo-${tenant.id}-${Date.now()}.png`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('model-images')
                .upload(filePath, file, { contentType: file.type });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('model-images')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, logo_url: publicUrl }));
            alert('Logotip muvaffaqiyatli yuklandi!');
        } catch (error) {
            alert('Logotip yuklashda xatolik: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Update the company record
            const { error } = await supabase
                .from('companies')
                .update({
                    name: formData.name,
                    domain_slug: formData.domain_slug,
                    logo_url: formData.logo_url,
                    language: formData.language,
                    currency: formData.currency
                })
                .eq('id', tenant.id);

            if (error) throw error;
            alert("Sozlamalar muvaffaqiyatli saqlandi! O'zgarishlar darhol kuchga kiradi.");
            
            // Reload page to apply new logo and settings
            window.location.reload();
        } catch (error) {
            alert("Xatolik: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="py-20 text-center"><Activity className="animate-spin mx-auto text-indigo-500" /></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[3rem] border border-[var(--border-color)] backdrop-blur-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-2">
                        Tizim Sozlamalari
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm font-medium flex items-center gap-2">
                        {formData.name} korxonasi uchun asosiy moslamalar
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full font-black border border-indigo-500/20 uppercase">
                            Tarif: {formData.plan_tier}
                        </span>
                    </p>
                </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSave} className="space-y-6">
                
                {/* Logo Section */}
                <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-6 md:p-8 border border-[var(--border-color)] shadow-xl">
                    <h3 className="text-xl font-black text-[var(--text-primary)] mb-6 flex items-center gap-2">
                        <ImageIcon className="text-indigo-500" />
                        Korxona Logotipi
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                        <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center bg-[var(--bg-body)] overflow-hidden shrink-0 shadow-inner">
                            {formData.logo_url ? (
                                <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="text-[var(--text-secondary)] flex flex-col items-center">
                                    <ImageIcon size={32} className="opacity-50 mb-2" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Logo yo'q</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-4 text-center sm:text-left">
                            <p className="text-sm text-[var(--text-secondary)]">
                                Tizimning barcha sahifalarida "PRO ERP" o'rnida o'zingizning shaxsiy logotipingiz chiqib turadi. Tavsiya etiladigan hajm: kvadrat yoki gorizontal (PNG/JPG).
                            </p>
                            <div className="relative inline-block">
                                <input
                                    type="file"
                                    id="logo-upload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                />
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('logo-upload').click()}
                                    disabled={uploading}
                                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold px-6 py-3 rounded-2xl transition-all flex items-center gap-2 border border-indigo-500/20 cursor-pointer disabled:opacity-50"
                                >
                                    {uploading ? <Activity size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                                    {uploading ? 'Yuklanmoqda...' : 'Yangi Logo Yuklash'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-6 md:p-8 border border-[var(--border-color)] shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest block">
                            Korxona Nomi
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-[var(--text-primary)] font-bold outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest block">
                            Domen (Subdomain)
                        </label>
                        <input
                            disabled
                            type="text"
                            value={formData.domain_slug}
                            className="w-full bg-black/20 border border-[var(--border-color)] rounded-2xl px-5 py-4 text-gray-500 font-bold outline-none cursor-not-allowed opacity-70"
                        />
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1 ml-1">* Domenni faqat PRO ERP ma'murlari o'zgartira oladi.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                            <Globe size={14} /> Asosiy Til
                        </label>
                        <select
                            value={formData.language}
                            onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                            className="w-full bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-[var(--text-primary)] font-bold outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="uz">O'zbekcha (Lotin)</option>
                            <option value="uz_cyrl">Ўзбекча (Кирилл)</option>
                            <option value="ru">Русский</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                            <DollarSign size={14} /> Asosiy Valyuta
                        </label>
                        <select
                            value={formData.currency}
                            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                            className="w-full bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl px-5 py-4 text-[var(--text-primary)] font-bold outline-none focus:border-indigo-500 transition-colors"
                        >
                            <option value="UZS">So'm (UZS)</option>
                            <option value="USD">Dollar (USD)</option>
                            <option value="EUR">Yevro (EUR)</option>
                            <option value="RUB">Rubl (RUB)</option>
                        </select>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-10 py-4 rounded-2xl uppercase tracking-widest text-xs flex items-center gap-3 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] transition-all active:scale-95 disabled:opacity-70"
                    >
                        {saving ? <Activity size={20} className="animate-spin" /> : <Save size={20} />}
                        {saving ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Sozlamalar;
