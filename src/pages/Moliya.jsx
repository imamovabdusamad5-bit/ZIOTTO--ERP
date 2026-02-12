import React, { useState, useEffect } from 'react';
import { Banknote, DollarSign, Wallet, Send, Users, Search, RefreshCw, CircleCheck, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Moliya = () => {
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [productionLogs, setProductionLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Employees
            const { data: profiles, error: pErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('status', true);
            if (pErr) throw pErr;

            // 2. Fetch Attendance for current month
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            const { data: att, error: aErr } = await supabase
                .from('attendance')
                .select('*')
                .gte('date', firstDay);
            if (aErr) throw aErr;

            // 3. Fetch Production Logs (Ishbay)
            // Note: Assuming production_logs table exists or will be created
            const { data: logs, error: lErr } = await supabase
                .from('activity_logs') // Fallback to activity_logs if production_logs not yet created
                .select('*')
                .gte('created_at', firstDay);

            // Map data to local state
            setEmployees(profiles || []);
            setAttendance(att || []);
            setProductionLogs(logs || []);

        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate dynamic stats
    const calculateSalary = (empId) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return 0;

        // Base salary (attendance based)
        const daysPresent = attendance.filter(a => a.profile_id === empId && a.status !== 'absent').length;
        const dailyRate = (emp.base_salary || 0) / 26; // Assume 26 working days
        const fixedSalary = daysPresent * dailyRate;

        // Piece-rate (ishbay) - In real app, fetch from production_logs
        // For now, mock some data proportional to efficiency or activity logs
        const pieceWork = productionLogs.filter(l => l.user_name === emp.username).length * 5000; // Mock rate

        return Math.round(fixedSalary + pieceWork);
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
    };

    const filteredEmployees = employees.filter(emp =>
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalBudget = employees.reduce((sum, emp) => sum + calculateSalary(emp.id), 0);

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Moliya Bo'limi</h2>
                    <p className="text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Oylik maosh hisob-kitobi va to'lovlar</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                        <input
                            type="text"
                            placeholder="Xodim qidirish..."
                            className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl pl-12 pr-6 py-4 text-sm text-[var(--text-primary)] focus:border-blue-500 outline-none w-64 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                        <DollarSign size={80} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-4">Jami Hisoblangan</p>
                        <p className="text-3xl font-black">{formatMoney(totalBudget)}</p>
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-2">{new Date().toLocaleString('uz-UZ', { month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-orange-500">
                        <Wallet size={80} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4">To'lanishi Kerak</p>
                        <p className="text-3xl font-black text-[var(--text-primary)]">{formatMoney(totalBudget * 0.4)}</p>
                        <p className="text-[10px] text-orange-500/50 font-bold uppercase tracking-widest mt-2">Tasdiqlanmagan to'lovlar</p>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform text-purple-500">
                        <Banknote size={80} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4">O'rtacha Maosh</p>
                        <p className="text-3xl font-black text-[var(--text-primary)]">{formatMoney(employees.length ? totalBudget / employees.length : 0)}</p>
                        <p className="text-[10px] text-purple-500/50 font-bold uppercase tracking-widest mt-2">Bir xodimga</p>
                    </div>
                </div>
            </div>

            {/* Payroll Table */}
            <div className="bg-[var(--bg-card)] rounded-[3rem] shadow-2xl border border-[var(--border-color)] overflow-hidden">
                <div className="px-10 py-8 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-body)]">
                    <div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Maosh Jadvali</h3>
                        <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">Hozirgi oy bo'yicha hisob-kitoblar</p>
                    </div>
                    <button onClick={fetchFinanceData} className="p-4 bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-2xl transition-all border border-[var(--border-color)]">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[var(--bg-body)]">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Xodim</th>
                                <th className="px-10 py-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Bo'lim / Tur</th>
                                <th className="px-10 py-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Davomat (Kun)</th>
                                <th className="px-10 py-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Ishbay (Dona)</th>
                                <th className="px-10 py-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-right">Jami Maosh</th>
                                <th className="px-10 py-6 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest text-right">Amal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {loading ? (
                                <tr><td colSpan="6" className="py-20 text-center text-[var(--text-secondary)] font-bold">Yuklanmoqda...</td></tr>
                            ) : filteredEmployees.map((emp) => {
                                const salary = calculateSalary(emp.id);
                                const days = attendance.filter(a => a.profile_id === emp.id && a.status !== 'absent').length;
                                const workCount = productionLogs.filter(l => l.user_name === emp.username).length;

                                return (
                                    <tr key={emp.id} className="hover:bg-[var(--bg-body)] transition-all group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-[var(--bg-body)] rounded-2xl border border-[var(--border-color)] flex items-center justify-center text-blue-500 font-black text-lg shadow-inner">
                                                    {emp.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-[var(--text-primary)]">{emp.full_name}</p>
                                                    <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">@{emp.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[var(--text-primary)] font-black text-xs uppercase tracking-widest">{emp.department || 'Bo\'limsiz'}</span>
                                                <span className="text-[10px] text-[var(--text-secondary)] font-bold">Ishbay + Oylik</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2">
                                                <CircleCheck size={14} className="text-emerald-500" />
                                                <span className="text-sm font-black text-[var(--text-primary)]">{days} kun</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2">
                                                <RefreshCw size={14} className="text-blue-500" />
                                                <span className="text-sm font-black text-[var(--text-primary)]">{workCount} ta</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <span className="text-lg font-black text-emerald-500">{formatMoney(salary)}</span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedEmployee(emp);
                                                    setShowPaymentModal(true);
                                                }}
                                                className="bg-[var(--bg-body)] hover:bg-emerald-600 hover:text-white text-[var(--text-secondary)] px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-[var(--border-color)]"
                                            >
                                                To'lash
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedEmployee && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-4xl animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-[var(--border-color)] flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">To'lovni Tasdiqlash</h3>
                                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1">{selectedEmployee.full_name}</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="bg-[var(--bg-body)] p-8 rounded-[2rem] border border-[var(--border-color)] text-center">
                                <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest mb-2">To'lanadigan Summa</p>
                                <p className="text-4xl font-black text-emerald-500">{formatMoney(calculateSalary(selectedEmployee.id))}</p>
                            </div>

                            <div className="space-y-4">
                                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-3xl transition-all shadow-2xl shadow-emerald-500/20 uppercase tracking-[0.2em] text-xs">
                                    To'landi Deb Belgilash
                                </button>
                                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-3xl transition-all shadow-2xl shadow-blue-500/20 uppercase tracking-[0.2em] text-xs">
                                    Avans Sifatida To'lash
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Moliya;
