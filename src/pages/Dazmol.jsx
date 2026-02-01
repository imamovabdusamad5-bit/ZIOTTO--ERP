import React from 'react';
import { Package, Truck, Users } from 'lucide-react';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Dazmol = () => {
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
            .eq('current_step', 'Dazmol')
            .eq('status', 'Pending');

        if (!error) setBundles(data || []);
        setLoading(false);
    };

    const handleFinish = async (bundle) => {
        if (!confirm(`${bundle.bundle_number} ni omborga topshirasizmi?`)) return;

        setLoading(true);

        // 1. Update Bundle Status
        const { error: bundleError } = await supabase
            .from('production_bundles')
            .update({
                current_step: 'Finished',
                status: 'Completed'
            })
            .eq('id', bundle.id);

        if (bundleError) {
            alert('Xatolik: ' + bundleError.message);
            setLoading(false);
            return;
        }

        // 2. Add to Inventory (Tayyor Mahsulot)
        const modelName = bundle.production_orders?.models?.name;
        // Check if exists
        const { data: existing, error: fetchError } = await supabase
            .from('inventory')
            .select('*')
            .eq('item_name', modelName)
            .eq('category', 'Tayyor Mahsulot')
            .eq('color', bundle.color)
            .maybeSingle(); // Use maybeSingle to avoid 406 if multiple (shouldn't happen if unique constraint matches logic, otherwise use list)

        if (existing) {
            await supabase.from('inventory').update({
                quantity: Number(existing.quantity) + Number(bundle.quantity),
                last_updated: new Date()
            }).eq('id', existing.id);
        } else {
            await supabase.from('inventory').insert([{
                item_name: modelName,
                category: 'Tayyor Mahsulot',
                quantity: Number(bundle.quantity),
                unit: 'dona',
                color: bundle.color,
                last_updated: new Date()
            }]);
        }

        // 3. Log
        await supabase.from('activity_logs').insert([{
            department: 'Dazmol',
            user_name: 'Dazmol/Qadoq',
            action: `${bundle.bundle_number} - Omborga topshirildi`,
            details: JSON.stringify(bundle)
        }]);

        fetchBundles();
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dazmol va Qadoqlash</h2>
                    <p className="text-gray-500">Juftliklar (Dazmolchi + Qadoqlovchi) ishi nazorati</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-gray-400">Yuklanmoqda...</div>
                ) : bundles.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Package className="mx-auto text-gray-300 mb-2" size={48} />
                        <p className="text-gray-500 font-medium">Qadoqlash uchun tayyor mahsulot yo'q</p>
                    </div>
                ) : bundles.map((team) => (
                    <div key={team.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Package size={100} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-bold mb-2 inline-block">Ishlanmoqda</span>
                                    <h3 className="text-lg font-bold text-gray-900">{team.production_orders?.models?.name}</h3>
                                    <p className="text-xs text-gray-400 font-mono">{team.bundle_number}</p>
                                </div>
                            </div>

                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Miqdor</p>
                                    <div className="flex items-center gap-2 font-bold text-gray-800 text-lg">
                                        <Users size={16} className="text-orange-500" />
                                        {team.quantity} dona
                                    </div>
                                </div>
                                <div className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Rang / O'lcham</p>
                                    <div className="flex items-center gap-2 font-bold text-gray-800">
                                        {team.color} | {team.size}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => handleFinish(team)}
                                    className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition font-bold text-sm shadow-lg shadow-gray-900/20"
                                >
                                    <Truck size={18} />
                                    Omborga Topshirish
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dazmol;
