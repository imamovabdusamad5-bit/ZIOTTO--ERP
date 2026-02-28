import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    ShieldAlert,
    Key,
    Pencil,
    Save,
    X,
    Check,
    CircleCheck,
    CircleMinus,
    Copy,
    RefreshCw,
    Plus,
    CircleAlert
} from 'lucide-react';

const departments = [
    { role: 'admin', name: 'Rahbar (Admin)' },
    { role: 'planning', name: 'Planlama (BOM)' },
    { role: 'supply', name: 'Ta\'minot' },
    { role: 'warehouse', name: 'Ombor' },
    { role: 'cutting', name: 'Kesim' },
    { role: 'sorting', name: 'Tasnif' },
    { role: 'printing', name: 'Pechat & Naqsh' },
    { role: 'sewing', name: 'Tikuv' },
    { role: 'otk', name: 'OTK (Sifat)' },
    { role: 'ironing', name: 'Dazmol & Qadoq' },
];

const Xodimlar = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const [editForm, setEditForm] = useState({
        username: '',
        unique_code: '',
        department: '',
        status: true,
        permissions: { managed_depts: [] }
    });

    const [newUserData, setNewUserData] = useState({
        username: '',
        unique_code: '',
        full_name: '',
        department: '',
        status: true,
        permissions: { managed_depts: [] }
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('username', { ascending: true });

        if (!error) {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const { error } = await supabase
            .from('profiles')
            .insert([{
                username: newUserData.username.toUpperCase(),
                unique_code: newUserData.unique_code,
                full_name: newUserData.full_name || newUserData.username,
                department: newUserData.department,
                status: newUserData.status,
                permissions: newUserData.permissions,
                role: 'user'
            }]);

        if (!error) {
            setShowAddModal(false);
            setNewUserData({ username: '', unique_code: '', full_name: '', status: true, permissions: {} });
            fetchUsers();
        } else {
            alert('Xatolik: ' + error.message);
        }
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setEditForm({
            username: user.username,
            unique_code: user.unique_code,
            department: user.department || '',
            status: user.status,
            permissions: user.permissions || {}
        });
    };

    const togglePermission = (deptRole, level) => {
        const current = editForm.permissions[deptRole];
        const newPermissions = { ...editForm.permissions };

        if (current === level) {
            delete newPermissions[deptRole];
        } else {
            newPermissions[deptRole] = level;
        }

        setEditForm({ ...editForm, permissions: newPermissions });
    };

    const toggleManagedDept = (deptName) => {
        const currentManaged = editForm.permissions.managed_depts || [];
        const newManaged = currentManaged.includes(deptName)
            ? currentManaged.filter(d => d !== deptName)
            : [...currentManaged, deptName];

        setEditForm({
            ...editForm,
            permissions: {
                ...editForm.permissions,
                managed_depts: newManaged
            }
        });
    };

    const handleSave = async (userId) => {
        const { error } = await supabase
            .from('profiles')
            .update({
                username: editForm.username.toUpperCase(),
                unique_code: editForm.unique_code,
                department: editForm.department,
                status: editForm.status,
                permissions: editForm.permissions
            })
            .eq('id', userId);

        if (!error) {
            setEditingId(null);
            fetchUsers();
        } else {
            alert('Xatolik: ' + error.message);
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20 rotate-3">
                        <Users size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Xodimlar va Ruxsatlar</h2>
                        <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Kirish kodlari va huquqlar matritsasi</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-[var(--bg-card)] hover:bg-[var(--bg-header)] text-[var(--text-primary)] px-6 py-3 rounded-2xl font-bold transition-all border border-[var(--border-color)] flex items-center gap-2"
                >
                    <Plus size={20} />
                    Yangi Xodim Qo'shish
                </button>
            </div>

            {/* Matrix Table */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--bg-header)] uppercase tracking-[0.2em] text-[10px] font-black text-[var(--text-secondary)]">
                            <tr>
                                <th className="px-8 py-6 border-b border-white/5">Foydalanuvchi / Bo'lim</th>
                                <th className="px-8 py-6 border-b border-white/5">Unikal Kod</th>
                                <th className="px-8 py-6 border-b border-white/5">Ruxsatlar Matritsasi (Matrix)</th>
                                <th className="px-6 py-6 border-b border-white/5 text-right">Amal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {users.map((user) => (
                                <tr key={user.id} className={`hover:bg-[var(--bg-header)] transition-all group ${editingId === user.id ? 'bg-indigo-600/5' : ''}`}>
                                    <td className="px-8 py-6 align-top">
                                        {editingId === user.id ? (
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Username"
                                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold uppercase focus:border-indigo-500 outline-none w-full shadow-inner"
                                                    value={editForm.username}
                                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Bo'limi"
                                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-indigo-400 font-bold uppercase focus:border-indigo-500 outline-none w-full shadow-inner"
                                                    value={editForm.department}
                                                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                                />
                                                <div className="flex items-center gap-2 px-1">
                                                    <input
                                                        type="checkbox"
                                                        id={`status-${user.id}`}
                                                        checked={editForm.status}
                                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.checked })}
                                                        className="w-4 h-4 rounded border-gray-700 bg-black text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <label htmlFor={`status-${user.id}`} className="text-[10px] font-black uppercase tracking-widest text-gray-500 cursor-pointer">Aktiv holat</label>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-black text-[var(--text-primary)] tracking-tight uppercase leading-none">{user.username}</span>
                                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">{user.department || 'Bo\'limsiz'}</span>
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded bg-white/5 w-fit ${user.status ? 'text-green-500' : 'text-rose-500'}`}>
                                                    {user.status ? '● Aktiv' : '○ Bloklangan'}
                                                </span>
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-8 py-6 align-top">
                                        {editingId === user.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-indigo-500 outline-none w-32 shadow-inner"
                                                    value={editForm.unique_code}
                                                    onChange={(e) => setEditForm({ ...editForm, unique_code: e.target.value })}
                                                />
                                                <button
                                                    onClick={() => setEditForm({ ...editForm, unique_code: Math.random().toString(36).slice(-6).toUpperCase() })}
                                                    className="p-3 bg-indigo-600/20 text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-lg"
                                                >
                                                    <RefreshCw size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <code className="bg-indigo-600/10 px-4 py-2 rounded-xl text-sm font-mono text-indigo-400 font-bold border border-indigo-600/20 shadow-inner">
                                                {user.unique_code}
                                            </code>
                                        )}
                                    </td>

                                    <td className="px-8 py-6">
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            {departments.filter(d => d.role !== 'admin').map((dept) => {
                                                const perm = editingId === user.id ? editForm.permissions[dept.role] : user.permissions?.[dept.role];

                                                return (
                                                    <div key={dept.role} className={`p-3 rounded-2xl border transition-all ${perm ? 'bg-indigo-600/5 border-indigo-500/30' : 'bg-black/20 border-white/5 opacity-60'}`}>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 truncate">{dept.name}</p>

                                                        {editingId === user.id ? (
                                                            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl">
                                                                <button
                                                                    onClick={() => togglePermission(dept.role, 'read')}
                                                                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-[9px] font-bold transition-all ${perm === 'read' ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-white'}`}
                                                                >
                                                                    👁️ READ
                                                                </button>
                                                                <button
                                                                    onClick={() => togglePermission(dept.role, 'full')}
                                                                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-[9px] font-bold transition-all ${perm === 'full' ? 'bg-green-500 text-black' : 'text-gray-500 hover:text-white'}`}
                                                                >
                                                                    ✏️ FULL
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                {perm === 'full' ? (
                                                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-green-500 uppercase">
                                                                        <CircleCheck size={12} /> To'liq
                                                                    </span>
                                                                ) : perm === 'read' ? (
                                                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase">
                                                                        <CircleAlert size={12} /> Faqat ko'rish
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[9px] font-black text-gray-700 uppercase">Kirish yo'q</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Managed Departments for HR-like restriction */}
                                        {(editingId === user.id ? (editForm.permissions.hr || editForm.permissions.admin) : (user.permissions?.hr || user.permissions?.admin)) && (
                                            <div className="mt-4 p-4 bg-[var(--bg-header)] rounded-3xl border border-[var(--border-color)]">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Boshqariladigan Bo'limlar (Restriction)</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {departments.map(d => (
                                                        editingId === user.id ? (
                                                            <button
                                                                key={d.name}
                                                                onClick={() => toggleManagedDept(d.name)}
                                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${editForm.permissions.managed_depts?.includes(d.name) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/40 border-white/10 text-gray-500'}`}
                                                            >
                                                                {d.name}
                                                            </button>
                                                        ) : (
                                                            user.permissions?.managed_depts?.includes(d.name) && (
                                                                <span key={d.name} className="px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-[10px] font-bold text-indigo-400">
                                                                    {d.name}
                                                                </span>
                                                            )
                                                        )
                                                    ))}
                                                    {!editingId && !user.permissions?.managed_depts?.length && (
                                                        <span className="text-[10px] font-bold text-gray-600 uppercase">Barcha bo'limlar ochiq</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-8 py-6 text-right">
                                        {editingId === user.id ? (
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleSave(user.id)}
                                                    className="p-3 bg-green-500 text-black rounded-2xl hover:bg-green-400 transition-all shadow-xl shadow-green-500/20"
                                                >
                                                    <Save size={20} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-3 bg-white/5 text-gray-500 rounded-2xl hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-4 bg-white/5 text-gray-500 rounded-2xl hover:bg-indigo-600 hover:text-white hover:scale-110 transition-all border border-white/5"
                                            >
                                                <Pencil size={20} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-md rounded-[3rem] p-10 shadow-4xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={() => setShowAddModal(false)} className="text-gray-600 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <h3 className="text-2xl font-black text-[var(--text-primary)] text-center mb-8 tracking-tight">Yangi Xodim Qo'shish</h3>
                        <form onSubmit={handleAdd} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Foydalanuvchi Ismi</label>
                                <input
                                    required
                                    className="w-full bg-[var(--bg-header)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-bold uppercase"
                                    value={newUserData.username}
                                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Unikal Kod (Maxsus)</label>
                                <div className="relative">
                                    <input
                                        required
                                        className="w-full bg-[var(--bg-header)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-mono"
                                        value={newUserData.unique_code}
                                        onChange={(e) => setNewUserData({ ...newUserData, unique_code: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setNewUserData({ ...newUserData, unique_code: Math.random().toString(36).slice(-6).toUpperCase() })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:text-white"
                                    >
                                        <RefreshCw size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Foydalanuvchi To'liq Ismi</label>
                                <input
                                    className="w-full bg-[var(--bg-header)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-all font-bold"
                                    value={newUserData.full_name}
                                    onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Bo'limi (Lavozimi)</label>
                                <input
                                    className="w-full bg-[var(--bg-header)] border border-[var(--border-color)] rounded-2xl p-4 text-indigo-400 outline-none focus:border-indigo-500 transition-all font-bold uppercase"
                                    placeholder="MASALAN: KESIM USTA"
                                    value={newUserData.department}
                                    onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                                />
                            </div>
                            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-xs">
                                Xodimni Saqlash
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Xodimlar;
