import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore, useApprovalsStore } from '../../store/useStore';
import {
  FiCheckSquare,
  FiUsers,
  FiFileText,
  FiMenu,
  FiX,
  FiBell,
  FiHome,
  FiSettings,
  FiDatabase,
  FiChevronLeft,
  FiLayers,
  FiActivity
} from 'react-icons/fi';
import Layout from '../../components/Layout';
import UsersTable from '../../components/UsersTable';
import ProjectsTable from '../../components/ProjectTable';
import GroupsTable from '../../components/GroupsTable';
import UsersReport from '../../components/UsersReport';
import ProjectReport from '../../components/ProjectReport';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import { groupService } from '../../services/groupService';

const DepartmentHeadDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { pendingApprovals } = useApprovalsStore();
  const [activeTab, setActiveTab] = useState<'home' | 'approvals' | 'reports' | 'students' | 'projects' | 'groups'>('home');

  // Layout and management states (mirrors System Manager)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const [activeCardPanel, setActiveCardPanel] = useState<string | null>(null);
  const [showManagementContent, setShowManagementContent] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);

  // Data lists for dashboard counts and management
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [u, p, g] = await Promise.all([
          userService.getAllUsers(),
          projectService.getProject(),
          groupService.getGroups(),
        ]);
        setUsers(Array.isArray(u) ? u : []);
        setProjects(Array.isArray(p) ? p : []);
        setGroups(Array.isArray(g) ? g : []);
      } catch (err) {
        console.error('DepartmentHeadDashboard fetch error', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans system-manager-theme" dir="rtl">
      {/* Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar (simplified) */}
      <aside className={`fixed inset-y-0 right-0 w-72 bg-[#0F172A] text-white z-[60] transition-transform duration-300 ease-out shadow-2xl ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 flex items-center justify-between border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FiActivity size={22} className="text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">رئيس القسم</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><FiX size={20} /></button>
        </div>

        <nav className="p-4 mt-4 space-y-1">
          {[
            { id: 'home', label: 'الرئيسية', icon: <FiHome /> },
            { id: 'students', label: 'الطلاب', icon: <FiUsers /> },
            { id: 'projects', label: 'المشاريع', icon: <FiLayers /> },
            { id: 'groups', label: 'المجموعات', icon: <FiUsers /> },
            { id: 'approvals', label: 'الموافقات', icon: <FiFileText /> },
            { id: 'settings', label: 'الإعدادات', icon: <FiSettings /> }
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <span className={`${activeTab === tab.id ? 'text-white' : 'group-hover:text-white'}`}>{tab.icon}</span>
              <span className="font-bold text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-8 left-0 right-0 px-6">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">المسؤول الحالي</p>
            <p className="text-sm font-bold text-white">{user?.name}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200"><FiMenu size={20} /></button>
            <h2 className="text-xl font-black text-slate-800">لوحة رئيس القسم</h2>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsNotifPanelOpen(true)} className="relative p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200"><FiBell size={20} />{pendingApprovals.length > 0 && <span className="absolute top-2 right-2 w-4 h-4 badge-blue text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">{pendingApprovals.length}</span>}</button>
            <div className="flex items-center gap-3">
              <button className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200"><FiSettings size={18} /></button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
          {/* Header summary and cards - reuse existing inner content */}
          <div>
            <h1 className="text-3xl font-bold">مرحباً، أ.د {user?.name}</h1>
            <p className="text-sm text-slate-400 mt-1">صلاحيات كاملة لإدارة الطلاب، المشاريع، وإنشاء المجموعات</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[{ id: 'users', title: 'المستخدمون', value: users.length, icon: <FiUsers />, gradient: 'from-indigo-500 to-indigo-600' }, { id: 'projects', title: 'المشاريع', value: projects.length, icon: <FiLayers />, gradient: 'from-amber-400 to-amber-500' }, { id: 'groups', title: 'المجموعات', value: groups.length, icon: <FiUsers />, gradient: 'from-purple-500 to-purple-600' }, { id: 'approvals', title: 'الموافقات', value: pendingApprovals.length, icon: <FiFileText />, gradient: 'from-yellow-400 to-yellow-500' }].map((card) => (
              <div key={card.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl cursor-pointer" onClick={() => { setActiveCardPanel(card.id); setShowManagementContent(true); setActiveTab(card.id === 'approvals' ? 'approvals' : card.id === 'users' ? 'students' : card.id === 'projects' ? 'projects' : 'groups'); }}>
                <div className="flex gap-4 items-center">
                  <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center bg-gradient-to-br ${card.gradient}`}>{card.icon}</div>
                  <div className="flex-1 text-right">
                    <p className="text-xs text-slate-400">{card.title}</p>
                    <h3 className="text-xl font-black">{card.value}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Existing tabs area (keeps functionality) */}
          <div className="mt-6">
            {/* reuse previously rendered tab content */}
            <div className="border-b border-gray-200 flex gap-8 overflow-auto">
              <button onClick={() => setActiveTab('home')} className={`pb-4 font-semibold border-b-2 border-transparent text-center min-w-[120px] flex-shrink-0 ${activeTab === 'home' ? 'text-blue-600 border-blue-600' : 'text-gray-600'}`}>الرئيسية</button>
              <button onClick={() => setActiveTab('approvals')} className={`pb-4 font-semibold border-b-2 border-transparent text-center min-w-[120px] flex-shrink-0 ${activeTab === 'approvals' ? 'text-blue-600 border-blue-600' : 'text-gray-600'}`}>الموافقات</button>
              <button onClick={() => setActiveTab('students')} className={`pb-4 font-semibold border-b-2 border-transparent text-center min-w-[140px] flex-shrink-0 ${activeTab === 'students' ? 'text-blue-600 border-blue-600' : 'text-gray-600'}`}>إدارة الطلاب</button>
              <button onClick={() => setActiveTab('projects')} className={`pb-4 font-semibold border-b-2 border-transparent text-center min-w-[140px] flex-shrink-0 ${activeTab === 'projects' ? 'text-blue-600 border-blue-600' : 'text-gray-600'}`}>إدارة المشاريع</button>
              <button onClick={() => setActiveTab('groups')} className={`pb-4 font-semibold border-b-2 border-transparent text-center min-w-[140px] flex-shrink-0 ${activeTab === 'groups' ? 'text-blue-600 border-blue-600' : 'text-gray-600'}`}>إنشاء المجموعات</button>
              <button onClick={() => setActiveTab('reports')} className={`pb-4 font-semibold border-b-2 border-transparent text-center min-w-[120px] flex-shrink-0 ${activeTab === 'reports' ? 'text-blue-600 border-blue-600' : 'text-gray-600'}`}>التقارير</button>
            </div>

            <div className="mt-6">
              {activeTab === 'approvals' && (
                <div className="space-y-4">
                  {pendingApprovals.length > 0 ? (
                    pendingApprovals.map((approval) => (
                      <div key={approval.approval_id} className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                        <p className="font-bold text-gray-900">{approval.approval_type}</p>
                        <p className="text-sm text-gray-600 mt-1">من: {approval.requested_by.name}</p>
                        <div className="flex gap-2 mt-4">
                          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">موافقة</button>
                          <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">رفض</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-600 py-8">لا توجد موافقات معلقة</p>
                  )}
                </div>
              )}

              {activeTab === 'students' && (
                <div className="mt-6 bg-white p-4 rounded-2xl shadow-sm"><UsersTable initialRole="Student" /></div>
              )}

              {activeTab === 'projects' && (
                <div className="mt-6 bg-white p-4 rounded-2xl shadow-sm"><ProjectsTable /></div>
              )}

              {activeTab === 'groups' && (
                <div className="mt-6 bg-white p-4 rounded-2xl shadow-sm"><GroupsTable /></div>
              )}

              {activeTab === 'reports' && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-2xl shadow-sm"><UsersReport onlyRole="Student" /></div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm"><ProjectReport departmentId={user?.department_id ?? null} /></div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DepartmentHeadDashboard;
