import React, { useState, useEffect } from 'react';
import { Banknote, DollarSign, Wallet, Search, RefreshCw, CircleCheck, X } from 'lucide-react';
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

    async function fetchFinanceData() {
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
            const { data: logs, error: lErr } = await supabase
                .from('activity_logs')
                .select('*')
                .gte('created_at', firstDay);

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

        const daysPresent = attendance.filter(a => a.profile_id === empId && a.status !== 'absent').length;
        const dailyRate = (emp.base_salary || 0) / 26;
        const fixedSalary = daysPresent * dailyRate;
        const pieceWork = productionLogs.filter(l => l.user_name === emp.username).length * 5000;

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
                    <h2 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Moliya Bo'limi</h2>
                    <p className="text-[var(--text-secondary)] font-medium text-xs mt-1">Oylik maosh hisob-kitobi va to'lovlar</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                        <input
                            type="text"
                            placeholder="Xodim qidirish..."
                            className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pl-12 pr-6 py-3 text-sm text-[var(--text-primary)] focus:border-blue-500 outline-none w-64 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                        <DollarSign size={64} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">Jami Hisoblangan</p>
                        <p className="text-2xl font-bold tracking-tight tabular-nums">{formatMoney(totalBudget)}</p>
                        <p className="text-xs text-white/60 font-medium tracking-wide mt-2">{new Date().toLocaleString('uz-UZ', { month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-orange-500">
                        <Wallet size={64} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">To'lanishi Kerak</p>
                        <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight tabular-nums">{formatMoney(totalBudget * 0.4)}</p>
                        <p className="text-xs text-orange-500 font-medium tracking-wide mt-2">Tasdiqlanmagan to'lovlar</p>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-purple-500">
                        <Banknote size={64} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">O'rtacha Maosh</p>
                        <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight tabular-nums">{formatMoney(employees.length ? totalBudget / employees.length : 0)}</p>
                        <p className="text-xs text-purple-500 font-medium tracking-wide mt-2">Bir xodimga</p>
                    </div>
                </div>
            </div>

            {/* Payroll Table */}
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-body)]">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">Maosh Jadvali</h3>
                        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Hozirgi oy bo'yicha hisob-kitoblar</p>
                    </div>
                    <button onClick={fetchFinanceData} className="p-2.5 bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl transition-all border border-[var(--border-color)]">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-[var(--bg-body)] text-[var(--text-secondary)] uppercase text-xs tracking-wider border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-left">Xodim</th>
                                <th className="px-6 py-3 font-semibold text-left">Bo'lim / Tur</th>
                                <th className="px-6 py-3 font-semibold text-right num-cell">Davomat (Kun)</th>
                                <th className="px-6 py-3 font-semibold text-right num-cell">Ishbay (Dona)</th>
                                <th className="px-6 py-3 font-semibold text-right num-cell">Jami Maosh</th>
                                <th className="px-6 py-3 font-semibold text-right">Amal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)] font-medium">
                            {loading ? (
                                <tr><td colSpan="6" className="py-12 text-center text-[var(--text-secondary)] font-medium">Yuklanmoqda...</td></tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr><td colSpan="6" className="py-12 text-center text-[var(--text-secondary)] font-medium">Xodimlar topilmadi</td></tr>
                            ) : filteredEmployees.map((emp) => {
                                const salary = calculateSalary(emp.id);
                                const days = attendance.filter(a => a.profile_id === emp.id && a.status !== 'absent').length;
                                const workCount = productionLogs.filter(l => l.user_name === emp.username).length;

                                return (
                                    <tr key={emp.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                                        <td className="px-6 py-3.5 text-left">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-500/10 rounded-full border border-blue-500/20 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {emp.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[var(--text-primary)] text-sm">{emp.full_name}</p>
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium">@{emp.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-left">
                                            <div className="flex flex-col">
                                                <span className="text-[var(--text-primary)] font-medium text-xs">{emp.department || 'Bo\'limsiz'}</span>
                                                <span className="text-[11px] text-[var(--text-secondary)]">Ishbay + Oylik</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-right num-cell font-mono text-xs font-semibold tabular-nums">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <CircleCheck size={14} className="text-emerald-500" />
                                                <span>{days} kun</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-right num-cell font-mono text-xs font-semibold tabular-nums">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <RefreshCw size={14} className="text-blue-500" />
                                                <span>{workCount} ta</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-right num-cell font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                            {formatMoney(salary)}
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedEmployee(emp);
                                                    setShowPaymentModal(true);
                                                }}
                                                className="bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-600 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border border-emerald-600/20"
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">To'lovni Tasdiqlash</h3>
                                <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{selectedEmployee.full_name}</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-[var(--bg-body)] p-6 rounded-xl border border-[var(--border-color)] text-center">
                                <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider mb-1">To'lanadigan Summa</p>
                                <p className="text-3xl font-bold text-emerald-500 tabular-nums">{formatMoney(calculateSalary(selectedEmployee.id))}</p>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-emerald-500/20 text-xs uppercase tracking-wider">
                                    To'landi Deb Belgilash
                                </button>
                                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 text-xs uppercase tracking-wider">
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
