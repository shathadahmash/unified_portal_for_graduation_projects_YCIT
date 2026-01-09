import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore, useNotificationsStore } from '../../store/useStore';
import { 
  FiPlus, FiFileText, FiUsers, FiBox, FiSearch, 
  FiMenu, FiX, FiHome, FiLayers, FiBell, FiChevronLeft, FiGrid, FiLogOut
} from 'react-icons/fi';
import { groupService } from '../../services/groupService';
import GroupForm from './GroupForm';
import ProjectSearch from './ProjectSearch';
import ProjectSelectionPage from './ProjectSelectionPage';

// --- الإضافات الجديدة ---
import NotificationsPanel from '../../components/NotificationsPanel'; 
import { useNotifications } from '../../hooks/useNotifications'; 

const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { notifications, unreadCount } = useNotificationsStore();
  
  // تفعيل جلب الإشعارات التلقائي
  useNotifications();

  const [activeTab, setActiveTab] = useState<'home' | 'groups' | 'projects' | 'search' | 'notifications'>('home');
  const [myGroup, setMyGroup] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  
  // --- إضافة حالة فتح لوحة الإشعارات ---
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);

  const fetchMyGroupData = async () => {
    setLoading(true);
    try {
      const data = await groupService.getMyGroup();
      setMyGroup(data);
    } catch (error) {
      setMyGroup(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGroupData();
  }, []);

  const tabs = [
    { id: 'home', label: 'الرئيسية', icon: <FiHome /> },
    { id: 'groups', label: 'مجموعتي', icon: <FiUsers /> },
    { id: 'projects', label: 'المشاريع المقترحة', icon: <FiLayers /> },
    { id: 'search', label: 'البحث الشامل', icon: <FiSearch /> },
    { id: 'notifications', label: 'الإشعارات', icon: <FiBell />, badge: unreadCount },
  ];

  const dashboardCards = useMemo(() => [
    {
      title: 'حالة المشروع',
      value: myGroup?.project_detail?.state || 'لا يوجد مشروع',
      icon: <FiBox />,
      gradient: 'from-[#6366F1] to-[#4F46E5]',
      shadow: 'shadow-indigo-200'
    },
    {
      title: 'أعضاء الفريق',
      value: `${myGroup?.members_count || 0} أعضاء`,
      icon: <FiUsers />,
      gradient: 'from-[#EC4899] to-[#D946EF]',
      shadow: 'shadow-pink-200'
    },
    {
      title: 'نسبة الإنجاز',
      value: '15%',
      icon: <FiFileText />,
      gradient: 'from-[#10B981] to-[#059669]',
      shadow: 'shadow-emerald-200'
    }
  ], [myGroup]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden" dir="rtl">
      
      {/* --- السايد بار --- */}
      <div className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} />
      
      <aside className={`fixed inset-y-0 right-0 w-80 bg-[#0F172A] text-white z-[60] transition-transform duration-500 ease-in-out shadow-2xl flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-8 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><FiGrid size={20} /></div>
            <span className="font-black text-lg italic">لوحة التحكم</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><FiX size={24}/></button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { 
                // إذا ضغط على الإشعارات في السايدبار، نفتح اللوحة الجانبية
                if(tab.id === 'notifications') {
                   setIsNotifPanelOpen(true);
                } else {
                   setActiveTab(tab.id as any);
                }
                setIsSidebarOpen(false); 
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all relative
                ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="font-bold flex-1 text-right">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-black text-white text-xl border-2 border-slate-700 shadow-lg">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 overflow-hidden text-right">
              <p className="text-sm font-black text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">طالب معتمد</p>
            </div>
            <button className="text-slate-400 hover:text-red-400 transition-colors"><FiLogOut size={18}/></button>
          </div>
        </div>
      </aside>

      {/* --- المحتوى الرئيسي --- */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        <header className="h-24 bg-white shadow-sm border-b border-slate-100 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm">
              <FiMenu size={24} />
            </button>
            <div className="hidden md:block">
              <h1 className="text-lg font-black text-slate-800 leading-tight">البوابة الموحدة لمشاريع التخرج</h1>
              <p className="text-[10px] text-blue-600 font-bold tracking-[0.2em] uppercase italic">الجامعات اليمنية</p>
            </div>
          </div>

          <nav className="hidden xl:flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if(tab.id === 'notifications') setIsNotifPanelOpen(true);
                  else setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all relative
                  ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {tab.icon} {tab.label}
                {tab.id === 'notifications' && unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-white">
                     {unreadCount}
                   </span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
              {!myGroup && (
                <button 
                onClick={() => setShowGroupForm(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  <FiPlus size={18}/> إنشاء مجموعة
                </button>
              )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar">
          {activeTab === 'home' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {dashboardCards.map((card, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center text-2xl mb-5 shadow-xl ${card.shadow} transform group-hover:scale-110 transition-transform`}>
                      {card.icon}
                    </div>
                    <p className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-widest">{card.title}</p>
                    <h3 className="text-2xl font-black text-slate-800">{card.value}</h3>
                  </div>
                ))}
              </div>

              <div className="bg-[#1E293B] rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-x-20 -translate-y-20 blur-3xl opacity-50" />
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8 text-center lg:text-right">
                  <div>
                    <h2 className="text-3xl font-black mb-3">حالة مشروع التخرج الحالي <span className="text-blue-500">.</span></h2>
                    <p className="text-slate-400 font-medium max-w-lg">يمكنك من هنا متابعة تقدم فريقك، التواصل مع المشرف، ومراجعة حالة القبول للمشروع.</p>
                  </div>
                  
                  {myGroup ? (
                    <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-[2rem] border border-slate-700 min-w-[320px]">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">🚀</div>
                        <div className="text-right">
                          <h4 className="text-xl font-black">{myGroup.group_name}</h4>
                          <p className="text-blue-400 font-bold text-xs mt-1">{myGroup.project_detail?.title || 'جاري ربط المشروع...'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowGroupForm(true)} className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black hover:bg-blue-500 hover:text-white transition-all shadow-xl">سجل مجموعتك الآن</button>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
             {activeTab === 'groups' && (
                myGroup ? (
                   <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 max-w-5xl mx-auto overflow-hidden">
                      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-slate-50 pb-8 text-center md:text-right w-full">
                        <div>
                          <h2 className="text-4xl font-black text-slate-900 mb-2">{myGroup.group_name}</h2>
                          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">بيانات الفريق الرسمية</p>
                        </div>
                        <div className="bg-emerald-50 px-6 py-2 rounded-full border border-emerald-100">
                           <p className="text-emerald-700 font-black text-xs">الحالة: نشط</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-12">
                         <div className="space-y-6">
                            <h5 className="flex items-center gap-3 text-slate-900 font-black text-lg border-r-4 border-blue-600 pr-3">أعضاء المجموعة</h5>
                            <div className="space-y-3">
                               {myGroup.members?.map((m: any, i: number) => (
                                 <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                                   <p className="font-bold text-slate-700 italic flex items-center gap-2">👤 {m.user_detail?.name}</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-6">
                            <h5 className="flex items-center gap-3 text-slate-900 font-black text-lg border-r-4 border-indigo-600 pr-3">المشرف الأكاديمي</h5>
                            <div className="p-10 bg-indigo-50/30 border-2 border-indigo-100 border-dashed rounded-[2.5rem] text-center">
                               <div className="text-3xl mb-4">🎓</div>
                               <p className="text-2xl font-black text-indigo-900 mb-1">{myGroup.supervisors?.[0]?.user_detail?.name || 'لم يحدد بعد'}</p>
                               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">مشرف المشروع</p>
                            </div>
                         </div>
                      </div>
                   </div>
                ) : <div className="text-center py-20 text-slate-400 font-bold">يرجى تسجيل مجموعة أولاً ليتم عرض البيانات</div>
             )}
             
             {activeTab === 'projects' && <ProjectSelectionPage />}
             {activeTab === 'search' && <ProjectSearch />}
          </div>
        </main>
      </div>

      {/* --- النوافذ المنبثقة (Modals & Panels) --- */}
      {showGroupForm && <GroupForm isOpen={showGroupForm} onClose={() => setShowGroupForm(false)} onSuccess={fetchMyGroupData} />}
      
      {/* استدعاء لوحة الإشعارات الجانبية */}
      <NotificationsPanel 
        isOpen={isNotifPanelOpen} 
        onClose={() => setIsNotifPanelOpen(false)} 
      />
    </div>
  );
};

export default StudentDashboard;