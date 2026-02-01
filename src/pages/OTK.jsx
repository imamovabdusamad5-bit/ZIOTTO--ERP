import React, { useState, useEffect } from 'react';
import { CheckCircle, XOctagon, RefreshCcw, User } from 'lucide-react';


import { supabase } from '../lib/supabase';

const OTK = () => {
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBundles();
    }, []);

    const fetchBundles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('production_bundles')
            .select('*, production_orders(models(name))')
            .eq('current_step', 'OTK')
            .eq('status', 'Pending'); // Show pending inspections

        if (!error) setBundles(data || []);
        setLoading(false);
    };

    const handleAction = async (bundle, passed) => {
        setLoading(true);
        const nextStep = passed ? 'Dazmol' : 'Tikuv'; // Return to Tikuv if failed
        const nextStatus = passed ? 'Pending' : 'Defect'; // Pending for Dazmol, or Defect flag

        const { error } = await supabase
            .from('production_bundles')
            .update({
                current_step: nextStep,
                status: nextStatus
            })
            .eq('id', bundle.id);

        if (!error) {
            await supabase.from('activity_logs').insert([{
                department: 'OTK',
                user_name: 'OTK Nazoratchi',
                action: `${bundle.bundle_number} - ${passed ? 'Qabul qilindi (Dazmolga)' : 'Qaytarildi (Brak)'}`,
                details: JSON.stringify(bundle)
            }]);
            fetchBundles();
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">OTK (Sifat Nazorati)</h2>
                    <p className="text-gray-500">Tayyor mahsulotni tekshirish va nuqsonlarni qaytarish</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <CheckCircle size={20} />
                        </div>
                        <h3 className="font-semibold text-gray-700">Qabul Qilindi</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">--</p>
                    <p className="text-sm text-gray-500">Bugungi sifatli mahsulot</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <XOctagon size={20} />
                        </div>
                        <h3 className="font-semibold text-gray-700">Nuqson (Brak)</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">--</p>
                    <p className="text-sm text-gray-500">Ta'mirga qaytarilgan</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <RefreshCcw size={20} />
                        </div>
                        <h3 className="font-semibold text-gray-700">Sifat Foizi</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">--%</p>
                    <p className="text-sm text-gray-500">Umumiy ko'rsatkich</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Tekshiruv Jarayoni</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-gray-600">Model & Partiya</th>
                                <th className="px-6 py-3 font-semibold text-gray-600">Miqdor/Rang</th>
                                <th className="px-6 py-3 font-semibold text-gray-600">Holat</th>
                                <th className="px-6 py-3 font-semibold text-gray-600 text-right">Harakat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bundles.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">Tekshirish uchun mahsulot yo'q</td></tr>
                            ) : bundles.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{item.production_orders?.models?.name}</p>
                                        <p className="text-xs text-gray-500">{item.bundle_number}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-800">{item.quantity} dona</p>
                                        <p className="text-xs text-gray-500">{item.color} | {item.size}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                            Kutilmoqda
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleAction(item, false)}
                                            className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs font-bold"
                                        >
                                            Qaytarish
                                        </button>
                                        <button
                                            onClick={() => handleAction(item, true)}
                                            className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-xs font-bold"
                                        >
                                            Qabul Qilish
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OTK;
