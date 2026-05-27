import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, UploadCloud, Globe, DollarSign, Activity, Image as ImageIcon, Edit2, Trash2, Palette, Crown, Lock } from 'lucide-react';
import ImageCropper from '../components/ImageCropper';

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
        plan_tier: 'standart',
        sidebar_theme: 'classic'
    });

    const [uploading, setUploading] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [tempImage, setTempImage] = useState(null);

    const THEMES = [
        { id: 'classic', name: 'Standart (Default)', preview: 'bg-slate-900 border-gray-600' },
        { id: 'space', name: 'Cosmic Space', preview: 'bg-[#050b14] border-[#00f2fe]' },
        { id: 'sunset', name: 'Neon Sunset', preview: 'bg-[#17091c] border-[#d946ef]' },
        { id: 'cyber', name: 'Cyber Matrix', preview: 'bg-[#020a06] border-[#10b981]' },
        { id: 'royal', name: 'Royal Amethyst', preview: 'bg-[#10051a] border-[#a855f7]' },
        { id: 'custom', name: 'O\'zingiz Tanlang', preview: 'bg-gradient-to-br from-red-500 via-green-500 to-blue-500 border-white' }
    ];

    const isUltra = formData.plan_tier === 'ultra';

    useEffect(() => {
        if (tenant) {
            fetchSettings();
        }
    }, [tenant]);

    // Simple color darkener/lightener
    const adjustColor = (color, amount) => {
        return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    };

    // Live preview
    useEffect(() => {
        if (!tenant) return;
        const root = document.documentElement;
        const theme = formData.sidebar_theme;
        
        if (theme && theme.startsWith('custom:')) {
            const hex = theme.split(':')[1];
            root.className = 'theme-custom';
            root.style.setProperty('--bg-body', adjustColor(hex, -40));
            root.style.setProperty('--bg-sidebar', adjustColor(hex, -20));
            root.style.setProperty('--bg-sidebar-footer', adjustColor(hex, -30));
            root.style.setProperty('--bg-card', adjustColor(hex, -35) + 'CC');
            root.style.setProperty('--color-primary', hex);
            root.style.setProperty('--border-sidebar', hex + '44');
        } else if (theme && theme !== 'classic') {
            root.className = `theme-${theme}`;
            root.removeAttribute('style');
        } else {
            root.className = '';
            root.removeAttribute('style');
        }

        return () => {
            // Restore on unmount (only if not saved)
            // Wait, when saving, the page reloads, so unmount cleanup is fine
            const originalTheme = tenant?.sidebar_theme;
            if (originalTheme && originalTheme.startsWith('custom:')) {
                const hex = originalTheme.split(':')[1];
                root.className = 'theme-custom';
                root.style.setProperty('--bg-body', adjustColor(hex, -40));
                root.style.setProperty('--bg-sidebar', adjustColor(hex, -20));
                root.style.setProperty('--bg-sidebar-footer', adjustColor(hex, -30));
                root.style.setProperty('--bg-card', adjustColor(hex, -35) + 'CC');
                root.style.setProperty('--color-primary', hex);
                root.style.setProperty('--border-sidebar', hex + '44');
            } else if (originalTheme && originalTheme !== 'classic') {
                root.className = `theme-${originalTheme}`;
                root.removeAttribute('style');
            } else {
                root.className = '';
                root.removeAttribute('style');
            }
        };
    }, [formData.sidebar_theme, tenant]);

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
                    plan_tier: data.plan_tier || 'standart',
                    sidebar_theme: data.sidebar_theme || 'classic'
                });
            }
        } catch (error) {
            console.error('Sozlamalarni yuklashda xatolik:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Iltimos, faqat rasm fayllarini yuklang.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setTempImage(reader.result);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedImageUrl) => {
        setShowCropper(false);
        try {
            setUploading(true);

            // Convert blob URL back to Blob for upload
            const response = await fetch(croppedImageUrl);
            const blob = await response.blob();
            const fileName = `logo-${tenant.id}-${Date.now()}.png`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('model-images')
                .upload(filePath, blob, { contentType: 'image/png' });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('model-images')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, logo_url: publicUrl }));
            alert('Logotip qirqildi va yuklandi!');
        } catch (error) {
            alert('Xatolik: ' + error.message);
        } finally {
            setUploading(false);
            setTempImage(null);
        }
    };

    const handleDeleteLogo = () => {
        if (confirm("Logotipni o'chirib tashlamoqchimisiz?")) {
            setFormData(prev => ({ ...prev, logo_url: '' }));
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
                    currency: formData.currency,
                    sidebar_theme: formData.sidebar_theme
                })
                .eq('id', tenant.id);

            if (error) throw error;
            alert("Sozlamalar muvaffaqiyatli saqlandi! O'zgarishlar darhol kuchga kiradi.");
            
            // Reload page to apply new logo and theme globally
            window.location.reload();
        } catch (error) {
            alert("Xatolik: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleThemeClick = (themeId) => {
        if (themeId === 'custom') {
            setFormData(prev => ({ ...prev, sidebar_theme: 'custom:#3b82f6' })); // default custom color
        } else {
            setFormData(prev => ({ ...prev, sidebar_theme: themeId }));
        }
    };

    if (loading) {
        return <div className="py-20 text-center"><Activity className="animate-spin mx-auto text-indigo-500" /></div>;
    }

    const isCustomActive = formData.sidebar_theme?.startsWith('custom:');
    const customColor = isCustomActive ? formData.sidebar_theme.split(':')[1] : '#3b82f6';

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
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black border uppercase ${isUltra ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                            Tarif: {formData.plan_tier}
                        </span>
                    </p>
                </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSave} className="space-y-6">
                
                {/* Logo Section */}
                <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-6 md:p-8 border border-[var(--border-color)] shadow-xl relative overflow-hidden">
                    {!isUltra && (
                        <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                            <Lock size={32} className="text-amber-500 mb-3" />
                            <h3 className="text-lg font-black text-white">Bu xizmat yopiq</h3>
                            <p className="text-sm text-gray-400">Logotip yuklash faqat ULTRA tarifida mavjud</p>
                            <button type="button" className="mt-4 bg-amber-500 text-black px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-amber-400 transition-colors">
                                <Crown size={14} /> Tarifni Oshirish
                            </button>
                        </div>
                    )}
                    <h3 className="text-xl font-black text-[var(--text-primary)] mb-6 flex items-center gap-2 relative z-10">
                        <ImageIcon className="text-indigo-500" />
                        Korxona Logotipi <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full uppercase tracking-widest">Ultra</span>
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
                        <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-[var(--border-color)] flex flex-col items-center justify-center bg-[var(--bg-body)] overflow-hidden shrink-0 shadow-inner group relative">
                            {uploading ? (
                                <Activity size={24} className="animate-spin text-indigo-500" />
                            ) : formData.logo_url ? (
                                <>
                                    <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button type="button" onClick={() => document.getElementById('logo-upload').click()} className="p-2 bg-indigo-500/20 text-indigo-400 hover:text-white rounded-full transition-colors" title="Almashtirish"><Edit2 size={16} /></button>
                                        <button type="button" onClick={handleDeleteLogo} className="p-2 bg-rose-500/20 text-rose-400 hover:text-white rounded-full transition-colors" title="O'chirish"><Trash2 size={16} /></button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-[var(--text-secondary)] flex flex-col items-center">
                                    <ImageIcon size={32} className="opacity-50 mb-2" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Logo yo'q</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-4 text-center sm:text-left">
                            <p className="text-sm text-[var(--text-secondary)]">
                                Tizim sarlavhasida o'z logotipingizni ko'rsatish imkoniyati.
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
                                    {formData.logo_url ? 'Logotipni Almashtirish' : 'Yangi Logo Yuklash'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Theme Selector Section */}
                <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-6 md:p-8 border border-[var(--border-color)] shadow-xl relative overflow-hidden">
                    {!isUltra && (
                        <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                            <Lock size={32} className="text-amber-500 mb-3" />
                            <h3 className="text-lg font-black text-white">Bu xizmat yopiq</h3>
                            <p className="text-sm text-gray-400">Shablonlarni o'zgartirish faqat ULTRA tarifida mavjud</p>
                            <button type="button" className="mt-4 bg-amber-500 text-black px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-amber-400 transition-colors">
                                <Crown size={14} /> Tarifni Oshirish
                            </button>
                        </div>
                    )}
                    <h3 className="text-xl font-black text-[var(--text-primary)] mb-6 flex items-center gap-2 relative z-10">
                        <Palette className="text-indigo-500" />
                        Tizim Dizayni (Mavzular) <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full uppercase tracking-widest">Ultra</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative z-10">
                        {THEMES.map(theme => {
                            const isActive = theme.id === 'custom' ? isCustomActive : formData.sidebar_theme === theme.id;
                            return (
                                <button
                                    key={theme.id}
                                    type="button"
                                    onClick={() => handleThemeClick(theme.id)}
                                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${isActive ? 'border-indigo-500 bg-indigo-500/10 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'border-[var(--border-color)] bg-[var(--bg-body)] hover:border-gray-500'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full ${theme.preview} border-2 border-white/10 shadow-inner flex items-center justify-center`} />
                                    <span className={`text-[9px] font-black uppercase tracking-widest text-center leading-tight ${isActive ? 'text-indigo-400' : 'text-gray-400'}`}>
                                        {theme.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    
                    {isCustomActive && (
                        <div className="mt-6 p-4 bg-black/20 rounded-2xl border border-white/5 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                            <label className="text-sm font-bold text-white flex-1">Maxsus rangingizni tanlang:</label>
                            <input 
                                type="color" 
                                value={customColor} 
                                onChange={(e) => setFormData(prev => ({ ...prev, sidebar_theme: `custom:${e.target.value}` }))}
                                className="w-16 h-12 rounded cursor-pointer bg-transparent border-0"
                            />
                        </div>
                    )}
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

            {/* Cropper Modal */}
            {showCropper && (
                <ImageCropper
                    image={tempImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => { setShowCropper(false); setTempImage(null); }}
                />
            )}
        </div>
    );
};

export default Sozlamalar;
