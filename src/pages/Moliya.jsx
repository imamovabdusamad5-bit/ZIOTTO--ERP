import React from 'react';
import { Banknote, DollarSign, Wallet, Send } from 'lucide-react';

const Moliya = () => {
    const payroll = [
        { id: 1, name: 'Usmonova Yulduz', type: 'Ishbay', completed: 1240, rate: '1,500', total: '1,860,000', status: 'To\'lanmagan' },
        { id: 2, name: 'Dazmolchi A.Valiyev', type: 'Ishbay', completed: 450, rate: '800', total: '360,000', status: 'To\'landi' },
        { id: 3, name: 'Qorovul Eshmat', type: 'Oylik', completed: '-', rate: '-', total: '2,500,000', status: 'Avans Berildi' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Moliya Bo'limi</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Oylik maosh hisob-kitobi va to'lovlar</p>
                </div>
                <button className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 font-black uppercase tracking-widest text-[10px]">
                    <Send size={18} />
                    Telegramga Hisobot Yuborish
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl text-white shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <h3 className="font-semibold text-white/90">Jami Hisoblangan</h3>
                    </div>
                    <p className="text-3xl font-bold">185,400,000 so'm</p>
                    <p className="text-sm text-green-100 mt-1">Shu oy uchun</p>
                </div>

                <div className="bg-[#161b22] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl">
                                <Wallet size={24} />
                            </div>
                            <h3 className="font-black text-gray-500 uppercase tracking-widest text-[10px]">To'lanishi Kerak</h3>
                        </div>
                        <p className="text-3xl font-black text-white">42,500,000 <span className="text-sm font-bold text-gray-500">so'm</span></p>
                        <p className="text-[10px] font-bold text-orange-500/50 uppercase tracking-widest mt-2">Qolgan qarzdorlik</p>
                    </div>
                </div>

                <div className="bg-[#161b22] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl">
                                <Banknote size={24} />
                            </div>
                            <h3 className="font-black text-gray-500 uppercase tracking-widest text-[10px]">O'rtacha Maosh</h3>
                        </div>
                        <p className="text-3xl font-black text-white">3,200,000 <span className="text-sm font-bold text-gray-500">so'm</span></p>
                        <p className="text-[10px] font-bold text-purple-500/50 uppercase tracking-widest mt-2">Bir xodimga</p>
                    </div>
                </div>
            </div>

            <div className="bg-[#161b22] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
                <div className="px-10 py-6 border-b border-white/5 bg-white/2">
                    <h3 className="font-black text-white uppercase tracking-widest text-xs">Maosh Jadvali (Yanvar 2026)</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-white/2">
                        <tr>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Xodim</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Turi</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Bajarilgan Ish</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Narx (so'm)</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Jami Hisob</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Holat</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Amal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {payroll.map((pay) => (
                            <tr key={pay.id} className="hover:bg-white/5 transition-all group">
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 font-black text-xs">
                                            {pay.name.charAt(0)}
                                        </div>
                                        <span className="font-black text-white">{pay.name}</span>
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    <span className="bg-white/5 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">
                                        {pay.type}
                                    </span>
                                </td>
                                <td className="px-10 py-6 text-gray-400 font-bold">{pay.completed} {pay.type === 'Ishbay' ? 'dona' : ''}</td>
                                <td className="px-10 py-6 text-gray-500 font-mono">{pay.rate}</td>
                                <td className="px-10 py-6 font-black text-white">{pay.total}</td>
                                <td className="px-10 py-6">
                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${pay.status === 'To\'landi' ? 'bg-emerald-500/10 text-emerald-500' :
                                        pay.status === 'Avans Berildi' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                                        }`}>
                                        {pay.status}
                                    </span>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <button className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                        To'lash
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Moliya;
