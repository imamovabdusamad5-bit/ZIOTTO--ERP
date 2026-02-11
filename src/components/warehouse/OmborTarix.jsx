import React from 'react';

const OmborTarix = ({ logs, viewMode }) => {
    return (
        <div className="animate-in fade-in duration-500">
            {viewMode === 'table' ? (
                // TABLE VIEW
                <div className="bg-[var(--bg-card)] backdrop-blur-3xl rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest bg-[var(--bg-sidebar-footer)] border-b border-[var(--border-color)]">
                                    <th className="px-8 py-6 border-r border-[var(--border-color)]">Vaqt / Operatsiya</th>
                                    <th className="px-8 py-6 border-r border-[var(--border-color)]">Mato / Material.</th>
                                    <th className="px-8 py-6 border-r border-[var(--border-color)]">Rangi</th>
                                    <th className="px-8 py-6 text-center border-r border-[var(--border-color)]">Miqdor</th>
                                    <th className="px-8 py-6">Izoh / Sabab</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-[var(--bg-card-hover)] transition-colors group even:bg-[var(--bg-body)]">
                                        <td className="px-8 py-6 border-r border-[var(--border-color)]">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{new Date(log.created_at).toLocaleString()}</span>
                                                <span className={`text-[10px] font-black uppercase mt-1 ${log.type === 'In' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {log.type === 'In' ? '↑ Kirim' : '↓ Chiqim'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 border-r border-[var(--border-color)]">
                                            <div className="font-black text-[var(--text-primary)] uppercase tracking-tight">{log.inventory?.item_name || 'Noma\'lum'}</div>
                                            <div className="text-[9px] text-[var(--text-secondary)] font-bold uppercase mt-0.5">{log.inventory?.category}</div>
                                        </td>
                                        <td className="px-8 py-6 border-r border-[var(--border-color)]">
                                            <span className="px-2 py-1 bg-[var(--bg-body)] text-[var(--text-secondary)] rounded-lg text-[10px] font-black uppercase border border-[var(--border-color)]">{log.inventory?.color || '---'}</span>
                                        </td>
                                        <td className="px-8 py-6 text-center border-r border-[var(--border-color)]">
                                            <span className={`text-lg font-black ${log.type === 'In' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {log.type === 'In' ? '+' : '-'}{log.quantity}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-medium text-[var(--text-secondary)] max-w-xs">{log.reason || '---'}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                // CARD VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {logs.map(log => (
                        <div key={log.id} className="p-6 space-y-3 bg-[var(--bg-card)] backdrop-blur-xl rounded-[2rem] border border-[var(--border-color)] shadow-lg hover:shadow-2xl hover:border-indigo-500/20 transition-all group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-black text-[var(--text-primary)] uppercase text-sm tracking-tight">{log.inventory?.item_name || '---'}</div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[9px] font-bold text-indigo-400 uppercase px-2 py-0.5 bg-indigo-500/10 rounded-lg border border-indigo-500/10">{log.inventory?.color}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${log.type === 'In' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border border-rose-500/10'}`}>
                                        {log.type === 'In' ? 'Kirim' : 'Chiqim'}
                                    </span>
                                    <div className={`mt-1 font-black text-2xl ${log.type === 'In' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {log.type === 'In' ? '+' : '-'}{log.quantity}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-[10px] pt-3 border-t border-[var(--border-color)]">
                                <span className="text-[var(--text-secondary)] font-bold">{new Date(log.created_at).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                                <span className="text-[var(--text-secondary)] italic font-medium truncate max-w-[150px]">{log.reason}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OmborTarix;
