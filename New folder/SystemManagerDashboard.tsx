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
  FiDatabase
} from 'react-icons/fi';

import { userService } from '../../services/userService';
import { roleService } from '../../services/roleService';
import { projectService } from '../../services/projectService';
import { groupService } from '../../services/groupService';

import NotificationsPanel from '../../components/NotificationsPanel';
import UsersTable from '../../components/UsersTable';
import RolesTable from '../../components/RolesTable';
import GroupsTable from '../../components/GroupsTable'; // ✅ NEW
import UsersReport from '../../components/UsersReport';
import ProjectReport from '../../components/ProjectReport';
import GroupsReport from '../../components/GroupsReport'; // ✅ NEW

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
    };

    fetchData();
  }, []);

  /* ==========================
     Dashboard Cards
  ========================== */
  const dashboardCards = useMemo(() => {
    return [
      {
        title: 'المستخدمون',
        value: users.length,
        icon: <FiUsers />,
        gradient: 'from-indigo-500 to-indigo-700'
      },
      {
        title: 'الأدوار',
        value: roles.length,
        icon: <FiDatabase />,
        gradient: 'from-pink-500 to-pink-700'
      },
      {
        title: 'المشاريع',
        value: projects.length,
        icon: <FiLayers />,
        gradient: 'from-yellow-400 to-yellow-600'
      },
      {
        title: 'المجموعات',
        value: groups.length,
        icon: <FiUsers />,
        gradient: 'from-purple-500 to-purple-700'
      },
      {
        title: 'الإشعارات',
        value: unreadCount,
        icon: <FiBell />,
        gradient: 'from-red-500 to-red-700',
        isNotification: true
      }
    ];
  }, [users, roles, projects, groups, unreadCount]);

  /* ==========================
     Render Management Content
  ========================== */
  const renderManagementContent = () => {
    if (!activeCardPanel || !showManagementContent) return null;

    switch (activeCardPanel) {
      case 'المستخدمون':
        return <UsersTable />;

      case 'الأدوار':
        return <RolesTable />;

      case 'المجموعات':
        return <GroupsTable />; // ✅ LINKED HERE

      case 'المشاريع':
        return (
          <div className="p-4 text-center text-gray-600">
            لإدارة المشاريع، استخدم زر "التقارير" لمشاهدة التفاصيل.
          </div>
        );

      default:
        return null;
    }
  };

  /* ==========================
     Render Reports
  ========================== */
  const renderReport = () => {
    if (!activeCardPanel || !activeReport) return null;

    switch (activeReport) {
      case 'users':
        return <UsersReport />;

      case 'projects':
        return <ProjectReport />;

      case 'groups':
        return <GroupsReport />; // ✅ LINKED HERE

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]" dir="rtl">
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 w-80 bg-[#0F172A] text-white z-[60] transition-transform ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 flex justify-between border-b border-slate-800">
          <span className="font-black">لوحة مدير النظام</span>
          <button onClick={() => setIsSidebarOpen(false)}>
            <FiX size={22} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
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
              className={`w-full flex gap-4 p-4 rounded-xl ${
                activeTab === tab.id ? 'bg-blue-600' : 'hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span className="flex-1 text-right">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b px-6 flex items-center">
          <button onClick={() => setIsSidebarOpen(true)}>
            <FiMenu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'home' && (
            <>
              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {dashboardCards.map((card, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (card.isNotification) {
                        setIsNotifPanelOpen(true);
                        return;
                      }
                      setActiveCardPanel(card.title);
                      setShowManagementContent(false);
                      setActiveReport(null);
                    }}
                    className="bg-white p-6 rounded-2xl shadow hover:shadow-xl cursor-pointer"
                  >
                    <div className="flex gap-4 items-center">
                      <div
                        className={`w-12 h-12 rounded-xl text-white flex items-center justify-center bg-gradient-to-br ${card.gradient}`}
                      >
                        {card.icon}
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-xs text-slate-400">{card.title}</p>
                        <h3 className="text-xl font-black">{card.value}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Management Buttons */}
              {activeCardPanel && (
                <div className="space-y-4 p-4">
                  <h3 className="text-lg font-black text-center">
                    {activeCardPanel}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                    <div
                      className="bg-blue-600 text-white p-4 rounded-xl font-semibold text-sm text-center cursor-pointer hover:bg-blue-700 min-h-[70px] flex items-center justify-center"
                      onClick={() => setShowManagementContent(true)}
                    >
                      إدارة {activeCardPanel}
                    </div>

                    {/* Added التقارير button for المجموعات */}
                    {activeCardPanel === 'المجموعات' && (
                      <div
                        className="bg-slate-600 text-white p-4 rounded-xl font-semibold text-sm text-center cursor-pointer hover:bg-slate-700 min-h-[70px] flex items-center justify-center"
                        onClick={() => setActiveReport('groups')}
                      >
                        التقارير
                      </div>
                    )}

                    {/* Existing التقارير logic for other panels */}
                    {activeCardPanel !== 'المجموعات' && activeCardPanel !== 'الإشعارات' && (
                      <div
                        className="bg-slate-600 text-white p-4 rounded-xl font-semibold text-sm text-center cursor-pointer hover:bg-slate-700 min-h-[70px] flex items-center justify-center"
                        onClick={() => {
                          if (activeCardPanel === 'المشاريع')
                            setActiveReport('projects');
                          else setActiveReport('users');
                        }}
                      >
                        التقارير
                      </div>
                    )}
                  </div>

                  {renderManagementContent()}
                  {renderReport()}
                </div>
              )}
            </>
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
