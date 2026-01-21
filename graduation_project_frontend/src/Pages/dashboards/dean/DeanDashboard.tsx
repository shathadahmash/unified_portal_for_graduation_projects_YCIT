import React, { useState, useEffect } from 'react';
import { useAuthStore, useNotificationsStore } from '../../../store/useStore';
import {
  FiFileText, FiUsers, FiLayers, FiBell, FiMenu, FiX, FiHome,
  FiTrendingUp, FiChevronRight, FiRefreshCw, FiFilter,
  FiActivity, FiSettings, FiChevronLeft, FiPieChart
} from 'react-icons/fi';
import { groupService } from '../../../services/groupService';
import { projectService } from '../../../services/projectService';
import { approvalService } from '../../../services/approvalService';
import { userService } from '../../../services/userService';
import ProjectSearch from '../ProjectSearch';
import ProjectSelectionPage from '../ProjectSelectionPage';
import NotificationsPanel from '../../../components/NotificationsPanel'; 
import { useNotifications } from '../../../hooks/useNotifications'; 
import CoSupervisorsTable from './CoSupervisorsTable';
import SupervisorsTable from './SupervisorsTable';
import ProjectTable from './ProjectTable';
import ProjectReportPage from './ProjectReportPage';
import SupervisorsReportPage from './SupervisorsReportPage';
import CoSupervisorsReportPage from './CoSupervisorsReportPage';

const DeanDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { notifications, unreadCount } = useNotificationsStore();
  useNotifications();

  const [activeTab, setActiveTab] = useState<'home' | 'groups' | 'projects' | 'approvals' | 'search' | 'notifications'>('home');
  const [stats, setStats] = useState({
    projects: 0,
    supervisors: 0,
    coSupervisors: 0,
    groups: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [activeCardPanel, setActiveCardPanel] = useState<string | null>(null); 
  const [viewMode, setViewMode] = useState<'management' | 'report' | null>(null);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const showManagementContent = viewMode === 'management';

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const [groups, projects, approvals, allUsers] = await Promise.all([
        groupService.getGroups(),
        projectService.getProjects(),
        approvalService.getApprovals(),
        userService.getAllUsers()
      ]);

      const supervisorsCount = allUsers.filter((u: any) => 
        u.roles?.some((r: any) => {
          const type = r.type?.toLowerCase();
          return type === 'supervisor' || type === 'super_visor';
        })
      ).length;

      const coSupervisorsCount = allUsers.filter((u: any) => 
        u.roles?.some((r: any) => {
          const type = r.type?.toLowerCase();
          return type === 'co_supervisor' || type === 'cosupervisor' || type === 'co-supervisor';
        })
      ).length;

      setStats({
        projects: Array.isArray(projects) ? projects.length : 0,
        supervisors: supervisorsCount,
        coSupervisors: coSupervisorsCount,
        groups: Array.isArray(groups) ? groups.length : 0,
        pendingApprovals: Array.isArray(approvals) ? approvals.length : 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardStats(); }, []);

  const tabs = [
    { id: 'home', label: 'الرئيسية', icon: <FiHome /> },
    { id: 'groups', label: 'المجموعات', icon: <FiUsers /> },
    { id: 'projects', label: 'المشاريع', icon: <FiLayers /> },
    { id: 'approvals', label: 'الموافقات', icon: <FiFileText />, badge: stats.pendingApprovals },
    { id: 'search', label: 'البحث الشامل', icon: <FiFilter /> },
    { id: 'notifications', label: 'الإشعارات', icon: <FiBell />, badge: unreadCount },
  ];

  const dashboardCards = [
    { 
      title: 'المشاريع', 
      value: stats.projects, 
      icon: <FiLayers />, 
      gradient: 'from-[#667EEA] via-[#764BA2] to-[#667EEA]',
      bgPattern: 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))]',
      trend: '+12%',
      description: 'إجمالي المشاريع المسجلة'
    },
    { 
      title: 'المشرفون', 
      value: stats.supervisors, 
      icon: <FiUsers />, 
      gradient: 'from-[#F093FB] via-[#F5576C] to-[#F093FB]',
      bgPattern: 'bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))]',
      trend: '+5%',
      description: 'المشرفون الأكاديميون'
    },
    { 
      title: 'المشرفون المشاركون', 
      value: stats.coSupervisors, 
      icon: <FiUsers />, 
      gradient: 'from-[#4FACFE] via-[#00F2FE] to-[#4FACFE]',
      bgPattern: 'bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))]',
      trend: '+8%',
      description: 'المشرفون المشاركون'
    },
    { 
      title: 'المجموعات', 
      value: stats.groups, 
      icon: <FiUsers />, 
      gradient: 'from-[#FA709A] via-[#FEE140] to-[#FA709A]',
      bgPattern: 'bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))]',
      trend: '+3%',
      description: 'مجموعات الطلاب'
    },
    { 
      title: 'الإشعارات', 
      value: unreadCount, 
      icon: <FiBell />, 
      gradient: 'from-[#FF6B6B] via-[#EE5A6F] to-[#FF6B6B]',
      bgPattern: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]',
      trend: 'جديد',
      description: 'إشعارات غير مقروءة',
      pulse: unreadCount > 0
    },
  ];

  // Breadcrumb component
  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-sm mb-6">
      <span className="text-slate-600 hover:text-blue-600 cursor-pointer transition-colors font-semibold">
        الرئيسية
      </span>
      {activeCardPanel && (
        <>
          <FiChevronRight className="text-slate-400" size={16} />
          <span className="text-slate-600 hover:text-blue-600 cursor-pointer transition-colors font-semibold">
            {activeCardPanel}
          </span>
        </>
      )}
      {viewMode && (
        <>
          <FiChevronRight className="text-slate-400" size={16} />
          <span className="text-blue-600 font-bold">
            {viewMode === 'management' ? 'الإدارة' : 'التقارير'}
          </span>
        </>
      )}
    </div>
  );

  return (
    <div className="system-manager-theme flex h-screen bg-[#F8FAFC] font-sans" dir="rtl">
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
            <div className="sidebar-dean-icon">
              <FiActivity size={18} className="text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">لوحة العميد</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="p-4 mt-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setActiveCardPanel(null);
                setViewMode(null);
                setActiveReport(null);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 group ${
                activeTab === tab.id 
                  ? 'tab-active-dean' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className={`${activeTab === tab.id ? 'text-white' : 'group-hover:text-white'}`}>
                {tab.icon}
              </span>
              <span className="font-bold text-sm">{tab.label}</span>
              {tab.badge && <span className="mr-auto text-xs badge-dean">{tab.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-8 left-0 right-0 px-6">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">المسؤول الحالي</p>
            <p className="text-sm font-bold text-white">عميد الكلية</p>
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
            <h2 className="text-xl font-black text-slate-800">لوحة العميد</h2>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsNotifPanelOpen(true)}
              className="relative p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200"
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 badge-dean-dot text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 pr-2">
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-slate-800 leading-none">{user?.name || 'العميد'}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">إدارة الكلية</p>
              </div>
              <div className="w-10 h-10 icon-circle rounded-xl shadow-md flex items-center justify-center text-white font-black">
                {user?.name?.[0] || 'ع'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'home' && (
            <div className="max-w-7xl mx-auto space-y-10">
              {/* Welcome Section */}
              <div className="hero-blue p-10 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h1 className="text-3xl font-black mb-3">مرحباً {user?.name || 'العميد'} </h1>
                  <p className="text-primary-50 max-w-xl leading-relaxed font-medium">
                    نظرة سريعة على حالة الكلية اليوم.
                  </p>
                </div>
                <div className="absolute top-0 left-0 w-64 h-64 primary-decor rounded-full opacity-30 -translate-y-1/2 -translate-x-1/4 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 primary-decor rounded-full opacity-20 translate-y-1/4 translate-x-1/6 blur-2xl"></div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardCards.map((card) => (
                  <div
                    key={card.title}
                    onClick={() => {
                      setActiveCardPanel(card.title);
                      setViewMode(null);
                      setActiveReport(null);
                    }}
                    className={`group theme-card p-6 rounded-[1.25rem] transition-all duration-300 cursor-pointer relative overflow-hidden`}
                  >
                    <div className="flex flex-col h-full relative z-10">
                      <div className="w-14 h-14 icon-circle text-white flex items-center justify-center group-hover:scale-105 transition-transform duration-300 mb-6">
                        {React.cloneElement(card.icon as any, { size: 20 })}
                      </div>
                      <h3 className="text-primary-700 text-xs font-black uppercase tracking-widest mb-1">{card.title}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800">{card.value}</span>
                        <span className="text-[10px] font-bold badge-blue">{card.trend || ''}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-4 font-medium leading-tight">{card.description}</p>
                    </div>
                    <div className={`absolute -bottom-6 -left-6 w-24 h-24 primary-decor rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500`}></div>
                  </div>
                ))}
              </div>

              {/* Action Panel Section */}
              {activeCardPanel && (
                <div className="theme-card p-8 rounded-[1.5rem] animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
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
                        setViewMode('management');
                        setActiveReport(null);
                      }}
                      className={`group relative overflow-hidden p-8 rounded-3xl transition-all duration-300 text-right ${
                        showManagementContent 
                          ? 'border-2 border-primary-700 bg-primary-50' 
                          : 'border border-slate-100 hover:border-primary-50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          showManagementContent ? 'icon-circle' : 'chip-blue'
                        }`}>
                          <FiSettings size={24} />
                        </div>
                        <span className={`text-lg font-black ${showManagementContent ? 'text-primary-700' : 'text-slate-800'}`}>
                          إدارة {activeCardPanel}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed">الوصول إلى أدوات التحكم المتاحة ل{activeCardPanel}.</p>
                    </button>

                    <button
                      onClick={() => {
                        setViewMode('report');
                        setActiveReport(activeCardPanel || null);
                      }}
                      className={`group relative overflow-hidden p-8 rounded-3xl transition-all duration-300 text-right ${
                        activeReport 
                          ? 'border-2 border-primary-700 bg-primary-50' 
                          : 'border border-slate-100 hover:border-primary-50 hover:bg-slate-50'
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
                      <p className="text-slate-500 text-sm leading-relaxed">استعراض الإحصائيات والتحليلات ل{activeCardPanel}.</p>
                    </button>
                  </div>

                  {/* Management / Report Content */}
                  {viewMode === 'management' && (
                    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {activeCardPanel === 'المشاريع' && <ProjectTable />}
                      {activeCardPanel === 'المشرفون' && <SupervisorsTable />}
                      {activeCardPanel === 'المشرفون المشاركون' && <CoSupervisorsTable />}
                    </div>
                  )}

                  {viewMode === 'report' && (
                    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {activeReport === 'المشاريع' && <ProjectReportPage />}
                      {activeReport === 'المشرفون' && <SupervisorsReportPage />}
                      {activeReport === 'المشرفون المشاركون' && <CoSupervisorsReportPage />}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="theme-card p-8 rounded-3xl">
              <h2 className="text-2xl font-black text-slate-800 mb-6">المجموعات</h2>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="theme-card p-8 rounded-3xl">
              <ProjectSelectionPage />
            </div>
          )}

          {activeTab === 'search' && (
            <div className="theme-card p-8 rounded-3xl">
              <ProjectSearch />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="theme-card p-8 rounded-3xl">
              <NotificationsPanel />
            </div>
          )}
        </main>
      </div>

      <NotificationsPanel isOpen={isNotifPanelOpen} onClose={() => setIsNotifPanelOpen(false)} />
    </div>
  );
};

export default DeanDashboard;
