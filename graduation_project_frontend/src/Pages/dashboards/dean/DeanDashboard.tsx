import React, { useState, useEffect } from 'react';
import { useAuthStore, useNotificationsStore } from '../../../store/useStore';
import { 
  FiFileText, FiUsers, FiLayers, FiBell, FiMenu, FiX, FiHome,
  FiTrendingUp, FiChevronRight, FiRefreshCw, FiFilter
} from 'react-icons/fi';
import { groupService } from '../../../services/groupService';
import { projectService } from '../../../services/projectService';
import { approvalService } from '../../../services/approvalService';
import { userService } from '../../../services/userService';
import ProjectSearch from '../ProjectSearch';
import ProjectSelectionPage from '../ProjectSelectionPage';
import NotificationsPanel from '../../../components/NotificationsPanel'; 
import { useNotifications } from '../../../hooks/useNotifications'; 
import CoSupervisorsTable from '../../../components/CoSupervisorsTable';
import SupervisorsTable from '../../../components/SupervisorsTable';
import ProjectTable from '../../../components/ProjectTable';
import ProjectReportPage from '../../../components/ProjectReportPage';
import SupervisorsReportPage from '../../../components/SupervisorsReportPage';
import CoSupervisorsReportPage from '../../../components/CoSupervisorsReportPage';

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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 overflow-hidden" dir="rtl">
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-sm z-50 transition-all duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      {/* Enhanced Sidebar */}
      <aside className={`fixed inset-y-0 right-0 w-80 bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white z-[60] transition-transform duration-500 ease-in-out shadow-2xl flex flex-col border-l border-slate-700/50 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="p-8 flex items-center justify-between border-b border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50 ring-2 ring-blue-400/20">
              <FiLayers size={22} className="drop-shadow-lg" />
            </div>
            <div>
              <span className="font-black text-lg block">لوحة التحكم</span>
              <span className="text-xs text-blue-400 font-semibold">نظام إدارة المشاريع</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="p-2.5 hover:bg-slate-800/60 rounded-xl transition-all hover:rotate-90 duration-300"
          >
            <FiX size={22}/>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => { 
                setActiveTab(tab.id as any); 
                setIsSidebarOpen(false);
                setActiveCardPanel(null);
                setViewMode(null);
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative group ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]' 
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-white hover:translate-x-[-4px]'
              }`}
            >
              <span className={`text-xl transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {tab.icon}
              </span>
              <span className="font-bold flex-1 text-right tracking-wide">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs px-2.5 py-1 rounded-full font-black shadow-lg shadow-red-500/50 animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-6 border-t border-slate-700/50 bg-gradient-to-b from-slate-900/30 to-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-2xl hover:bg-slate-800/60 transition-all duration-300 cursor-pointer group">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-2xl border-2 border-slate-600/50 shadow-xl group-hover:scale-105 transition-transform duration-300">
                {user?.name?.[0]}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
            </div>
            <div className="flex-1 overflow-hidden text-right">
              <p className="text-sm font-black text-white truncate">{user?.name}</p>
              <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">عميد الكلية</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Enhanced Header */}
        <header className="h-20 bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 rounded-xl hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 transition-all shadow-sm hover:shadow-md hover:scale-105 duration-300"
            >
              <FiMenu size={22} />
            </button>
            <div className="hidden md:block">
              <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-600 leading-tight">
                بوابة إدارة مشاريع التخرج
              </h1>
              <p className="text-xs text-blue-600 font-bold tracking-wider flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                نظام متكامل لإدارة المشاريع
              </p>
            </div>
          </div>
          
          <button 
            onClick={fetchDashboardStats}
            disabled={loading}
            className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <FiRefreshCw size={18} className={`transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 custom-scrollbar">
          {activeTab === 'home' && (
            <>
              {/* Breadcrumb */}
              <Breadcrumb />

              {/* Welcome Section */}
              {!activeCardPanel && (
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
                  <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-2">مرحباً {user?.name} 👋</h2>
                    <p className="text-blue-100 text-lg font-semibold">نظرة عامة على إحصائيات النظام</p>
                  </div>
                </div>
              )}

              {/* Enhanced Dashboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {dashboardCards.map((card, i) => (
                  <div 
                    key={i} 
                    className={`group relative bg-white rounded-3xl border border-slate-200/60 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer transform hover:scale-[1.03] hover:-translate-y-1 ${
                      card.pulse ? 'animate-pulse' : ''
                    }`}
                    onClick={() => { 
                      setActiveCardPanel(card.title); 
                      setViewMode(null); 
                    }}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} ${card.bgPattern} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    
                    {/* Content */}
                    <div className="relative z-10 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${card.gradient} text-white shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                          {card.icon}
                        </div>
                        {card.trend && (
                          <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg group-hover:bg-white/90 transition-colors">
                            <FiTrendingUp size={12} />
                            {card.trend}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-slate-500 text-sm font-bold group-hover:text-white/90 transition-colors">
                          {card.title}
                        </p>
                        <h3 className="text-4xl font-black text-slate-800 group-hover:text-white transition-colors">
                          {loading ? (
                            <span className="inline-block w-16 h-10 bg-slate-200 rounded-lg animate-pulse"></span>
                          ) : (
                            card.value
                          )}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold group-hover:text-white/70 transition-colors">
                          {card.description}
                        </p>
                      </div>
                    </div>

                    {/* Hover Effect Border */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/20 transition-all duration-500"></div>
                  </div>
                ))}
              </div>

              {/* Dynamic Sub-Panel */}
              {activeCardPanel && activeCardPanel !== 'الإشعارات' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  {/* View Mode Toggle */}
                  <div className="bg-white rounded-3xl p-4 shadow-lg border border-slate-200/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        className={`relative p-6 rounded-2xl font-black text-lg transition-all duration-300 overflow-hidden group ${
                          viewMode === 'management' 
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 scale-[1.02]' 
                            : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 hover:shadow-lg'
                        }`}
                        onClick={() => setViewMode('management')}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          <FiLayers className={viewMode === 'management' ? 'animate-bounce' : ''} />
                          إدارة {activeCardPanel}
                        </span>
                      </button>
                      
                      <button 
                        className={`relative p-6 rounded-2xl font-black text-lg transition-all duration-300 overflow-hidden group ${
                          viewMode === 'report' 
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/30 scale-[1.02]' 
                            : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 hover:from-purple-50 hover:to-pink-100 hover:text-purple-600 hover:shadow-lg'
                        }`}
                        onClick={() => setViewMode('report')}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          <FiFileText className={viewMode === 'report' ? 'animate-bounce' : ''} />
                          التقارير
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Content Area */}
                  {viewMode && (
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/60 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {/* Management Views */}
                      {viewMode === 'management' && (
                        <>
                          {activeCardPanel === 'المشاريع' && <ProjectTable />}
                          {activeCardPanel === 'المشرفون' && <SupervisorsTable />}
                          {activeCardPanel === 'المشرفون المشاركون' && <CoSupervisorsTable />}
                        </>
                      )}

                      {/* Report Views */}
                      {viewMode === 'report' && (
                        <>
                          {activeCardPanel === 'المشاريع' && <ProjectReportPage />}
                          {activeCardPanel === 'المشرفون' && <SupervisorsReportPage />}
                          {activeCardPanel === 'المشرفون المشاركون' && <CoSupervisorsReportPage />}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Panel */}
              {activeCardPanel === 'الإشعارات' && (
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/60 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <NotificationsPanel />
                </div>
              )}
            </>
          )}

          {/* Other Tabs Content */}
          {activeTab === 'groups' && (
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/60">
              <h2 className="text-2xl font-black text-slate-800 mb-6">المجموعات</h2>
              {/* Add groups content here */}
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/60">
              <ProjectSelectionPage />
            </div>
          )}

          {activeTab === 'search' && (
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/60">
              <ProjectSearch />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200/60">
              <NotificationsPanel />
            </div>
          )}
        </main>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3B82F6, #6366F1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563EB, #4F46E5);
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in-from-bottom-4 {
          from { transform: translateY(1rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slide-in-from-bottom-8 {
          from { transform: translateY(2rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .fade-in {
          animation-name: fade-in;
        }
        
        .slide-in-from-bottom-4 {
          animation-name: slide-in-from-bottom-4;
        }
        
        .slide-in-from-bottom-8 {
          animation-name: slide-in-from-bottom-8;
        }
        
        .duration-500 {
          animation-duration: 500ms;
        }
        
        .duration-700 {
          animation-duration: 700ms;
        }
      `}</style>
    </div>
  );
};

export default DeanDashboard;
