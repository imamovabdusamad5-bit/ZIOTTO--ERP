import React from 'react';

const OmborTarix = ({ logs }) => {
    return (
        <div className="bg-[#0f172a]/60 backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">

            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#020617]/50 border-b border-white/5">
                            <th className="px-8 py-6">Vaqt / Operatsiya</th>
                            <th className="px-8 py-6">Mato / Material.</th>
                            <th className="px-8 py-6">Rangi</th>
                            <th className="px-8 py-6 text-center">Miqdor</th>
                            <th className="px-8 py-6">Izoh / Sabab</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-slate-300">{new Date(log.created_at).toLocaleString()}</span>
                                        <span className={`text-[10px] font-black uppercase mt-1 ${log.type === 'In' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {log.type === 'In' ? '↑ Kirim' : '↓ Chiqim'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="font-black text-white uppercase tracking-tight">{log.inventory?.item_name || 'Noma\'lum'}</div>
                                    <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{log.inventory?.category}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="px-2 py-1 bg-white/5 text-slate-400 rounded-lg text-[10px] font-black uppercase border border-white/5">{log.inventory?.color || '---'}</span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className={`text-lg font-black ${log.type === 'In' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {log.type === 'In' ? '+' : '-'}{log.quantity}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-xs font-medium text-slate-500 max-w-xs">{log.reason || '---'}</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden divide-y divide-white/5">
                {logs.map(log => (
                    <div key={log.id} className="p-6 space-y-3 bg-[#0f172a]/60 backdrop-blur-xl rounded-[2rem] border border-white/5 mb-4 shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-black text-white uppercase text-sm">{log.inventory?.item_name || '---'}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-bold text-indigo-400 uppercase px-2 py-0.5 bg-indigo-500/10 rounded-lg border border-indigo-500/10">{log.inventory?.color}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${log.type === 'In' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {log.type === 'In' ? 'Kirim' : 'Chiqim'}
                                </span>
                                <div className={`mt-1 font-black text-lg ${log.type === 'In' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {log.type === 'In' ? '+' : '-'}{log.quantity}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] pt-2 border-t border-white/5">
                            <span className="text-slate-500 font-bold">{new Date(log.created_at).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                            <span className="text-slate-400 italic font-medium">{log.reason}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OmborTarix;
