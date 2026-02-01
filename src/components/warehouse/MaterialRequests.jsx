import React, { useState } from 'react';
import { ClipboardList, ArrowUpRight, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MaterialRequests = ({ requests, onRefresh }) => {
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
            // Deduct from inventory
            // Note: In a real scenario, we might want to ensure concurrency safety.

            // Re-fetch item to check stock before deducting? 
            // For now trusting the user or database constraints (if any).

            // Only deduct if we actually want to automate it here.
            // Previous code did verify item exists.

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
        <div className="bg-[#161b22] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 uppercase tracking-[0.2em] text-[10px] font-black text-gray-500">
                            <th className="px-10 py-6 border-b border-white/5">Sana / ID</th>
                            <th className="px-10 py-6 border-b border-white/5">Buyurtma</th>
                            <th className="px-10 py-6 border-b border-white/5">Mato / Miqdor</th>
                            <th className="px-10 py-6 border-b border-white/5">Holat</th>
                            <th className="px-10 py-6 border-b border-white/5 text-right">Amal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {requests.map(req => (
                            <tr key={req.id} className="hover:bg-white/5 transition-all group">
                                <td className="px-10 py-6">
                                    <p className="text-sm font-black text-white">{new Date(req.created_at).toLocaleDateString()}</p>
                                    <p className="text-[10px] font-mono text-gray-600 uppercase">REQ-{req.id.slice(0, 5)}</p>
                                </td>
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-500">
                                            <ClipboardList size={20} />
                                        </div>
                                        <span className="text-sm font-black text-white uppercase">{req.order_id || '---'}</span>
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    <p className="text-sm font-black text-white uppercase">{req.inventory?.item_name}</p>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase">{req.requested_qty} {req.inventory?.unit} kerak</p>
                                </td>
                                <td className="px-10 py-6">
                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${req.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                                        req.status === 'Issued' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                                        }`}>
                                        {req.status === 'Pending' ? 'Kutilmoqda' : req.status === 'Issued' ? 'Berildi' : 'Qabul qilindi'}
                                    </span>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    {req.status === 'Pending' && (
                                        <button
                                            onClick={() => {
                                                setSelectedRequest(req);
                                                setIssueData({ issued_qty: req.requested_qty, notes: '' });
                                                setShowIssueModal(true);
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
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

            {/* Issue Modal */}
            {showIssueModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                    <div className="bg-[#161b22] border border-white/10 w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-4xl relative">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                <ArrowUpRight className="text-indigo-500" />
                                Mato Berish
                            </h3>
                            <button onClick={() => setShowIssueModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleIssueMaterial} className="p-10 space-y-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">So'ralgan miqdor: <span className="text-white text-lg ml-2">{selectedRequest?.requested_qty} {selectedRequest?.inventory?.unit}</span></p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Berilayotgan Haqiqiy Miqdor</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all font-black text-2xl"
                                    value={issueData.issued_qty}
                                    onChange={(e) => setIssueData({ ...issueData, issued_qty: e.target.value })}
                                />
                            </div>

                            <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-xs mt-4">
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
