import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import ZiyoChat from './components/ZiyoChat';
import { menuItems } from './components/Sidebar';

// Lazy loading route components for code splitting & fast initial load
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Modelxona = lazy(() => import('./pages/Modelxona'));
const Rejalashtirish = lazy(() => import('./pages/Rejalashtirish'));
const Ombor = lazy(() => import('./pages/Ombor'));
const Kesim = lazy(() => import('./pages/Kesim'));
const Taminot = lazy(() => import('./pages/Taminot'));
const Tasnif = lazy(() => import('./pages/Tasnif'));
const Tikuv = lazy(() => import('./pages/Tikuv'));
const OTK = lazy(() => import('./pages/OTK'));
const Dazmol = lazy(() => import('./pages/Dazmol'));
const HR = lazy(() => import('./pages/HR'));
const Moliya = lazy(() => import('./pages/Moliya'));
const Xodimlar = lazy(() => import('./pages/Xodimlar'));
const Ma_lumotlar = lazy(() => import('./pages/Ma_lumotlar'));
const Pechat = lazy(() => import('./pages/Pechat'));
const Vishefka = lazy(() => import('./pages/Vishefka'));
const Hujjatlar = lazy(() => import('./pages/Hujjatlar'));
const AttendanceScanner = lazy(() => import('./pages/AttendanceScanner'));
const Sozlamalar = lazy(() => import('./pages/Sozlamalar'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// New Role Based Guard
const RoleGuard = ({ children, path }) => {
  const { profile, tenant, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!profile) return <Navigate to="/login" />;

  // Find the menu item for this path
  const item = menuItems.find(i => i.path === path || (i.subItems && i.subItems.some(s => s.path.startsWith(path))));
  
  if (!item) {
    return children;
  }

  // --- TIER CHECK (Feature Gating) ---
  const requiredTiers = {
    '/reja': ['pro', 'ultra'],
    '/moliya': ['pro', 'ultra'],
    '/scanner': ['pro', 'ultra'],
  };

  if (requiredTiers[path] && tenant) {
    const currentTier = tenant.plan_tier || 'standart';
    if (!requiredTiers[path].includes(currentTier)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="bg-amber-500/10 p-6 rounded-full mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
          </div>
          <h2 className="text-3xl font-black text-[var(--text-primary)] mb-3">Premium Xizmat</h2>
          <p className="text-[var(--text-secondary)] max-w-md mb-8">
            Bu bo'lim faqat <b>{requiredTiers[path][0].toUpperCase()}</b> yoki undan yuqori tarifda ishlaydi. 
            Imkoniyatlarni kengaytirish uchun tarifingizni oshiring.
          </p>
          <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 py-3 rounded-2xl shadow-lg hover:shadow-amber-500/25 transition-all active:scale-95 uppercase tracking-wider text-sm flex items-center gap-2">
            Tarifni Oshirish
          </button>
        </div>
      );
    }
  }

  // --- ROLE CHECK ---
  if (profile.role === 'admin') return children;

  const permKey = item.permKey || item.path.split('?')[0].replace('/', '');

  if (profile.permissions && profile.permissions[permKey]) {
    return children;
  }

  if (item.roles && item.roles.includes(profile.role)) {
    return children;
  }

  return <div className="p-10 text-center text-red-500 font-bold">Huquqingiz yetmaydi (403 Access Denied)</div>;
};

function App() {
  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      tg.setHeaderColor('secondary_bg_color');
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ZiyoChat />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/attendance" element={<AttendanceScanner publicMode />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="modelxona" element={<RoleGuard path="/modelxona"><Modelxona /></RoleGuard>} />
                <Route path="reja" element={<RoleGuard path="/reja"><Rejalashtirish /></RoleGuard>} />
                <Route path="ombor" element={<Ombor />} />
                <Route path="kesim" element={<RoleGuard path="/kesim"><Kesim /></RoleGuard>} />
                <Route path="taminot" element={<RoleGuard path="/taminot"><Taminot /></RoleGuard>} />
                <Route path="tasnif" element={<RoleGuard path="/tasnif"><Tasnif /></RoleGuard>} />
                <Route path="tikuv" element={<RoleGuard path="/tikuv"><Tikuv /></RoleGuard>} />
                <Route path="otk" element={<RoleGuard path="/otk"><OTK /></RoleGuard>} />
                <Route path="dazmol" element={<RoleGuard path="/dazmol"><Dazmol /></RoleGuard>} />
                <Route path="hr" element={<RoleGuard path="/hr"><HR /></RoleGuard>} />
                <Route path="moliya" element={<RoleGuard path="/moliya"><Moliya /></RoleGuard>} />
                <Route path="xodimlar" element={<RoleGuard path="/xodimlar"><Xodimlar /></RoleGuard>} />
                <Route path="pechat" element={<RoleGuard path="/pechat"><Pechat /></RoleGuard>} />
                <Route path="vishefka" element={<RoleGuard path="/vishefka"><Vishefka /></RoleGuard>} />
                <Route path="malumotlar" element={<RoleGuard path="/malumotlar"><Ma_lumotlar /></RoleGuard>} />
                <Route path="hujjatlar" element={<RoleGuard path="/hujjatlar"><Hujjatlar /></RoleGuard>} />
                <Route path="scanner" element={<RoleGuard path="/scanner"><AttendanceScanner /></RoleGuard>} />
                <Route path="sozlamalar" element={<RoleGuard path="/sozlamalar"><Sozlamalar /></RoleGuard>} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


// Force redeploy - v1.3 (Telegram Mini App Integration Ready)
