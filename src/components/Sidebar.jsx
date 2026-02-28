import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Scissors,
    Shirt,
    ClipboardList,
    Warehouse,
    CircleCheck,
    Package,
    Users,
    Banknote,
    FileText,
    Settings,
    Layers,
    Printer,
    ChevronDown,
    ChevronRight,
    X,
    Truck,
    LogOut,
    ShieldCheck
} from 'lucide-react';

export const menuItems = [
    { path: '/', name: 'Boshqaruv', icon: LayoutDashboard, roles: ['admin'] },
    { path: '/modelxona', name: 'Modelxona', icon: FileText, roles: ['admin', 'planning'], permKey: 'planning' }, // Modelxona often falls under planning or admin
    { path: '/reja', name: 'Planlama (BOM)', icon: ClipboardList, roles: ['admin', 'planning'], permKey: 'planning' },
    { path: '/hujjatlar', name: 'Xarakatlar (Fakt)', icon: FileText, roles: ['admin', 'planning', 'warehouse', 'cutting', 'sewing'], permKey: 'warehouse' },
    { path: '/taminot', name: 'Ta\'minot', icon: Truck, roles: ['admin', 'planning', 'supply'], permKey: 'supply' },
    { path: '/malumotlar', name: 'Ma\'lumotlar', icon: Settings, roles: ['admin'] },
    {
        path: '/ombor',
        name: 'Ombor',
        icon: Warehouse,
        roles: ['admin', 'planning', 'warehouse'],
        permKey: 'warehouse',
        subItems: [
            { path: '/ombor?tab=Mato', name: 'Mato Ombori' },
            { path: '/ombor?tab=Aksessuar', name: 'Aksessuar Ombori' },
            { path: '/ombor?tab=Tayyor Mahsulot', name: 'Tayyor Mahsulot Ombori' },
        ]
    },
    { path: '/kesim', name: 'Kesim', icon: Scissors, roles: ['admin', 'planning', 'cutting'], permKey: 'cutting' },
    { path: '/tasnif', name: 'Tasnif', icon: Layers, roles: ['admin', 'sorting'], permKey: 'sorting' },
    { path: '/pechat', name: 'Pechat & Naqsh', icon: Printer, roles: ['admin', 'printing'], permKey: 'printing' },
    { path: '/vishefka', name: 'Vishefka', icon: Scissors, roles: ['admin', 'printing'], permKey: 'printing' },
    { path: '/tikuv', name: 'Tikuv', icon: Shirt, roles: ['admin', 'sewing'], permKey: 'sewing' },
    { path: '/otk', name: 'OTK (Sifat)', icon: CircleCheck, roles: ['admin', 'otk'], permKey: 'otk' },
    { path: '/dazmol', name: 'Dazmol & Qadoq', icon: Package, roles: ['admin', 'ironing'], permKey: 'ironing' },
    { path: '/hr', name: 'HR (Kadrlar)', icon: Users, roles: ['admin', 'planning', 'director', 'hr_manager', 'tikuv', 'bichuv'], permKey: 'hr' }, // hr might need to be added to Xodimlar if missing
    { path: '/xodimlar', name: 'Xodimlar & Huquqlar', icon: ShieldCheck, roles: ['admin', 'planning'], permKey: 'admin' }, // Restricted usually
    { path: '/moliya', name: 'Moliya & Tannarx', icon: Banknote, roles: ['admin'], permKey: 'finance' },
];

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, logout } = useAuth();
    const [expandedMenu, setExpandedMenu] = useState('Ombor');
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const filteredMenu = menuItems.filter(item => {
        // console.log('DEBUG PERMS:', profile?.role, item.name, item.permKey, profile?.permissions);
        if (!profile) return false;
        if (profile.role === 'admin') return true;

        // Extract permission key: prefer explicit permKey, else fallback to path
        const permKey = item.permKey || item.path.split('?')[0].replace('/', '');

        // Special case for dashboard
        if (item.path === '/') return true;

        // Check granular permissions (any permission: 'read' or 'full')
        // Safe check for permissions object presence
        if (profile.permissions && profile.permissions[permKey]) return true;

        // Fallback to role-based access (for legacy standard roles)
        return item.roles?.includes(profile.role);
    });

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className={`fixed left-0 top-0 h-[100dvh] bg-[var(--bg-sidebar)] text-[var(--text-secondary)] flex flex-col shadow-xl z-[70] transition-all duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 border-r border-[var(--border-sidebar)]`}>
            <div className="p-6 border-b border-[var(--border-sidebar)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <Shirt className="text-white w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-black bg-[#fbbf24] text-[#0d4745] px-3 py-1 rounded-lg tracking-tighter">ZIOTTO</h1>
                </div>
                <button
                    onClick={onClose}
                    className="md:hidden p-2 hover:bg-gray-800 dark:hover:bg-white/5 rounded-lg text-gray-400"
                >
                    <X size={20} />
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700">
                <ul className="space-y-1 px-3">
                    {filteredMenu.map((item) => {
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isExpanded = expandedMenu === item.name;
                        const isActive = location.pathname === item.path;

                        // Dynamic class helpers
                        const activeClass = "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20";
                        const inactiveClass = "hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[var(--text-primary)]";

                        return (
                            <li key={item.path || item.name}>
                                {hasSubItems ? (
                                    <div className="space-y-1">
                                        <button
                                            onClick={() => setExpandedMenu(isExpanded ? null : item.name)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive || isExpanded ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : inactiveClass}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon size={18} className={isActive || isExpanded ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 group-hover:text-indigo-500'} />
                                                <span className="text-sm font-medium">{item.name}</span>
                                            </div>
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </button>
                                        {isExpanded && (
                                            <ul className="pl-9 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                                {item.subItems.map((sub) => (
                                                    <li key={sub.path}>
                                                        <NavLink
                                                            to={sub.path}
                                                            onClick={() => {
                                                                if (window.innerWidth < 768) onClose();
                                                            }}
                                                            className={({ isActive }) =>
                                                                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${location.search.includes(sub.path.split('?')[1]) && location.pathname === '/ombor'
                                                                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                                                                    : 'text-gray-500 hover:text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-white/5'
                                                                }`
                                                            }
                                                        >
                                                            <div className={`w-1 h-1 rounded-full ${location.search.includes(sub.path.split('?')[1]) && location.pathname === '/ombor' ? 'bg-indigo-500' : 'bg-gray-400'}`} />
                                                            {sub.name}
                                                        </NavLink>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ) : (
                                    <NavLink
                                        to={item.path}
                                        onClick={() => {
                                            if (window.innerWidth < 768) onClose();
                                        }}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                                ? activeClass
                                                : inactiveClass
                                            }`
                                        }
                                    >
                                        <item.icon size={18} className="transition-colors" />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </NavLink>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="p-4 border-t border-[var(--border-sidebar)] bg-[var(--bg-sidebar-footer)]">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 font-bold uppercase">
                            {profile?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate w-24">{profile?.full_name || 'Admin'}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{profile?.role || 'Direktor'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors text-gray-500"
                        title="Chiqish"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
