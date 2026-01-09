import React, { useState } from 'react';
import { useAuthStore, useApprovalsStore, useNotificationsStore } from '../../store/useStore';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import Layout from '../../components/Layout';

const SupervisorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { approvals, pendingApprovals } = useApprovalsStore();
  const { notifications, unreadCount } = useNotificationsStore();
  
  // التبويب النشط
  const [activeTab, setActiveTab] = useState<'home' | 'approvals' | 'groups' | 'notifications'>('home');

  // حساب الإحصائيات
  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        
        {/* رأس الصفحة */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">مرحّباً، أ.د {user?.name}</h1>
            <p className="text-sm text-slate-400 mt-1">مسؤوليات: مراجعة الموافقات، إرشاد الطلاب، متابعة التقديمات والتقارير</p>
          </div>
        </div>

        {/* بطاقات إحصائية */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* بطاقة الموافقات المعلقة */}
          <div className="bg-white rounded-lg shadow p-6 border-r-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">موافقات معلقة</p>
                <p className="text-3xl font-bold text-gray-900">
                  {pendingApprovals.length}
                </p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg">
                <FiClock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          {/* بطاقة الموافقات المقبولة */}
          <div className="bg-white rounded-lg shadow p-6 border-r-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">موافقات مقبولة</p>
                <p className="text-3xl font-bold text-gray-900">
                  {approvedCount}
                </p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <FiCheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          {/* بطاقة الموافقات المرفوضة */}
          <div className="bg-white rounded-lg shadow p-6 border-r-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">موافقات مرفوضة</p>
                <p className="text-3xl font-bold text-gray-900">
                  {rejectedCount}
                </p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <FiXCircle className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          {/* بطاقة الإجمالي */}
          <div className="bg-white rounded-lg shadow p-6 border-r-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">إجمالي الموافقات</p>
                <p className="text-3xl font-bold text-gray-900">
                  {approvals.length}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <FiCheckCircle className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* التبويبات */}
        <div className="border-b border-gray-200">
          <div className="flex gap-8">
            
            {/* تبويب الرئيسية */}
            <button
              onClick={() => setActiveTab('home')}
              className={`pb-4 font-semibold transition ${
                activeTab === 'home'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              الرئيسية
            </button>

            {/* تبويب الموافقات */}
            <button
              onClick={() => setActiveTab('approvals')}
              className={`pb-4 font-semibold transition ${
                activeTab === 'approvals'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              الموافقات ({pendingApprovals.length})
            </button>

            {/* تبويب المجموعات */}
            <button
              onClick={() => setActiveTab('groups')}
              className={`pb-4 font-semibold transition ${
                activeTab === 'groups'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              المجموعات
            </button>

            {/* تبويب الإشعارات */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`pb-4 font-semibold relative transition ${
                activeTab === 'notifications'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              الإشعارات
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* محتوى التبويبات */}
        <div className="mt-6">
          
          {/* محتوى تبويب الموافقات */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((approval) => (
                  <div 
                    key={approval.approval_id} 
                    className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">
                          {approval.approval_type}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          من: {approval.requested_by.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(approval.created_at).toLocaleString('ar-SA')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                          موافقة
                        </button>
                        <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">
                          رفض
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 py-8">
                  لا توجد موافقات معلقة
                </p>
              )}
            </div>
          )}

          {/* محتوى تبويب الإشعارات */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif.notification_id} 
                    className="bg-white p-4 rounded-lg border border-gray-200"
                  >
                    <p className="font-semibold text-gray-900">
                      {notif.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notif.message}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 py-8">
                  لا توجد إشعارات
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SupervisorDashboard;
