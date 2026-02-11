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

import ZiyoChat from './components/ZiyoChat';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
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
              <Route path="modelxona" element={<Modelxona />} />
              <Route path="reja" element={<Rejalashtirish />} />
              <Route path="ombor" element={<Ombor />} />
              <Route path="kesim" element={<Kesim />} />
              <Route path="taminot" element={<Taminot />} />
              <Route path="tasnif" element={<Tasnif />} />
              <Route path="tikuv" element={<Tikuv />} />
              <Route path="otk" element={<OTK />} />
              <Route path="dazmol" element={<Dazmol />} />
              <Route path="hr" element={<HR />} />
              <Route path="moliya" element={<Moliya />} />
              <Route path="xodimlar" element={<Xodimlar />} />
              <Route path="pechat" element={<Pechat />} />
              <Route path="vishefka" element={<Vishefka />} />
              <Route path="malumotlar" element={<Ma_lumotlar />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

// Force redeploy - v1.2 (Fixed Lucide Import Crash)
