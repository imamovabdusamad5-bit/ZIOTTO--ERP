import { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Layers, Package, Activity, Search, Edit2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ImageCropper from '../components/ImageCropper';

const Ma_lumotlar = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        type: 'Mato',
        name: '',
        code: '',
        thread_type: '',
        grammage: '',
        unit: 'kg',
        image_url: ''
    });
    const [uploading, setUploading] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('material_types')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching items:', error.message);
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
            const fileName = `ref-cropped-${Math.random().toString(36).substring(2)}-${Date.now()}.jpg`;
            const filePath = `references/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('model-images')
                .upload(filePath, blob, { contentType: 'image/jpeg' });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('model-images')
                .getPublicUrl(filePath);

            setFormData({ ...formData, image_url: publicUrl });
            alert('Rasm qirqildi va yuklandi!');
        } catch (error) {
            alert('Xatolik: ' + error.message);
        } finally {
            setUploading(false);
            setTempImage(null);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const dataToSave = {
                ...formData,
                code: formData.code?.trim() || null,
                grammage: formData.grammage === '' ? null : formData.grammage
            };

            if (editingId) {
                const { error } = await supabase
                    .from('material_types')
                    .update(dataToSave)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('material_types')
                    .insert([dataToSave]);
                if (error) throw error;
            }

            if (editingId) {
                setShowForm(false);
                setEditingId(null);
                setFormData({ type: 'Mato', name: '', code: '', thread_type: '', grammage: '', unit: 'kg', image_url: '' });
                alert('Ma\'lumot yangilandi!');
            } else {
                alert('Ma\'lumot saqlandi! Rasm tozalandi, qolgan ma\'lumotlar saqlandi.');
                // Keep everything (including code) but clear image
                setFormData(prev => ({
                    ...prev,
                    image_url: '' // Only clear the image
                }));
            }
            fetchItems();
        } catch (error) {
            alert('Xatolik: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            type: item.type,
            name: item.name,
            code: item.code || '',
            thread_type: item.thread_type || '',
            grammage: item.grammage || '',
            unit: item.unit,
            image_url: item.image_url || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Ushbu ma\'lumotni o\'chirib tashlamoqchimisiz?')) return;
        try {
            const { error } = await supabase
                .from('material_types')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchItems();
        } catch (error) {
            alert('Xatolik: ' + error.message);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'All' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">Ma'lumotnomalar</h2>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest text-[10px] mt-1">Mato va aksessuarlar bazasini boshqarish</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); setFormData({ type: 'Mato', name: '', code: '', thread_type: '', grammage: '', unit: 'kg', image_url: '' }); }}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 font-semibold text-sm"
                >
                    <Plus size={18} />
                    Yangi Qo'shish
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-[#161b22] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden animate-in slide-in-from-top-4 duration-500">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/2">
                        <h3 className="text-xl font-black text-white tracking-tight">
                            {editingId ? 'Ma\'lumotni Tahrirlash' : 'Yangi Ma\'lumot Qo\'shish'}
                        </h3>
                        <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white font-black uppercase tracking-widest text-[10px]">Bekor qilish</button>
                    </div>
                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Image Upload Area */}
                            <div className="w-full lg:w-48 h-48 flex-shrink-0">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Rasm (Shevronlar uchun)</label>
                                <div
                                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-500/5'); }}
                                    onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-500/5'); }}
                                    onDrop={e => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-500/5');
                                        const file = e.dataTransfer.files[0];
                                        handleFileSelect(file);
                                    }}
                                    onClick={() => document.getElementById('ref-image-upload').click()}
                                    className="relative group w-full h-40 border-2 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all overflow-hidden bg-black/40 shadow-inner"
                                >
                                    {uploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Activity size={24} className="animate-spin text-indigo-500" />
                                            <span className="text-[10px] font-bold text-indigo-400 italic">Yuklanmoqda...</span>
                                        </div>
                                    ) : formData.image_url ? (
                                        <div className="relative w-full h-full group">
                                            <img src={formData.image_url} alt="Reference" className="w-full h-full object-cover p-1 rounded-3xl" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Edit2 size={24} className="text-white" />
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setFormData({ ...formData, image_url: '' }); }}
                                                className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center px-4">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-400 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                <Plus size={20} />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Rasm Tanlang</span>
                                            <span className="text-[8px] text-gray-300 mt-1 uppercase">yoki sudrab keling</span>
                                        </div>
                                    )}
                                    <input
                                        id="ref-image-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={e => handleFileSelect(e.target.files[0])}
                                    />
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Turi</label>
                                    <select
                                        className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-indigo-500 outline-none transition-all font-bold"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value, unit: e.target.value === 'Mato' ? 'kg' : 'dona' })}
                                    >
                                        <option value="Mato" className="bg-[#161b22]">Mato</option>
                                        <option value="Aksessuar" className="bg-[#161b22]">Aksessuar</option>
                                    </select>
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                        {formData.type === 'Mato' ? 'MATO' : 'MAHSULOT NOMI'}
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        placeholder={formData.type === 'Mato' ? "Masalan: 2IP, SUPREM, KASHKORSA" : "Masalan: IP, SHEVRON, ZAMOK"}
                                        className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-indigo-500 outline-none transition-all font-black text-lg"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                {formData.type === 'Mato' && (
                                    <div className="lg:col-span-1">
                                        <label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">MATO TURI (Ip Turi)</label>
                                        <input
                                            type="text"
                                            placeholder="Masalan: 30/1, 20/1, 24/1"
                                            className="w-full px-4 py-4 bg-black/40 border border-indigo-500/20 rounded-2xl text-indigo-400 focus:border-indigo-500 outline-none transition-all font-mono font-black text-lg"
                                            value={formData.thread_type}
                                            onChange={e => setFormData({ ...formData, thread_type: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="lg:col-span-1">
                                    <label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">
                                        {formData.type === 'Mato' ? 'ZICHLIGI (Grammaj)' : 'BIRLIK OG\'IRLIGI (Gramm)'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder={formData.type === 'Mato' ? "180" : "5"}
                                            className="w-full px-4 py-4 pr-12 bg-black/40 border border-indigo-500/20 rounded-2xl text-indigo-400 focus:border-indigo-500 outline-none transition-all font-mono font-black text-lg"
                                            value={formData.grammage}
                                            onChange={e => setFormData({ ...formData, grammage: e.target.value })}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                                            {formData.type === 'Mato' ? 'gr/m²' : 'gr'}
                                        </span>
                                    </div>
                                    {formData.type !== 'Mato' && (
                                        <p className="text-[9px] text-gray-400 mt-1">
                                            * Modelxonada donani kg ga o'tkazish uchun ishlatiladi.
                                        </p>
                                    )}
                                </div>

                                <div className="lg:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Artikul Kodi (Ixtiyoriy)</label>
                                    <input
                                        type="text"
                                        placeholder="Masalan: ZIP-001"
                                        className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-gray-400 focus:border-indigo-500 outline-none transition-all font-mono font-bold"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">O'lchov Birligi</label>
                                    <input
                                        list="unit-options"
                                        placeholder="Tanlang yoki yozing..."
                                        className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:border-indigo-500 outline-none transition-all font-bold"
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                    />
                                    <datalist id="unit-options">
                                        <option value="kg" />
                                        <option value="dona" />
                                        <option value="metr" />
                                        <option value="pachka" />
                                        <option value="rulon" />
                                        <option value="litr" />
                                        <option value="komplekt" />
                                    </datalist>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-6 mt-4">
                            <button type="submit" className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all">
                                <Save size={20} />
                                {editingId ? 'Yangilash' : 'Saqlash'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List and Filters */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Qidirish (Nomi yoki Artikul)..."
                            className="w-full pl-12 pr-6 py-4 bg-[#161b22] border border-white/5 rounded-2xl text-white focus:border-indigo-500 outline-none transition-all font-bold"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {['All', 'Mato', 'Aksessuar'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${filterType === type ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20' : 'bg-[#161b22] text-gray-500 border border-white/5 hover:text-white'}`}
                            >
                                {type === 'All' ? 'Hammasi' : type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full py-20 text-center"><Activity className="animate-spin mx-auto text-indigo-500" /></div>
                    ) : filteredItems.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-black/20 rounded-[3rem] border-2 border-dashed border-white/5 text-gray-500 font-bold uppercase tracking-widest text-[10px] italic">Ma'lumot topilmadi...</div>
                    ) : (
                        filteredItems.map(item => (
                            <div key={item.id} className="bg-[#161b22] p-6 rounded-[2rem] shadow-xl border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border border-white/5 shadow-inner ${item.type === 'Mato' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                item.type === 'Mato' ? <Layers size={24} /> : <Package size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-white text-lg tracking-tight">{item.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{item.code || 'Kod yo\'q'}</span>
                                                <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.type}</span>
                                                <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                                <span className="text-[10px] font-black text-gray-400">{item.unit}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(item)} className="p-3 bg-white/5 text-gray-500 hover:text-indigo-400 rounded-xl transition-all"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-3 bg-white/5 text-gray-500 hover:text-rose-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

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

export default Ma_lumotlar;
