import React from 'react';
import { Users, ShoppingBag, Activity, TrendingUp, CircleAlert, CircleCheck, Package, Clock } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

const stats = [
    { title: 'Faol Modellar', value: '12', icon: ShoppingBag, color: 'bg-indigo-500', trend: '+2 yangi' },
    { title: 'Kunlik Ish (dona)', value: '1,450', icon: Activity, color: 'bg-emerald-500', trend: '85% unum' },
    { title: 'Brak darajasi', value: '1.2%', icon: CircleAlert, color: 'bg-rose-500', trend: '-0.3% o\'tgan oydan' },
    { title: 'Tannarx (avg)', value: '$6.80', icon: TrendingUp, color: 'bg-amber-500', trend: 'Stabil' },
];

const productionData = [
    { name: 'Planlama', value: 45, color: '#6366f1' },
    { name: 'Kesim', value: 80, color: '#3b82f6' },
    { name: 'Tikuv', value: 65, color: '#10b981' },
    { name: 'OTK', value: 30, color: '#f59e0b' },
    { name: 'Dazmol', value: 20, color: '#ec4899' },
];

const trendData = [
    { date: '01 Jan', qty: 1200 },
    { date: '02 Jan', qty: 1400 },
    { date: '03 Jan', qty: 1100 },
    { date: '04 Jan', qty: 1600 },
    { date: '05 Jan', qty: 1450 },
    { date: '06 Jan', qty: 1900 },
    { date: '07 Jan', qty: 1550 },
];

const Dashboard = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-[var(--bg-card)] rounded-3xl shadow-sm p-6 border border-[var(--border-color)] hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl text-white ${stat.color} shadow-lg shadow-opacity-20`}>
                                <stat.icon size={22} />
                            </div>
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-body)] px-2 py-1 rounded-lg uppercase">
                                {stat.trend}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-[var(--text-secondary)]">{stat.title}</p>
                        <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Production Trend Chart */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-3xl shadow-sm p-8 border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-[var(--text-primary)]">Ishlab Chiqarish Trendi</h3>
                            <p className="text-sm text-[var(--text-secondary)]">Oxirgi 7 kundagi kiyim tikish hajmi</p>
                        </div>
                        <button className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-3 py-1.5 rounded-xl hover:bg-indigo-500/20 transition-all">Batafsil</button>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                />
                                <Area type="monotone" dataKey="qty" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorQty)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Production Progress Bar Chart */}
                <div className="bg-[var(--bg-card)] rounded-3xl shadow-sm p-8 border border-[var(--border-color)]">
                    <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">Bo'limlar Holati</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-8">Navbatda turgan ish hajmi</p>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productionData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} width={80} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                                    {productionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Active Tasks & Recent History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--bg-card)] rounded-3xl shadow-sm p-8 border border-[var(--border-color)]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                            <Clock size={20} />
                        </div>
                        <h3 className="text-lg font-black text-[var(--text-primary)]">Hozirgi Vazifalar</h3>
                    </div>
                    <div className="space-y-4">
                        {[
                            { model: 'Hoodie Kids (A04)', step: 'Tikuvda', qty: 500, progress: 65, color: 'bg-emerald-500' },
                            { model: 'T-Shirt Classic', step: 'Pechatda', qty: 1200, progress: 30, color: 'bg-amber-500' },
                            { model: 'Sweatshirt Basic', step: 'Kesimda', qty: 800, progress: 90, color: 'bg-indigo-500' },
                        ].map((task, idx) => (
                            <div key={idx} className="p-4 bg-[var(--bg-body)] rounded-2xl border border-[var(--border-color)]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-[var(--text-primary)]">{task.model}</span>
                                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-md">{task.step}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
                                        <div className={`h-full ${task.color} rounded-full`} style={{ width: `${task.progress}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-[var(--text-secondary)]">{task.qty} dona</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] rounded-3xl shadow-xl p-8 text-[var(--text-primary)] relative overflow-hidden border border-[var(--border-color)]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <CircleCheck className="text-emerald-400" size={24} />
                        <h3 className="text-lg font-black">Tezkor Ma'lumot</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                                <Package size={20} className="text-indigo-300" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Mato zaxirasi yetarli</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">Ertangi kunlik reja uchun barcha matolar omborda mavjud.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                                <CircleAlert size={20} className="text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Aksessuar tanqisligi (Alert)</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">'Model-K' uchun tugmalar 2 kundan keyin keladi.</p>
                            </div>
                        </div>
                        <button className="w-full bg-indigo-600 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-500 transition-colors mt-4 text-white">
                            To'liq Hisobotni Ko'rish
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
