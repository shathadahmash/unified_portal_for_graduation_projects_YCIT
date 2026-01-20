import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationsStore } from '../../store/useStore';
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
  FiChevronLeft,
  FiPieChart,
  FiActivity
} from 'react-icons/fi';

import { userService } from '../../services/userService';
import { roleService } from '../../services/roleService';
import { projectService } from '../../services/projectService';
import { groupService } from '../../services/groupService';

import NotificationsPanel from '../../components/NotificationsPanel';
import UsersTable from '../../components/UsersTable';
import RolesTable from '../../components/RolesTable';
import GroupsTable from '../../components/GroupsTable';
import UsersReport from '../../components/UsersReport';
import ProjectReport from '../../components/ProjectReport';
import GroupsReport from '../../components/GroupsReport';
import ProjectsTable from '../../components/ProjectTable';

const SystemManagerDashboard: React.FC = () => {
  const { unreadCount } = useNotificationsStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'home' | 'users' | 'projects' | 'groups' | 'approvals' | 'settings'
  >('home');

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);

  const [activeCardPanel, setActiveCardPanel] = useState<string | null>(null);
  const [showManagementContent, setShowManagementContent] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);

  /* ==========================
     Fetch Data
  ========================== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedUsers, fetchedRoles, fetchedProjects, fetchedGroups] =
          await Promise.all([
            userService.getAllUsers(),
            roleService.getAllRoles(),
            projectService.getProject(),
            groupService.getGroups()
          ]);

        setUsers(fetchedUsers);
        setRoles(fetchedRoles);
        setProjects(fetchedProjects);
        setGroups(fetchedGroups);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  /* ==========================
     Dashboard Cards
  ========================== */
  const dashboardCards = useMemo(() => {
    return [
      {
        id: 'users',
        title: 'المستخدمون',
        value: users.length,
        icon: <FiUsers />,
        color: 'indigo',
        gradient: 'from-indigo-500 to-indigo-600',
        description: 'إدارة حسابات المستخدمين وصلاحياتهم'
      },
      {
        id: 'roles',
        title: 'الأدوار',
        value: roles.length,
        icon: <FiDatabase />,
        color: 'pink',
        gradient: 'from-pink-500 to-pink-600',
        description: 'تحديد وتعديل أدوار النظام'
      },
      {
        id: 'projects',
        title: 'المشاريع',
        value: projects.length,
        icon: <FiLayers />,
        color: 'amber',
        gradient: 'from-amber-400 to-amber-500',
        description: 'متابعة مشاريع التخرج المقترحة'
      },
      {
        id: 'groups',
        title: 'المجموعات',
        value: groups.length,
        icon: <FiUsers />,
        color: 'purple',
        gradient: 'from-purple-500 to-purple-600',
        description: 'إدارة مجموعات الطلاب والفرق'
      }
    ];
  }, [users, roles, projects, groups]);

  /* ==========================
     Render Management Content
  ========================== */
  const renderManagementContent = () => {
    if (!activeCardPanel || !showManagementContent) return null;

    return (
      <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeCardPanel === 'المستخدمون' && <UsersTable />}
        {activeCardPanel === 'الأدوار' && <RolesTable />}
        {activeCardPanel === 'المجموعات' && <GroupsTable />}
        {activeCardPanel === 'المشاريع' && (
          <div className="mt-6">
            <ProjectsTable />
          </div>
        )}
      </div>
    );
  };

  /* ==========================
     Render Reports
  ========================== */
  const renderReport = () => {
    if (!activeCardPanel || !activeReport) return null;

    return (
      <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeReport === 'users' && <UsersReport />}
        {activeReport === 'projects' && <ProjectReport />}
        {activeReport === 'groups' && <GroupsReport />}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans system-manager-theme" dir="rtl">
      {/* Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 w-72 bg-[#0F172A] text-white z-[60] transition-transform duration-300 ease-out shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-8 flex items-center justify-between border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FiActivity size={22} className="text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">نظام الإدارة</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="p-4 mt-4 space-y-1">
          {[
            { id: 'home', label: 'الرئيسية', icon: <FiHome /> },
            { id: 'users', label: 'المستخدمون', icon: <FiUsers /> },
            { id: 'projects', label: 'المشاريع', icon: <FiLayers /> },
            { id: 'groups', label: 'المجموعات', icon: <FiUsers /> },
            { id: 'approvals', label: 'الموافقات', icon: <FiFileText /> },
            { id: 'settings', label: 'الإعدادات', icon: <FiSettings /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setActiveCardPanel(null);
                setShowManagementContent(false);
                setActiveReport(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className={`${activeTab === tab.id ? 'text-white' : 'group-hover:text-white'}`}>
                {tab.icon}
              </span>
              <span className="font-bold text-sm">{tab.label}</span>
              {activeTab === tab.id && <FiChevronLeft className="mr-auto" />}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-8 left-0 right-0 px-6">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">المسؤول الحالي</p>
            <p className="text-sm font-bold text-white">مدير النظام</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200"
            >
              <FiMenu size={20} />
            </button>
            <h2 className="text-xl font-black text-slate-800">
              {activeTab === 'home' ? 'لوحة التحكم الرئيسية' : 
               activeTab === 'users' ? 'إدارة المستخدمين' :
               activeTab === 'projects' ? 'إدارة المشاريع' :
               activeTab === 'groups' ? 'إدارة المجموعات' :
               activeTab === 'approvals' ? 'الموافقات والطلبات' : 'الإعدادات'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsNotifPanelOpen(true)}
              className="relative p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200"
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 badge-blue text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 pr-2">
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-slate-800 leading-none">أدمن النظام</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">مدير عام</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md flex items-center justify-center text-white font-black">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'home' && (
            <div className="max-w-7xl mx-auto space-y-10">
              {/* Welcome Section */}
              <div className="relative overflow-hidden hero-blue p-10 shadow-2xl">
                <div className="relative z-10">
                  <h1 className="text-3xl font-black mb-3">مرحباً بك مجدداً، مدير النظام 👋</h1>
                  <p className="max-w-xl leading-relaxed font-medium text-white/90">
                    إليك نظرة سريعة على حالة النظام اليوم. يمكنك إدارة المستخدمين، المشاريع، والمجموعات من خلال البطاقات أدناه.
                  </p>
                </div>
                <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-20%] right-[-5%] w-48 h-48 bg-primary-decor rounded-full blur-2xl"></div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => {
                      setActiveCardPanel(card.title);
                      setShowManagementContent(false);
                      setActiveReport(null);
                    }}
                    className={`group theme-card p-6 rounded-[1.5rem] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden`}
                  >
                    <div className="flex flex-col h-full relative z-10">
                      <div className="w-14 h-14 rounded-2xl icon-circle flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-105">
                        {React.cloneElement(card.icon as React.ReactElement, { size: 20 })}
                      </div>
                      <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{card.title}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800">{card.value}</span>
                        <span className="chip-blue text-sm ml-2">نظرة</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-4 font-medium leading-tight">{card.description}</p>
                    </div>
                    {/* Hover background decoration */}
                    <div style={{ background: 'var(--primary-blue-50)' }} className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                ))}
              </div>

              {/* Action Panel Section */}
              {activeCardPanel && (
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 theme-card rounded-2xl flex items-center justify-center text-slate-600">
                          <FiActivity size={24} />
                        </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800">{activeCardPanel}</h3>
                        <p className="text-slate-400 text-sm font-medium">اختر الإجراء المطلوب تنفيذه</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveCardPanel(null)}
                      className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      <FiX size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button
                      onClick={() => {
                        setShowManagementContent(true);
                        setActiveReport(null);
                      }}
                      className={`group relative overflow-hidden p-8 rounded-3xl border-2 transition-all duration-300 text-right ${
                          showManagementContent 
                            ? 'border-transparent bg-primary-decor/30' 
                            : 'border-slate-100 hover:border-primary-decor hover:bg-primary-decor/10'
                        }`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          showManagementContent ? 'icon-circle' : 'chip-blue'
                        }`}>
                          <FiSettings size={24} />
                        </div>
                        <span className={`text-lg font-black ${showManagementContent ? 'text-blue-700' : 'text-slate-800'}`}>
                          إدارة {activeCardPanel}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        الوصول إلى أدوات التحكم الكاملة، الإضافة، التعديل، والحذف لبيانات {activeCardPanel}.
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        if (activeCardPanel === 'المجموعات') setActiveReport('groups');
                        else if (activeCardPanel === 'المشاريع') setActiveReport('projects');
                        else setActiveReport('users');
                        setShowManagementContent(false);
                      }}
                      className={`group relative overflow-hidden p-8 rounded-3xl border-2 transition-all duration-300 text-right ${
                          activeReport 
                            ? 'border-transparent bg-primary-decor/30' 
                            : 'border-slate-100 hover:border-primary-decor hover:bg-primary-decor/10'
                        }`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          activeReport ? 'icon-circle' : 'chip-blue'
                        }`}>
                          <FiPieChart size={24} />
                        </div>
                        <span className={`text-lg font-black ${activeReport ? 'text-primary-700' : 'text-slate-800'}`}>
                          عرض التقارير
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        استعراض الإحصائيات المتقدمة، التقارير التفصيلية، وتحليل البيانات الخاصة بـ {activeCardPanel}.
                      </p>
                    </button>
                  </div>

                  {renderManagementContent()}
                  {renderReport()}
                </div>
              )}
            </div>
          )}

          {activeTab !== 'home' && (
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'users' && <UsersTable />}
              {activeTab === 'groups' && <GroupsTable />}
              {activeTab === 'projects' && <ProjectReport />}
              {activeTab === 'approvals' && (
                <div className="bg-white p-20 rounded-[2.5rem] text-center border border-slate-100 shadow-sm">
                  <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiFileText size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">قسم الموافقات</h3>
                  <p className="text-slate-500 max-w-md mx-auto">هذا القسم قيد التطوير حالياً وسيكون متاحاً قريباً لإدارة طلبات الموافقة.</p>
                </div>
              )}
              {activeTab === 'settings' && (
                <div className="bg-white p-20 rounded-[2.5rem] text-center border border-slate-100 shadow-sm">
                  <div className="w-24 h-24 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiSettings size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">إعدادات النظام</h3>
                  <p className="text-slate-500 max-w-md mx-auto">تخصيص إعدادات النظام، التنبيهات، والخيارات العامة.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <NotificationsPanel
        isOpen={isNotifPanelOpen}
        onClose={() => setIsNotifPanelOpen(false)}
      />
    </div>
  );
};

export default SystemManagerDashboard;