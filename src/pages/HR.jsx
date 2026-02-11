import React, { useState, useEffect } from 'react';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    Plus,
    Search,
    Camera,
    Edit3,
    Trash2,
    CircleCheck,
    Calendar,
    Phone,
    Briefcase,
    X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const HR = () => {
    const { profile } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'
    const [selectedStat, setSelectedStat] = useState(null); // 'total', 'present', 'absent', 'late'

    const [newEmployee, setNewEmployee] = useState({
        username: '',
        unique_code: '',
        full_name: '',
        role: 'Xodim',
        phone: '',
        status: true,
        efficiency: '90%',
        photo_url: '',
        department: 'Tikuv',
        preview: null
    });

    const [checkOutModalEmployee, setCheckOutModalEmployee] = useState(null);
    const [checkOutReason, setCheckOutReason] = useState('');

    // Fetch employees and attendance data
    useEffect(() => {
        fetchEmployees();
    }, [viewMode]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            // Fetch all employees (profiles)
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .eq('status', true);

            if (profilesError) throw profilesError;

            // Fetch attendance based on viewMode
            let attendanceQuery = supabase
                .from('attendance')
                .select('*');

            const today = new Date().toISOString().split('T')[0];
            if (viewMode === 'daily') {
                attendanceQuery = attendanceQuery.eq('date', today);
            } else if (viewMode === 'weekly') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                attendanceQuery = attendanceQuery.gte('date', weekAgo.toISOString().split('T')[0]);
            } else if (viewMode === 'monthly') {
                const monthAgo = new Date();
                monthAgo.setDate(monthAgo.getDate() - 30);
                attendanceQuery = attendanceQuery.gte('date', monthAgo.toISOString().split('T')[0]);
            }

            const { data: attendanceData, error: attendanceError } = await attendanceQuery;
            if (attendanceError) throw attendanceError;

            setEmployees(profilesData || []);
            setAttendance(attendanceData || []);
        } catch (err) {
            console.error('Ma\'lumot yuklashda xatolik:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCheckOut = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const now = new Date();
            const { error } = await supabase
                .from('attendance')
                .update({
                    check_out: now.toISOString(),
                    reason: checkOutReason ? checkOutReason : null // Save reason if provided
                })
                .eq('profile_id', checkOutModalEmployee.id)
                .eq('date', new Date().toISOString().split('T')[0]);

            if (error) throw error;

            setCheckOutModalEmployee(null);
            setCheckOutReason('');
            fetchEmployees();
        } catch (err) {
            alert('Ketish vaqtini saqlashda xatolik: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate attendance stats
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);
    const effectivePresent = todayAttendance.filter(a => a.check_in).length;
    const totalCount = employees.length;

    // Helper to format time
    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };


    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-600/20 rotate-3 transition-transform hover:rotate-0">
                        <Users size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">HR & Kadrlar</h2>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Xodimlar, Davomat (Keldi/Ketdi) va Izohlar</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* View Mode Toggles */}
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setViewMode('daily')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'daily' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Kunlik
                        </button>
                        <button
                            onClick={() => setViewMode('weekly')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'weekly' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Haftalik
                        </button>
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            Oylik
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Xodim qidirish..."
                                className="bg-[#161b22] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm text-white focus:border-emerald-500 outline-none w-64 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Xodim Qo'shish
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                        {viewMode === 'daily' ? "Bugungi holat" : viewMode === 'weekly' ? "Oxirgi 7 kunlik" : "Oxirgi 30 kunlik"}
                    </span>
                </div>
                {profile?.permissions?.managed_depts && (
                    <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                        Cheklangan ruxsat: {profile.permissions.managed_depts.join(', ')}
                    </div>
                )}
                <div className="ml-auto text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                    Jami ko'rilmoqda: {employees.length} nafar
                </div>
            </div>

            {/* Attendance Stats */}
            {/* Attendance Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Jami Xodimlar */}
                <div
                    onClick={() => setSelectedStat('total')}
                    className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group cursor-pointer hover:border-indigo-500/30 transition-all"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-white">
                        <Users size={80} />
                    </div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Jami Xodimlar</p>
                    <p className="text-4xl font-black text-white">{employees.length}</p>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-500">Barchasi</span>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">Ro'yxatni ko'rish</span>
                    </div>
                </div>

                {/* 2. Ishda (Jami) */}
                <div
                    onClick={() => setSelectedStat('present')}
                    className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group border-b-4 border-b-emerald-500 cursor-pointer hover:border-emerald-500/30 transition-all"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-emerald-500">
                        <UserCheck size={80} />
                    </div>
                    <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.2em] mb-4">Ishda (Jami)</p>
                    <p className="text-4xl font-black text-white">
                        {effectivePresent}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400">
                            {totalCount > 0 ? Math.round((effectivePresent / totalCount) * 100) : 0}%
                        </span>
                        <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${totalCount > 0 ? (effectivePresent / totalCount) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* 3. Kelmadi */}
                <div
                    onClick={() => setSelectedStat('absent')}
                    className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group cursor-pointer hover:border-rose-500/30 transition-all border-b-4 border-b-rose-500/50"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-rose-500">
                        <UserX size={80} />
                    </div>
                    <p className="text-[10px] font-black text-rose-500/50 uppercase tracking-[0.2em] mb-4">Kelmadi</p>
                    <p className="text-4xl font-black text-white">
                        {effectiveAbsent}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-rose-500 text-[10px] font-bold uppercase tracking-widest">
                        <UserX size={12} /> {totalCount > 0 ? Math.round((effectiveAbsent / totalCount) * 100) : 0}% qatnashmadi
                    </div>
                </div>

                {/* 4. Kechikkanlar */}
                <div
                    onClick={() => setSelectedStat('late')}
                    className="bg-[#161b22] border border-white/5 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group cursor-pointer hover:border-amber-500/30 transition-all border-b-4 border-b-amber-500/50"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-amber-500">
                        <Clock size={80} />
                    </div>
                    <p className="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] mb-4">Kechikkanlar</p>
                    <p className="text-4xl font-black text-white">
                        {lateCount}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                        <Clock size={12} /> O'rtacha {lateCount > 0 ? Math.round(attendance.reduce((sum, a) => sum + (a.late_minutes || 0), 0) / lateCount) : 0} min
                    </div>
                </div>
            </div>

            {/* Attendance Details Modal */}
            {selectedStat && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-4xl animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-8 sm:p-10 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 capitalize">
                                    {selectedStat === 'total' ? <Users className="text-indigo-500" /> :
                                        selectedStat === 'present' ? <UserCheck className="text-emerald-500" /> :
                                            selectedStat === 'absent' ? <UserX className="text-rose-500" /> :
                                                <Clock className="text-amber-500" />}
                                    {selectedStat === 'total' ? "Barcha Xodimlar" :
                                        selectedStat === 'present' ? "Hozir Ishda" :
                                            selectedStat === 'absent' ? "Kelmaganlar" :
                                                "Kechikkanlar"}
                                </h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                    {viewMode === 'daily' ? "Bugungi" : viewMode === 'weekly' ? "Haftalik" : "Oylik"} hisobot ro'yxati
                                </p>
                            </div>
                            <button onClick={() => setSelectedStat(null)} className="p-4 bg-white/5 text-gray-500 hover:text-white rounded-2xl transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 sm:p-10">
                            <div className="grid grid-cols-1 gap-4">
                                {employees
                                    .filter(emp => {
                                        const att = attendance.find(a => a.profile_id === emp.id);
                                        if (selectedStat === 'total') return true;
                                        if (selectedStat === 'present') return att?.status === 'present' || att?.status === 'late';
                                        if (selectedStat === 'absent') {
                                            if (viewMode === 'daily') return !att || att.status === 'absent';
                                            return att?.status === 'absent';
                                        }
                                        if (selectedStat === 'late') return att?.status === 'late';
                                        return true;
                                    })
                                    .map(emp => {
                                        const att = attendance.find(a => a.profile_id === emp.id);
                                        return (
                                            <div key={emp.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-white/10 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center text-white font-black overflow-hidden shadow-inner">
                                                        {emp.photo_url ? <img src={emp.photo_url} alt="" className="w-full h-full object-cover" /> : emp.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white">{emp.full_name}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{emp.department} • {emp.role}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8">
                                                    {selectedStat === 'present' && (
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Kelgan vaqti</p>
                                                            <p className="text-sm font-mono text-white">{att?.check_in ? new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                                        </div>
                                                    )}
                                                    {selectedStat === 'absent' && (
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Sababi</p>
                                                            <p className="text-sm font-bold text-gray-300">{att?.reason || "Sababsiz"}</p>
                                                        </div>
                                                    )}
                                                    {selectedStat === 'late' && (
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Kechikkan</p>
                                                            <p className="text-sm font-black text-white">{att?.late_minutes || 0} daqiqa</p>
                                                        </div>
                                                    )}
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Samaradorlik</p>
                                                        <p className="text-sm font-black text-white">{att?.efficiency || emp.efficiency || '90%'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                                {employees.filter(emp => {
                                    const att = attendance.find(a => a.profile_id === emp.id);
                                    if (selectedStat === 'total') return true;
                                    if (selectedStat === 'present') return att?.status === 'present' || att?.status === 'late';
                                    if (selectedStat === 'absent') {
                                        if (viewMode === 'daily') return !att || att.status === 'absent';
                                        return att?.status === 'absent';
                                    }
                                    if (selectedStat === 'late') return att?.status === 'late';
                                    return true;
                                }).length === 0 && (
                                        <div className="py-20 text-center">
                                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto text-gray-600 mb-4">
                                                <Search size={32} />
                                            </div>
                                            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Ma'lumot topilmadi</p>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Employee Matrix */}
            <div className="bg-[#161b22] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Foydalanuvchi</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Davomat (Keldi / Ketdi)</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Izoh (Sabab)</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center"><Clock className="animate-spin mx-auto text-emerald-500" /></td>
                                </tr>
                            ) : employees
                                .filter(emp => emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || emp.username?.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((emp) => {
                                    const att = attendance.find(a => a.profile_id === emp.id);

                                    return (
                                        <tr key={emp.id} className="hover:bg-white/5 transition-all group">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-emerald-500 font-black text-xl overflow-hidden shadow-inner">
                                                            {emp.photo_url ? (
                                                                <img src={emp.photo_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                emp.full_name?.charAt(0) || 'U'
                                                            )}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#161b22] ${emp.status ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-white tracking-tight">{emp.full_name || emp.username}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{emp.department || 'Bo\'limsiz'} • {emp.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                {att ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${att.status === 'present' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                                att.status === 'late' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                                    'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                                }`}>
                                                                {att.status === 'present' ? 'KELDI' :
                                                                    att.status === 'late' ? 'KECHIKDI' : 'KELMADI'}
                                                            </span>
                                                            {att.check_in && <span className="text-white font-mono text-xs">{formatTime(att.check_in)}</span>}
                                                        </div>

                                                        {att.status !== 'absent' && (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {att.check_out ? (
                                                                    <>
                                                                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-purple-500/10 text-purple-400 border-purple-500/20">
                                                                            KETDI
                                                                        </span>
                                                                        <span className="text-gray-400 font-mono text-xs">{formatTime(att.check_out)}</span>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setCheckOutModalEmployee(emp)}
                                                                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[9px] font-bold uppercase border border-white/5 transition-all flex items-center gap-1">
                                                                        <CircleCheck size={10} /> Ketishni belgilash
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-600 font-bold uppercase">Ma'lumot yo'q</span>
                                                )}
                                            </td>
                                            <td className="px-10 py-6">
                                                {att?.reason ? (
                                                    <p className="text-xs font-medium text-gray-300 max-w-[200px]">{att.reason}</p>
                                                ) : (
                                                    <span className="text-gray-700 text-[10px] uppercase font-bold">-</span>
                                                )}
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="inline-flex items-center justify-end gap-3">
                                                    {!att ? (
                                                        <button
                                                            onClick={() => setAttModalEmployee(emp)}
                                                            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
                                                        >
                                                            Davomat +
                                                        </button>
                                                    ) : (
                                                        <button className="p-3 bg-white/5 text-gray-500 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">
                                                            <Edit3 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Employee Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-4xl animate-in zoom-in-95 duration-300 relative">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                <Users className="text-emerald-500" />
                                Yangi Xodim Qo'shish
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <Clock className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddEmployee} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Photo Upload Placeholder */}
                            <div className="md:col-span-2 flex justify-center mb-4">
                                <div className="relative group" onClick={() => document.getElementById('emp-photo').click()}>
                                    <div className="w-32 h-32 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 group-hover:border-emerald-500 group-hover:text-emerald-500 transition-all cursor-pointer overflow-hidden">
                                        {newEmployee.preview ? (
                                            <img src={newEmployee.preview} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Camera size={32} />
                                                <span className="text-[10px] font-black uppercase tracking-widest mt-2">Rasm yuklash</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg pointer-events-none">
                                        <Plus size={20} />
                                    </div>
                                    <input
                                        type="file"
                                        id="emp-photo"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handlePhotoSelect}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Foydalanuvchi ismi</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all font-bold"
                                    placeholder="Masalan: ALISHER123"
                                    value={newEmployee.username}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Unikal Kod (Maxsus)</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all font-mono font-bold"
                                    placeholder="9999"
                                    value={newEmployee.unique_code}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, unique_code: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">FOYDALANUVCHI TO'LIQ ISMI</label>
                                <input
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all font-bold text-lg"
                                    placeholder="F.I.SH"
                                    value={newEmployee.full_name}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Lavozimi</label>
                                <input
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all font-bold"
                                    value={newEmployee.role}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">BO'LIMI</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all font-bold"
                                    placeholder="Masalan: Tikuv"
                                    value={newEmployee.department}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Telefon Raqami</label>
                                <input
                                    required
                                    placeholder="+998"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all font-mono"
                                    value={newEmployee.phone}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                                />
                            </div>

                            <button
                                disabled={loading}
                                className="md:col-span-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-xs mt-4 disabled:opacity-50"
                            >
                                {loading ? 'Saqlanmoqda...' : 'XODIMNI SAQLASH'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Attendance Recording Modal */}
            {attModalEmployee && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-4xl animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                    <Clock size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Davomatni Qayd Etish</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{attModalEmployee.full_name}</p>
                                </div>
                            </div>
                            <button onClick={() => setAttModalEmployee(null)} className="text-gray-500 hover:text-white transition-colors">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAttendance} className="p-10 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Bugungi Holati</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Keldi', 'Kechikdi', 'Kelmadi'].map(status => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setAttFormData({ ...attFormData, status })}
                                            className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${attFormData.status === status
                                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                                : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {attFormData.status === 'Kechikdi' && (
                                <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Kechikkan vaqti (daqiqa)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all font-black text-lg"
                                        value={attFormData.late_minutes}
                                        onChange={(e) => setAttFormData({ ...attFormData, late_minutes: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            )}

                            {(attFormData.status === 'Kechikdi' || attFormData.status === 'Kelmadi') && (
                                <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Sababi</label>
                                    <textarea
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all font-bold min-h-[100px] resize-none"
                                        value={attFormData.reason}
                                        onChange={(e) => setAttFormData({ ...attFormData, reason: e.target.value })}
                                        placeholder="Sababini yozing..."
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Samaradorlik (%)</label>
                                <input
                                    type="number"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all font-black"
                                    value={attFormData.efficiency}
                                    onChange={(e) => setAttFormData({ ...attFormData, efficiency: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-3xl transition-all shadow-2xl shadow-emerald-500/20 uppercase tracking-[0.2em] text-xs"
                            >
                                {loading ? 'Saqlanmoqda...' : 'SAQLASH VA QAYD ETISH'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Check Out Modal */}
            {checkOutModalEmployee && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-4xl animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
                                    <CircleCheck size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Ishni Yakunlash</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{checkOutModalEmployee.full_name}</p>
                                </div>
                            </div>
                            <button onClick={() => setCheckOutModalEmployee(null)} className="text-gray-500 hover:text-white transition-colors">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCheckOut} className="p-10 space-y-8">
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Hozirgi Vaqt</p>
                                <p className="text-3xl font-black text-white font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Izoh / Sabab (Ixtiyoriy)</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-emerald-500 transition-all font-bold min-h-[100px] resize-none"
                                    value={checkOutReason}
                                    onChange={(e) => setCheckOutReason(e.target.value)}
                                    placeholder="Masalan: Uyga erta ketishga ruxsat oldim..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-6 rounded-3xl transition-all shadow-2xl shadow-purple-500/20 uppercase tracking-[0.2em] text-xs"
                            >
                                {loading ? 'Saqlanmoqda...' : 'KETISHNI TASDIQLASH'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HR;
