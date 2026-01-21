import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationsStore } from '../../store/useStore';
import {
  FiUsers,
  FiLayers,
  FiFileText,
  FiBell,
  FiMenu,
  FiX,
  FiHome,
  FiSettings,
  FiDatabase,
  FiPlus
} from 'react-icons/fi';

import NotificationsPanel from '../../components/NotificationsPanel';
import UsersTable from '../../Pages/Departmenthead/UsersTable';
import GroupsTable from '../../components/GroupsTable';
import ProjectReport from '../../components/ProjectReport';
import GroupsReport from '../../components/GroupsReport';

const DepartmentHeadDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationsStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'home' | 'users' | 'projects' | 'groups' | 'approvals' | 'settings'>('home');
  const [stats, setStats] = useState({
    students: 0,
    supervisors: 0,
    co_supervisors: 0,
    groups: 0,
    projects: 0,
    department_name: ''
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const [activeCardPanel, setActiveCardPanel] = useState<string | null>(null);
  const [showManagementContent, setShowManagementContent] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await (await import('../../services/api')).default.get('groups/department-stats/');
        console.log('[DepartmentHead] department-stats response', res.data);
        setStats(res.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  const dashboardCards = useMemo(() => [
    {
      title: 'المستخدمون',
      value: stats.students + stats.supervisors + stats.co_supervisors,
      icon: <FiUsers />,
      gradient: 'from-blue-500 to-blue-700',
      description: `طلاب: ${stats.students} | مشرفين: ${stats.supervisors + stats.co_supervisors}`
    },
    {
      title: 'المشاريع',
      value: stats.projects,
      icon: <FiLayers />,
      gradient: 'from-blue-500 to-blue-700',
      description: 'متابعة مشاريع التخرج في القسم'
    },
    {
      title: 'المجموعات',
      value: stats.groups,
      icon: <FiUsers />,
      gradient: 'from-blue-500 to-blue-700',
      description: 'إدارة مجموعات الطلاب'
    },
    {
      title: 'الموافقات',
      value: 0, // يمكن ربطه بـ stats.pending_approvals إذا توفر
      icon: <FiFileText />,
      gradient: 'from-blue-500 to-blue-700',
      description: 'طلبات إنشاء المجموعات المعلقة'
    }
  ], [stats]);
 

  const renderManagementContent = () => {
    if (!activeCardPanel || !showManagementContent) return null;
    switch (activeCardPanel) {
      case 'المستخدمون':
        return <UsersTable />;
      case 'المجموعات':
        return <GroupsTable />;
      case 'المشاريع':
        return <ProjectReport />;
      default:
        return null;
    }
  };

  const renderReport = () => {
    if (!activeReport) return null;
    switch (activeReport) {
      case 'projects': return <ProjectReport />;
      case 'groups': return <GroupsReport />;
      case 'users': return <div className="p-10 text-center text-slate-400">تقرير المستخدمين قيد التطوير</div>;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Sidebar Overlay */}
      <div className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 w-80 bg-[#0F172A] text-white z-[60] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center border-b border-slate-800">
          <span className="font-black text-xl">لوحة رئيس القسم</span>
          <button onClick={() => setIsSidebarOpen(false)}><FiX size={22} /></button>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { id: 'home', label: 'الرئيسية', icon: <FiHome /> },
            { id: 'users', label: 'المستخدمون', icon: <FiUsers /> },
            { id: 'projects', label: 'المشاريع', icon: <FiLayers /> },
            { id: 'groups', label: 'المجموعات', icon: <FiUsers /> },
            { id: 'approvals', label: 'الموافقات', icon: <FiFileText /> },
            { id: 'settings', label: 'الإعدادات', icon: <FiSettings /> },
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); setActiveCardPanel(null); setShowManagementContent(false); setActiveReport(null); }}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {item.icon} <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg"><FiMenu size={24} className="text-slate-600" /></button>
            <h2 className="text-xl font-bold text-slate-800">لوحة التحكم الرئيسية</h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-left ml-4 hidden md:block">
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">رئيس قسم {stats.department_name}</p>
             </div>
             <button onClick={() => setIsNotifPanelOpen(true)} className="relative p-2 hover:bg-slate-100 rounded-full">
                <FiBell size={22} className="text-slate-600" />
                {unreadCount > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{unreadCount}</span>}
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'home' && (
            <div className="p-6 space-y-6">
              {/* Welcome Banner */}
              <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-10 text-white overflow-hidden shadow-lg">
                <div className="relative z-10">
                  <h1 className="text-3xl font-black mb-3 flex items-center gap-2">
                    مرحباً بك مجدداً، رئيس القسم 👋
                  </h1>
                  <p className="text-blue-100 text-base max-w-2xl leading-relaxed">
                    إليك نظرة سريعة على حالة القسم اليوم. يمكنك إدارة الطلاب، المشرفين، والمجموعات من خلال البطاقات أدناه.
                  </p>
                </div>
                <div className="absolute top-[-20px] left-[-20px] w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              </div>

              {/* Stats Cards Grid - 4 Cards in a row as requested */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardCards.map((card, i) => (
                  <div key={i} onClick={() => { setActiveCardPanel(card.title); setShowManagementContent(false); setActiveReport(null); }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center mb-4 shadow-md`}>
                        {React.cloneElement(card.icon as React.ReactElement, { size: 24 })}
                      </div>
                      <p className="text-slate-400 text-xs font-medium mb-1">{card.title}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-50 text-blue-600 px-3 py-0.5 rounded-full text-[10px] font-bold">نظرة</span>
                        <h3 className="text-2xl font-black text-slate-900">{card.value}</h3>
                      </div>
                      <p className="text-slate-400 text-[10px]">{card.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Management Panel */}
              {activeCardPanel && (
                <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden mt-8">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-800">إدارة {activeCardPanel}</h3>
                    <button onClick={() => setActiveCardPanel(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><FiX size={20} className="text-slate-400" /></button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      <button onClick={() => setShowManagementContent(true)} className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-bold transition-all shadow-md">
                        إدارة {activeCardPanel}
                      </button>
                      <button onClick={() => { 
                        if (activeCardPanel === 'المجموعات') setActiveReport('groups'); 
                        else if (activeCardPanel === 'المشاريع') setActiveReport('projects');
                        else setActiveReport('users');
                      }}
                        className="flex items-center justify-center gap-3 bg-slate-600 hover:bg-slate-700 text-white p-5 rounded-2xl font-bold transition-all shadow-md">
                        التقارير
                      </button>
                    </div>
                    <div className="mt-6">{renderManagementContent()} {renderReport()}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other Tabs */}
          <div className="p-6">
            {activeTab === 'users' && <UsersTable />}
            {activeTab === 'projects' && <ProjectReport />}
            {activeTab === 'groups' && <GroupsTable />}
            {activeTab === 'approvals' && (
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-100">
                 <h2 className="text-xl font-black mb-6">الموافقات المعلقة</h2>
                 <p className="text-slate-400 text-center py-10">لا توجد طلبات معلقة حالياً</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-100">
                 <h2 className="text-xl font-black mb-6">إعدادات القسم</h2>
                 <p className="text-slate-400 text-center py-10">إعدادات القسم قيد التطوير</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <NotificationsPanel isOpen={isNotifPanelOpen} onClose={() => setIsNotifPanelOpen(false)} />
    </div>
  );
};

export default DepartmentHeadDashboard;
