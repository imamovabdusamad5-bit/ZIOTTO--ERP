import React, { useState } from 'react';
import { ClipboardList, ArrowUpRight, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MaterialRequests = ({ requests, onRefresh, viewMode }) => {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [issueData, setIssueData] = useState({ issued_qty: '', notes: '' });
    const [loading, setLoading] = useState(false);

    const handleIssueMaterial = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('material_requests')
            .update({
                status: 'Issued',
                issued_qty: Number(issueData.issued_qty),
                issued_at: new Date()
            })
            .eq('id', selectedRequest.id);

        if (!error) {
            const { data: item } = await supabase.from('inventory').select('quantity').eq('id', selectedRequest.inventory_id).single();
            if (item) {
                await supabase.from('inventory').update({
                    quantity: Number(item.quantity) - Number(issueData.issued_qty),
                    last_updated: new Date()
                }).eq('id', selectedRequest.inventory_id);

                await supabase.from('inventory_logs').insert([{
                    inventory_id: selectedRequest.inventory_id,
                    type: 'Out',
                    quantity: Number(issueData.issued_qty),
                    reason: `Kesim so'rovi bo'yicha (REQ-${selectedRequest.id})`
                }]);
            }

            alert('Mato muvaffaqiyatli berildi!');
            setShowIssueModal(false);
            onRefresh();
        } else {
            alert('Xatolik: ' + error.message);
        }
        setLoading(false);
    };

    return (
        <div className="animate-in fade-in duration-500">
            {viewMode === 'table' ? (
                // TABLE VIEW
                <div className="bg-[var(--bg-card)] backdrop-blur-3xl rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--bg-sidebar-footer)] uppercase tracking-[0.2em] text-[10px] font-black text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                                    <th className="px-6 py-4 border-r border-[var(--border-color)]">Sana / ID</th>
                                    <th className="px-6 py-4 border-r border-[var(--border-color)]">Buyurtma</th>
                                    <th className="px-6 py-4 border-r border-[var(--border-color)]">Mato / Miqdor</th>
                                    <th className="px-6 py-4 border-r border-[var(--border-color)]">Holat</th>
                                    <th className="px-6 py-4 text-right">Amal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {requests.map(req => (
                                    <tr key={req.id} className="hover:bg-[var(--bg-card-hover)] transition-all group even:bg-[var(--bg-body)]">
                                        <td className="px-6 py-4 border-r border-[var(--border-color)]">
                                            <p className="text-sm font-black text-[var(--text-primary)]">{new Date(req.created_at).toLocaleDateString()}</p>
                                            <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase mt-1">REQ-{req.id.slice(0, 5)}</p>
                                        </td>
                                        <td className="px-6 py-4 border-r border-[var(--border-color)]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                                    <ClipboardList size={16} />
                                                </div>
                                                <span className="text-sm font-black text-[var(--text-primary)] uppercase">{req.order_id || '---'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-[var(--border-color)]">
                                            <p className="text-sm font-black text-[var(--text-primary)] uppercase">{req.inventory?.item_name}</p>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase mt-1">{req.requested_qty} {req.inventory?.unit} kerak</p>
                                        </td>
                                        <td className="px-6 py-4 border-r border-[var(--border-color)]">
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${req.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                req.status === 'Issued' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                }`}>
                                                {req.status === 'Pending' ? 'Kutilmoqda' : req.status === 'Issued' ? 'Berildi' : 'Qabul qilindi'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'Pending' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setIssueData({ issued_qty: req.requested_qty, notes: '' });
                                                        setShowIssueModal(true);
                                                    }}
                                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg shadow-indigo-600/20 active:scale-95 transition-all border border-indigo-400/20"
                                                >
                                                    Mato Berish
                                                </button>
                                            )}
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
                    {requests.map(req => (
                        <div key={req.id} className="bg-[var(--bg-card)] backdrop-blur-3xl p-0 rounded-[2.5rem] overflow-hidden border border-[var(--border-color)] hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-900/10 transition-all group flex flex-col">
                            <div className="bg-[var(--bg-body)] p-6 border-b border-[var(--border-color)] flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`w-2 h-2 rounded-full ${req.status === 'Pending' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : req.status === 'Issued' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></span>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${req.status === 'Pending' ? 'text-amber-500' : req.status === 'Issued' ? 'text-blue-500' : 'text-emerald-500'}`}>
                                            {req.status === 'Pending' ? 'Kutilmoqda' : req.status === 'Issued' ? 'Berildi' : 'Qabul qilindi'}
                                        </p>
                                    </div>
                                    <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight leading-none">{req.inventory?.item_name}</h3>
                                    <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-1">ID: REQ-{req.id.slice(0, 5)}</p>
                                </div>
                                <div className="p-3 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] text-[var(--text-secondary)]">
                                    <ClipboardList size={20} />
                                </div>
                            </div>

                            <div className="p-6 space-y-4 flex-1">
                                <div className="flex items-center justifying-between gap-4">
                                    <div className="flex-1 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">So'ralgan</p>
                                        <p className="text-xl font-black text-[var(--text-primary)]">{req.requested_qty} <span className="text-xs text-[var(--text-secondary)]">{req.inventory?.unit}</span></p>
                                    </div>
                                    <div className="flex-1 p-4 bg-[var(--bg-body)] rounded-2xl border border-[var(--border-color)]">
                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Sana</p>
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {req.status === 'Issued' && (
                                    <div className="p-3 bg-[var(--bg-body)] rounded-xl border border-[var(--border-color)] text-center">
                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Berilgan: {req.issued_qty} {req.inventory?.unit}</p>
                                    </div>
                                )}
                            </div>

                            {req.status === 'Pending' && (
                                <div className="p-4 pt-0 mt-auto">
                                    <button
                                        onClick={() => {
                                            setSelectedRequest(req);
                                            setIssueData({ issued_qty: req.requested_qty, notes: '' });
                                            setShowIssueModal(true);
                                        }}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <ArrowUpRight size={16} /> Mato Berish
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Issue Modal */}
            {showIssueModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl relative shadow-indigo-900/40 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="p-10 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card)] sticky top-0 z-10">
                            <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                                <ArrowUpRight className="text-indigo-500" />
                                <span className="bg-gradient-to-r from-[var(--text-primary)] via-indigo-200 to-slate-400 bg-clip-text text-transparent">Mato Berish</span>
                            </h3>
                            <button onClick={() => setShowIssueModal(false)} className="text-[var(--text-secondary)] hover:text-white transition-colors bg-[var(--bg-body)] p-3 rounded-2xl hover:bg-rose-500/20 hover:text-rose-500 border border-[var(--border-color)]">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleIssueMaterial} className="p-10 space-y-6">
                            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center bg-[var(--bg-body)] py-4 rounded-xl border border-[var(--border-color)]">So'ralgan miqdor: <span className="text-[var(--text-primary)] text-lg ml-2 font-black">{selectedRequest?.requested_qty} {selectedRequest?.inventory?.unit}</span></p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest ml-1">Berilayotgan Haqiqiy Miqdor</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-5 text-[var(--text-primary)] outline-none focus:border-indigo-500 focus:bg-[var(--input-focus-bg)] transition-all font-black text-3xl shadow-inner text-center"
                                    value={issueData.issued_qty}
                                    onChange={(e) => setIssueData({ ...issueData, issued_qty: e.target.value })}
                                />
                            </div>

                            <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[2rem] transition-all shadow-xl shadow-indigo-600/30 uppercase tracking-widest text-xs mt-6 active:scale-95">
                                {loading ? 'Berilmoqda...' : 'Matoni Berish (Chiqim)'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialRequests;
