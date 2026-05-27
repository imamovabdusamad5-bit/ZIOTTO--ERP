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
    ShieldCheck,
    QrCode
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
    { path: '/scanner', name: 'Skaner (QR)', icon: QrCode, roles: ['admin', 'hr_manager', 'gatekeeper'], permKey: 'hr' },
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
        if (!profile) return false;
        if (profile.role === 'admin') return true;
 
        const permKey = item.permKey || item.path.split('?')[0].replace('/', '');
 
        if (item.path === '/') return true;
 
        if (profile.permissions && profile.permissions[permKey]) return true;
 
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
                    <svg 
                        className="w-9 h-9 filter drop-shadow-[0_0_10px_rgba(0,198,255,0.7)] shrink-0 animate-pulse" 
                        viewBox="0 0 100 100" 
                        fill="none" 
                        width="36" 
                        height="36" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient id="pBlueMini" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#00f2fe" />
                                <stop offset="50%" stopColor="#00c6ff" />
                                <stop offset="100%" stopColor="#0062ff" />
                            </linearGradient>
                            <linearGradient id="pCyanMini" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#00f2fe" />
                                <stop offset="100%" stopColor="#0099ff" />
                            </linearGradient>
                            <linearGradient id="pDarkMini" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0a1d37" />
                                <stop offset="100%" stopColor="#020815" />
                            </linearGradient>
                            <linearGradient id="pBevelMini" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <g strokeLinejoin="round" strokeLinecap="round">
                            {/* Back Bezel/Dark Shadow Plate */}
                            <path d="M22 65 L22 35 L48 20 L78 37 L78 57 L48 74 Z" fill="url(#pDarkMini)" />
                            
                            {/* Outer Left Vertical Column */}
                            <path d="M22 35 L34 28 L34 78 L22 85 Z" fill="url(#pBlueMini)" />
                            
                            {/* Glossy Upper Ribbon Loop forming the curve of P */}
                            <path d="M34 28 L58 14 L82 28 L82 52 L58 66 L58 48 L70 41 L70 35 L58 28 L34 42 Z" fill="url(#pCyanMini)" />
                            
                            {/* Inner Volumetric Stem face */}
                            <path d="M46 42 L58 35 L58 85 L46 92 Z" fill="url(#pBlueMini)" />
                            
                            {/* Chrome Bevel Highlights */}
                            <path d="M34 42 L58 28 L58 35 L34 49 Z" fill="url(#pBevelMini)" opacity="0.55" />
                            <path d="M58 48 L70 41 L70 47 L58 54 Z" fill="url(#pBevelMini)" opacity="0.45" />
                            <path d="M58 66 L82 52 L82 58 L58 72 Z" fill="url(#pDarkMini)" opacity="0.6" />
                            <path d="M34 49 L58 35 L70 42 L70 54 L58 61 L34 75 Z" fill="url(#pCyanMini)" opacity="0.8" />

                            {/* Bright Edge Lines for Glossiness */}
                            <path d="M58 14 L82 28" stroke="#ffffff" strokeWidth="1.75" opacity="0.75" />
                            <path d="M34 28 L58 14" stroke="#ffffff" strokeWidth="1.75" opacity="0.85" />
                            <path d="M22 35 L34 28" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
                            <path d="M58 85 L46 92" stroke="#00f2fe" strokeWidth="1.75" opacity="0.9" />
                        </g>
                    </svg>
                    <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter flex items-center leading-none">
                        PRO<span className="bg-gradient-to-r from-[#00f2fe] to-[#0062ff] bg-clip-text text-transparent ml-0.5">ERP</span>
                    </h1>
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
