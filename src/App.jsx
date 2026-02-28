import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Modelxona from './pages/Modelxona';
import Rejalashtirish from './pages/Rejalashtirish';
import Ombor from './pages/Ombor';
import Kesim from './pages/Kesim';
import Taminot from './pages/Taminot';
import Tasnif from './pages/Tasnif';
import Tikuv from './pages/Tikuv';
import OTK from './pages/OTK';
import Dazmol from './pages/Dazmol';
import HR from './pages/HR';
import Moliya from './pages/Moliya';
import Xodimlar from './pages/Xodimlar';
import Ma_lumotlar from './pages/Ma_lumotlar';
import Pechat from './pages/Pechat';
import Vishefka from './pages/Vishefka';
import Hujjatlar from './pages/Hujjatlar';

import ZiyoChat from './components/ZiyoChat';

import { menuItems } from './components/Sidebar';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// New Role Based Guard
const RoleGuard = ({ children, path }) => {
  const { profile, loading } = useAuth();

  if (loading) return null;
  if (!profile) return <Navigate to="/login" />;

  // Admin always has access
  if (profile.role === 'admin') return children;

  // Find the menu item for this path
  // Handle sub-paths if necessary, but for now exact match or parent match
  const item = menuItems.find(i => i.path === path || (i.subItems && i.subItems.some(s => s.path.startsWith(path))));

  if (!item) {
    // If no rule defined, assume strictly protected or public?
    // For safety, if it's not in the menu, it might be public or hidden.
    // But we are using this guard explicitly.
    // Let's assume passed path IS the key.
    return children;
  }

  const permKey = item.permKey || item.path.split('?')[0].replace('/', '');

  // 1. Check Permissions Object
  if (profile.permissions && profile.permissions[permKey]) {
    return children;
  }

  // 2. Check Role List
  if (item.roles && item.roles.includes(profile.role)) {
    return children;
  }

  // If we got here, access is denied
  return <div className="p-10 text-center text-red-500 font-bold">Huquqingiz yetmaydi (403 Access Denied)</div>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ZiyoChat />
          <Routes>
            <Route path="/login" element={<Login />} />
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
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

// Force redeploy - v1.2 (Fixed Lucide Import Crash)
