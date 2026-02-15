
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import Home from './views/Home';
import Consultation from './views/Consultation';
import AdminLogin from './views/AdminLogin';
import AdminDashboard from './views/AdminDashboard';
import TreatmentList from './views/admin/TreatmentList';
import SystemSettings from './views/admin/SystemSettings';
import { Package, User as UserIcon, LayoutDashboard, LogOut, ChevronLeft, Settings } from 'lucide-react';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">載入中...</div>;
  if (!user) return <Navigate to="/admin/login" />;

  return <>{children}</>;
};

const AdminLayout = ({ children }: { children?: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItemClass = (path: string) => `
    flex items-center gap-3 p-3 rounded-lg transition-colors
    ${isActive(path) ? 'bg-[#F8E8FF] gold-text font-bold shadow-sm' : 'hover:bg-gray-50 text-gray-600'}
  `;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col fixed h-full">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#E0B0FF] flex items-center justify-center text-white font-bold">R</div>
          <h1 className="text-xl font-bold gold-text">亮立美學後台</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin" className={navItemClass('/admin')}>
            <LayoutDashboard size={20} /> 控制面板
          </Link>
          <Link to="/admin/treatments" className={navItemClass('/admin/treatments')}>
            <Package size={20} /> 療程管理
          </Link>
          <Link to="/admin/settings" className={navItemClass('/admin/settings')}>
            <Settings size={20} /> 系統設定
          </Link>
        </nav>
        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 w-full text-left rounded-lg text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} /> 登出系統
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 前台路由 */}
        <Route path="/" element={<Home />} />
        <Route path="/consultation" element={<Consultation />} />
        
        {/* 後台路由 */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout><AdminDashboard /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/treatments" element={
          <ProtectedRoute>
            <AdminLayout><TreatmentList /></AdminLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute>
            <AdminLayout><SystemSettings /></AdminLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}
